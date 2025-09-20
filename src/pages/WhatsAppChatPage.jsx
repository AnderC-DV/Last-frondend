import React, { useEffect, useState, useCallback, useRef } from 'react';
import { getConversations, sendMessage, getConversation, getMediaUrl, sendAudioFromGCS, sendDocumentFromGCS, sendImageFromGCS, sendVideoFromGCS, sendStickerFromGCS, getSignedUploadForMedia } from '../services/api';
import DocumentPreviewModal from '../components/DocumentPreviewModal';
import WppConversationSidebar from '../components/WppConversationSidebar';
import WppChatArea from '../components/WppChatArea';
import WppClientInfo from '../components/WppClientInfo';


const WhatsAppChatPage = () => {
  const [conversations, setConversations] = useState([]);
  const [selectedConversation, setSelectedConversation] = useState(null);
  const [messages, setMessages] = useState([]);
  const [newMessage, setNewMessage] = useState('');
  const [previewFileUrl, setPreviewFileUrl] = useState(null);
  const [selectedMediaFile, setSelectedMediaFile] = useState(null);
  const [mediaType, setMediaType] = useState('');
  const [isUploadingMedia, setIsUploadingMedia] = useState(false);
  const [showScrollButton, setShowScrollButton] = useState(false);
  const [isNearBottom, setIsNearBottom] = useState(true);
  const messagesEndRef = useRef(null);
  const messagesContainerRef = useRef(null);

  // Definir funciones antes de usarlas en useEffect
  const scrollToBottom = useCallback(() => {
    messagesEndRef.current?.scrollIntoView({ behavior: 'smooth' });
  }, []);

  const handleScroll = useCallback(() => {
    if (!messagesContainerRef.current) return;

    const container = messagesContainerRef.current;
    const scrollTop = container.scrollTop;
    const scrollHeight = container.scrollHeight;
    const clientHeight = container.clientHeight;

    // Detectar si está cerca del final (últimos 100px)
    const isNearBottom = scrollTop + clientHeight >= scrollHeight - 100;
    setIsNearBottom(isNearBottom);

    // Mostrar/ocultar botón de scroll
    const shouldShowButton = scrollTop + clientHeight < scrollHeight - 200;
    setShowScrollButton(shouldShowButton);
  }, []);

  useEffect(() => {
    const fetchConversations = async () => {
      try {
        const data = await getConversations();
        setConversations(data);
      } catch (error) {
        console.error('Error fetching conversations:', error);
      }
    };

    fetchConversations();
  }, []);

  useEffect(() => {
    if (selectedConversation) {
      const fetchMessages = async () => {
        try {
          const conversationData = await getConversation(selectedConversation.id);
          const newMessages = conversationData.messages || [];

          // Auto-scroll si estamos cerca del final y llegan nuevos mensajes
          const hasNewMessages = newMessages.length !== messages.length;
          setMessages(newMessages);

          // Hacer scroll automático si estamos cerca del final
          if (hasNewMessages && isNearBottom) {
            setTimeout(scrollToBottom, 100);
          }
        } catch (error) {
          console.error('Error fetching messages:', error);
        }
      };

      fetchMessages();

      // Polling for updates every 5 seconds
      const interval = setInterval(fetchMessages, 5000);

      return () => clearInterval(interval);
    } else {
      setMessages([]);
    }
  }, [selectedConversation, scrollToBottom, messages.length, isNearBottom]);

  // Efecto para hacer scroll inicial cuando se carga la conversación
  useEffect(() => {
    if (messages.length > 0) {
      setTimeout(scrollToBottom, 100);
    }
  }, [messages.length, scrollToBottom]);

  // Efecto para manejar el scroll del contenedor de mensajes
  useEffect(() => {
    const container = messagesContainerRef.current;
    if (container) {
      const handleScrollEvent = () => {
        if (!messagesContainerRef.current) return;

        const scrollContainer = messagesContainerRef.current;
        const scrollTop = scrollContainer.scrollTop;
        const scrollHeight = scrollContainer.scrollHeight;
        const clientHeight = scrollContainer.clientHeight;

        // Detectar si está cerca del final (últimos 100px)
        const isNearBottom = scrollTop + clientHeight >= scrollHeight - 100;
        setIsNearBottom(isNearBottom);

        // Mostrar/ocultar botón de scroll
        const shouldShowButton = scrollTop + clientHeight < scrollHeight - 200;
        setShowScrollButton(shouldShowButton);
      };

      container.addEventListener('scroll', handleScrollEvent);
      return () => container.removeEventListener('scroll', handleScrollEvent);
    }
  }, []);

  const handleSendMessage = async () => {
    if (newMessage.trim() === '' || !selectedConversation) return;

    try {
      const messageData = {
        messaging_product: "whatsapp",
        recipient_type: "individual",
        to: selectedConversation.customer_phone_number,
        type: 'text',
        text: { body: newMessage },
      };
      const response = await sendMessage(selectedConversation.id, messageData);
      // Assuming the response contains the sent message, add it to messages
      if (response) {
        setMessages(prevMessages => [...prevMessages, response]);
        // Hacer scroll automático al enviar mensaje
        setTimeout(scrollToBottom, 100);
      }
      setNewMessage('');
    } catch (error) {
      console.error('Error sending message:', error);
      // Silenciar errores comunes para no molestar al usuario
      // Solo mostrar alert para errores críticos
      if (error.message && !error.message.includes('CORS') && !error.message.includes('Failed to fetch')) {
        alert('Error al enviar el mensaje: ' + error.message);
      }
    }
  };

  const handleMediaFileSelect = (event, type) => {
    const file = event.target.files[0];
    if (file) {
      setSelectedMediaFile(file);
      setMediaType(type);
    }
  };




  const handleSendMedia = async () => {
    if (!selectedMediaFile || !selectedConversation || !mediaType) return;

    setIsUploadingMedia(true);
    try {
      // Determinar el tipo MIME correcto
      let mimeType = selectedMediaFile.type;
      if (mediaType === 'audio' && !mimeType) {
        mimeType = 'audio/mpeg';
      } else if (!mimeType) {
        mimeType = 'application/octet-stream';
      }

      // Paso 1: Obtener URL firmada para subida directa a GCS
      const signedUploadResponse = await getSignedUploadForMedia(
        selectedConversation.id,
        mimeType,
        mediaType,
        selectedMediaFile.name
      );

      // Paso 2: Subir archivo directamente a GCS
      const uploadResponse = await fetch(signedUploadResponse.upload_url, {
        method: 'PUT',
        body: selectedMediaFile,
        headers: {
          'Content-Type': signedUploadResponse.content_type,
        },
      });

      if (!uploadResponse.ok) {
        throw new Error('Error al subir el archivo a Google Cloud Storage');
      }

      // Paso 3: Enviar mensaje usando el objeto de GCS
      const storageObject = signedUploadResponse.storage_object;

      let response;
      switch (mediaType) {
        case 'image':
          response = await sendImageFromGCS(selectedConversation.id, { storage_object: storageObject, mime_type: mimeType });
          break;
        case 'video':
          response = await sendVideoFromGCS(selectedConversation.id, { storage_object: storageObject, mime_type: mimeType });
          break;
        case 'audio':
          response = await sendAudioFromGCS(selectedConversation.id, { storage_object: storageObject, mime_type: mimeType });
          break;
        case 'document':
          response = await sendDocumentFromGCS(selectedConversation.id, { storage_object: storageObject, mime_type: mimeType }, selectedMediaFile.name);
          break;
        case 'sticker':
          response = await sendStickerFromGCS(selectedConversation.id, { storage_object: storageObject, mime_type: mimeType });
          break;
        default:
          throw new Error('Tipo de medio no soportado');
      }

      if (response) {
        setMessages(prevMessages => [...prevMessages, response]);
        setTimeout(scrollToBottom, 100);
      }
      setSelectedMediaFile(null);
      setMediaType('');
      setIsUploadingMedia(false);
    } catch (error) {
      setIsUploadingMedia(false);
      console.error('Error sending media:', error);

      // Silenciar errores comunes para no molestar al usuario
      // Solo mostrar alert para errores críticos
      if (error.message && !error.message.includes('CORS') && !error.message.includes('Failed to fetch')) {
        alert('Error al enviar el medio: ' + error.message);
      }
    }
  };
  return (
    <div className="flex h-full min-h-0 bg-gray-50 overflow-hidden">
      <WppConversationSidebar
        conversations={conversations}
        selectedConversation={selectedConversation}
        onSelectConversation={setSelectedConversation}
      />

      <WppChatArea
        selectedConversation={selectedConversation}
        messages={messages}
        newMessage={newMessage}
        setNewMessage={setNewMessage}
        handleSendMessage={handleSendMessage}
        handleMediaFileSelect={handleMediaFileSelect}
        selectedMediaFile={selectedMediaFile}
        handleSendMedia={handleSendMedia}
        isUploadingMedia={isUploadingMedia}
        onDocumentClick={setPreviewFileUrl}
        messagesEndRef={messagesEndRef}
        messagesContainerRef={messagesContainerRef}
        showScrollButton={showScrollButton}
        scrollToBottom={scrollToBottom}
      />

      <WppClientInfo />

      <DocumentPreviewModal fileUrl={previewFileUrl} onClose={() => setPreviewFileUrl(null)} />
    </div>
  );
};

export default WhatsAppChatPage;
