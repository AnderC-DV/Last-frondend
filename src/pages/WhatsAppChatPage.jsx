import React, { useEffect, useState, useCallback, useRef } from 'react';
import { getConversations, sendMessage, getConversation, getConversationMessages, getMediaUrl, sendAudioFromGCS, sendDocumentFromGCS, sendImageFromGCS, sendVideoFromGCS, sendStickerFromGCS, getSignedUploadForMedia } from '../services/api';
import DocumentPreviewModal from '../components/DocumentPreviewModal';
import WppConversationSidebar from '../components/WppConversationSidebar';
import WppChatArea from '../components/WppChatArea';
import WppClientInfo from '../components/WppClientInfo';
import { useAuth } from '../context/AuthContext';


const WhatsAppChatPage = () => {
  const { user } = useAuth();
  const userRole = user?.decoded?.role || 'gestor'; // Default to gestor if not set

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

  // Estados para paginación
  const [isLoadingMessages, setIsLoadingMessages] = useState(false);
  const [hasMoreMessages, setHasMoreMessages] = useState(true);
  const [offset, setOffset] = useState(0);
  const [isLoadingOlderMessages, setIsLoadingOlderMessages] = useState(false);
  const [totalMessages, setTotalMessages] = useState(0);

  const messagesEndRef = useRef(null);
  const messagesContainerRef = useRef(null);

  // Función de debug para inspeccionar el estado del sistema de carga
  const debugPaginationState = useCallback(() => {
    console.log('[DEBUG] Pagination State:', {
      selectedConversation: selectedConversation?.id,
      messagesCount: messages.length,
      totalMessages,
      isLoadingMessages,
      hasMoreMessages,
      offset,
      isLoadingOlderMessages,
      messages: messages.slice(0, 3).map(m => ({
        id: m.id || m.message_id,
        type: m.message_type,
        timestamp: m.timestamp || m.created_at,
        body: m.body?.substring(0, 50)
      }))
    });
  }, [selectedConversation, messages, totalMessages, isLoadingMessages, hasMoreMessages, offset, isLoadingOlderMessages]);

  // Exponer función de debug en window para acceso desde consola
  useEffect(() => {
    window.debugPaginationState = debugPaginationState;
    return () => {
      delete window.debugPaginationState;
    };
  }, [debugPaginationState]);

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

    // Detectar si está cerca del inicio (primeros 100px) para cargar más mensajes antiguos
    const isNearTop = scrollTop <= 100;
    if (isNearTop && hasMoreMessages && !isLoadingOlderMessages && messages.length > 0) {
      loadOlderMessages();
    }
  }, [hasMoreMessages, isLoadingOlderMessages, messages.length]);

  // Función para cargar mensajes más antiguos usando paginación del backend
  const loadOlderMessages = useCallback(async () => {
    if (!selectedConversation || isLoadingOlderMessages || !hasMoreMessages) return;

    setIsLoadingOlderMessages(true);
    console.debug('[Pagination] Loading older messages for conversation:', selectedConversation.id, 'offset:', offset);

    try {
      // Cargar la siguiente página de mensajes usando offset
      const conversationData = await getConversation(selectedConversation.id, {
        limit: 20,
        offset: offset
      });

      if (conversationData && conversationData.messages && Array.isArray(conversationData.messages)) {
        const olderMessages = conversationData.messages;
        console.debug(`[Pagination] Loaded ${olderMessages.length} older messages`);

        if (olderMessages.length > 0) {
          // Guardar el scroll actual antes de agregar mensajes
          const container = messagesContainerRef.current;
          const previousScrollHeight = container.scrollHeight;

          // Agregar mensajes antiguos al inicio
          // Agregar mensajes antiguos al inicio, evitando duplicados
          setMessages(prevMessages => {
            const existingIds = new Set(prevMessages.map(m => m.id || m.message_id));
            const uniqueOlderMessages = olderMessages.filter(m => !existingIds.has(m.id || m.message_id));
            return [...uniqueOlderMessages, ...prevMessages];
          });

          // Actualizar offset para la próxima carga
          setOffset(prev => prev + 20);

          // Actualizar hasMoreMessages basado en la respuesta del backend
          setHasMoreMessages(conversationData.has_more || false);

          // Restaurar la posición del scroll después de agregar mensajes
          setTimeout(() => {
            if (container) {
              const newScrollHeight = container.scrollHeight;
              const scrollDifference = newScrollHeight - previousScrollHeight;
              container.scrollTop = scrollDifference;
            }
          }, 100);

          console.debug(`[Pagination] Updated offset to: ${offset + 50}`);
          console.debug(`[Pagination] Has more messages: ${conversationData.has_more}`);
        } else {
          setHasMoreMessages(false);
          console.debug('[Pagination] No older messages found');
        }
      } else {
        setHasMoreMessages(false);
        console.debug('[Pagination] Invalid response format');
      }
    } catch (error) {
      console.error('[Pagination] Error loading older messages:', error);
      setHasMoreMessages(false);
    } finally {
      setIsLoadingOlderMessages(false);
    }
  }, [selectedConversation, isLoadingOlderMessages, hasMoreMessages, offset]);

  useEffect(() => {
    const fetchConversations = async () => {
      try {
        const data = await getConversations();
        // Ordenar conversaciones de mayor a menor por la última hora de mensaje (más recientes primero)
        const sortedData = data.sort((a, b) => {
          const timeA = a.last_client_message_at ? new Date(a.last_client_message_at) : new Date(0);
          const timeB = b.last_client_message_at ? new Date(b.last_client_message_at) : new Date(0);
          return timeB - timeA;
        });
        setConversations(sortedData);
      } catch (error) {
        console.error('Error fetching conversations:', error);
      }
    };

    fetchConversations();
  }, []);

  // Efecto para cargar los mensajes iniciales de una conversación
  useEffect(() => {
    if (selectedConversation) {
      const fetchMessages = async () => {
        try {
          setIsLoadingMessages(true);
          // Resetear estados de paginación al cambiar de conversación
          setHasMoreMessages(true);
          setOffset(0);
          setIsLoadingOlderMessages(false);
          setTotalMessages(0);

          const conversationData = await getConversation(selectedConversation.id, { limit: 20, offset: 0 });

          if (conversationData && conversationData.messages && Array.isArray(conversationData.messages)) {
            const sortedMessages = conversationData.messages.sort((a, b) => new Date(a.timestamp) - new Date(b.timestamp));
            setMessages(sortedMessages);
            setTotalMessages(conversationData.total_messages || conversationData.messages.length);
            setHasMoreMessages(conversationData.has_more || false);
            setOffset(20);

            setTimeout(() => scrollToBottom(), 100);
          } else {
            setMessages([]);
            setHasMoreMessages(false);
            setTotalMessages(0);
          }
        } catch (error) {
          console.error('[Pagination] Error fetching recent messages:', error);
          if (error.message && !error.message.includes('CORS') && !error.message.includes('Failed to fetch')) {
            alert(`Error al cargar mensajes: ${error.message}`);
          }
          setMessages([]);
          setHasMoreMessages(false);
          setTotalMessages(0);
        } finally {
          setIsLoadingMessages(false);
        }
      };

      fetchMessages();
    } else {
      setMessages([]);
      setHasMoreMessages(false);
      setOffset(0);
      setIsLoadingOlderMessages(false);
      setIsLoadingMessages(false);
      setTotalMessages(0);
    }
  }, [selectedConversation, scrollToBottom]);

  // Efecto para polling de nuevos mensajes
  useEffect(() => {
    if (selectedConversation) {
      const interval = setInterval(async () => {
        try {
          const latestData = await getConversation(selectedConversation.id, { limit: 20, offset: 0 });

          if (latestData && latestData.messages && Array.isArray(latestData.messages)) {
            const sortedMessages = latestData.messages.sort((a, b) => new Date(a.timestamp) - new Date(b.timestamp));
            setMessages(prevMessages => {
              const existingIds = new Set(prevMessages.map(m => m.id || m.message_id));
              const newMessages = sortedMessages.filter(m => !existingIds.has(m.id || m.message_id));
              if (newMessages.length > 0) {
                if (isNearBottom) {
                  setTimeout(scrollToBottom, 100);
                }
                return [...prevMessages, ...newMessages].sort((a, b) => new Date(a.timestamp) - new Date(b.timestamp));
              }
              return prevMessages;
            });
            setTotalMessages(latestData.total_messages || latestData.messages.length);
          }
        } catch (error) {
          console.error('[Pagination] Error fetching new messages via polling:', error);
        }
      }, 5000);

      return () => clearInterval(interval);
    }
  }, [selectedConversation, isNearBottom, scrollToBottom]);

  // Efecto para manejar el scroll del contenedor de mensajes
  useEffect(() => {
    const container = messagesContainerRef.current;
    if (container) {
      container.addEventListener('scroll', handleScroll);
      return () => container.removeEventListener('scroll', handleScroll);
    }
  }, [handleScroll]);

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
          response = await sendImageFromGCS(selectedConversation.id, storageObject);
          break;
        case 'video':
          response = await sendVideoFromGCS(selectedConversation.id, storageObject);
          break;
        case 'audio':
          response = await sendAudioFromGCS(selectedConversation.id, storageObject);
          break;
        case 'document':
          response = await sendDocumentFromGCS(selectedConversation.id, storageObject, selectedMediaFile.name);
          break;
        case 'sticker':
          response = await sendStickerFromGCS(selectedConversation.id, storageObject);
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
        userRole={userRole}
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
        isLoadingMessages={isLoadingMessages}
        isLoadingOlderMessages={isLoadingOlderMessages}
        hasMoreMessages={hasMoreMessages}
      />

      {userRole !== 'administrador' && (
        <WppClientInfo selectedConversation={selectedConversation} userRole={userRole} />
      )}

      <DocumentPreviewModal fileUrl={previewFileUrl} onClose={() => setPreviewFileUrl(null)} />
    </div>
  );
};

export default WhatsAppChatPage;
