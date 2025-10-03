import React, { useEffect, useState, useCallback, useRef } from 'react';
import { getConversations, sendMessage, getConversation, BASE_URL } from '../services/api';
import DocumentPreviewModal from '../components/DocumentPreviewModal';
import ExpiredSessionModal from '../components/ExpiredSessionModal';
import WppConversationSidebar from '../components/WppConversationSidebar';
import WppChatArea from '../components/WppChatArea';
import WppClientInfo from '../components/WppClientInfo';
import { useAuth } from '../context/AuthContext';
import { useNotifications } from '../hooks/useNotifications';
import { toast } from 'sonner';


const WhatsAppChatPage = () => {
  const { subscribe } = useNotifications();
  const { user, logout } = useAuth();
  const userRole = user?.decoded?.role || 'gestor'; // Default to gestor if not set

  const [conversations, setConversations] = useState([]);
  const [selectedConversation, setSelectedConversation] = useState(null);
  const [messages, setMessages] = useState([]);
  const [newMessage, setNewMessage] = useState('');
  const [previewFileUrl, setPreviewFileUrl] = useState(null);
  const [selectedMediaFile, setSelectedMediaFile] = useState(null);
  const [mediaType, setMediaType] = useState('');
  const [messagesCache, setMessagesCache] = useState({});
  const [isUploadingMedia, setIsUploadingMedia] = useState(false);
  const [selectedTemplate, setSelectedTemplate] = useState(null);
  const [selectedObligation, setSelectedObligation] = useState(null);
  const [clientInfo, setClientInfo] = useState(null);
  const [showScrollButton, setShowScrollButton] = useState(false);
  const [isNearBottom, setIsNearBottom] = useState(true);

  const [isSessionExpired, setIsSessionExpired] = useState(false);
  const [isExpiredSessionModalOpen, setIsExpiredSessionModalOpen] = useState(false);

  // Estados para paginación
  const [isLoadingMessages, setIsLoadingMessages] = useState(false);
  const [hasMoreMessages, setHasMoreMessages] = useState(true);
  const [offset, setOffset] = useState(0);
  const [isLoadingOlderMessages, setIsLoadingOlderMessages] = useState(false);
  const [totalMessages, setTotalMessages] = useState(0);

  const messagesEndRef = useRef(null);
  const messagesContainerRef = useRef(null);

  // Refs to hold current values for the WebSocket handler
  const selectedConversationRef = useRef(selectedConversation);
  selectedConversationRef.current = selectedConversation;
  const isNearBottomRef = useRef(isNearBottom);
  isNearBottomRef.current = isNearBottom;

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

  const fetchConversations = useCallback(async () => {
    try {
      const initialConversations = await getConversations({ limit: 300 });

      // Enrich conversations with last message preview
      const enrichedConversations = await Promise.all(
        initialConversations.map(async (convo) => {
          try {
            const detailedConvo = await getConversation(convo.id, { limit: 1 });
            const lastMessage = detailedConvo?.messages?.[0];
            return {
              ...convo,
              last_message_preview: lastMessage?.body || 'Último mensaje',
            };
          } catch (error) {
            console.error(`Error fetching details for conversation ${convo.id}:`, error);
            // Return the original conversation if details fetch fails
            return {
              ...convo,
              last_message_preview: 'Error al cargar mensaje',
            };
          }
        })
      );

      const sortedData = enrichedConversations.sort((a, b) => {
        const timeA = a.last_client_message_at ? new Date(a.last_client_message_at) : new Date(0);
        const timeB = b.last_client_message_at ? new Date(b.last_client_message_at) : new Date(0);
        return timeB - timeA;
      });

      setConversations(sortedData);
    } catch (error) {
      console.error('Error fetching conversations:', error);
    }
  }, []);

  useEffect(() => {
    fetchConversations();
  }, [fetchConversations]);

  // Efecto para cargar los mensajes iniciales de una conversación
  useEffect(() => {
    if (selectedConversation) {
      const now = new Date();
      const lastMessageTime = new Date(selectedConversation.last_client_message_at);
      const diff = now - lastMessageTime;
      const hours = diff / (1000 * 60 * 60);
      setIsSessionExpired(hours > 24);

      const fetchMessages = async () => {
        const cachedMessages = messagesCache[selectedConversation.id];

        if (cachedMessages) {
          setMessages(cachedMessages);
          setIsLoadingMessages(false);
          setTimeout(() => scrollToBottom(), 100);
        } else {
          setIsLoadingMessages(true);
        }

        try {
          setHasMoreMessages(true);
          setOffset(0);
          setIsLoadingOlderMessages(false);
          setTotalMessages(0);

          const conversationData = await getConversation(selectedConversation.id, { limit: 20, offset: 0 });

          if (conversationData && conversationData.messages && Array.isArray(conversationData.messages)) {
            const apiMessages = conversationData.messages;

            setMessagesCache(prevCache => {
              const cachedMsgs = prevCache[selectedConversation.id] || [];
              const messageMap = new Map(cachedMsgs.map(m => [m.id || m.message_id, m]));

              // Update map with API messages, but don't overwrite cached ones
              apiMessages.forEach(apiMsg => {
                const id = apiMsg.id || apiMsg.message_id;
                if (!messageMap.has(id)) {
                  messageMap.set(id, apiMsg);
                }
              });

              const mergedMessages = Array.from(messageMap.values()).sort((a, b) => new Date(a.timestamp) - new Date(b.timestamp));
              
              // Update the active messages state
              setMessages(mergedMessages);

              // Return the updated cache
              return {
                ...prevCache,
                [selectedConversation.id]: mergedMessages
              };
            });

            setTotalMessages(conversationData.total_messages || apiMessages.length);
            setHasMoreMessages(conversationData.has_more || false);
            setOffset(20);

            if (!cachedMessages) {
              setTimeout(() => scrollToBottom(), 100);
            }
          } else if (!cachedMessages) {
            setMessages([]);
            setHasMoreMessages(false);
            setTotalMessages(0);
          }
        } catch (error) {
          console.error('[Pagination] Error fetching recent messages:', error);
          if (error.message && !error.message.includes('CORS') && !error.message.includes('Failed to fetch')) {
            alert(`Error al cargar mensajes: ${error.message}`);
          }
          if (!cachedMessages) {
            setMessages([]);
            setHasMoreMessages(false);
            setTotalMessages(0);
          }
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

  // Memoized WebSocket message handler
  useEffect(() => {
    const handleNewMessage = (newMessage) => {
      setConversations(prev => {
        const convoIndex = prev.findIndex(c => c.id === newMessage.conversation_id);
        if (convoIndex === -1) return prev;

        const isConversationSelected = selectedConversationRef.current?.id === newMessage.conversation_id;

        const updatedConvo = {
          ...prev[convoIndex],
          last_message_preview: newMessage.body || `[${newMessage.type}]`,
          last_client_message_at: newMessage.timestamp,
          read_status: isConversationSelected ? 'read' : 'sent',
        };

        const newConversations = [...prev];
        newConversations.splice(convoIndex, 1);
        return [updatedConvo, ...newConversations];
      });

      setMessagesCache(prevCache => {
        const currentMessages = prevCache[newMessage.conversation_id] || [];
        if (!currentMessages.some(msg => (msg.id || msg.message_id) === (newMessage.id || newMessage.message_id))) {
          const updatedMessages = [...currentMessages, newMessage].sort((a, b) => new Date(a.timestamp) - new Date(b.timestamp));
          return { ...prevCache, [newMessage.conversation_id]: updatedMessages };
        }
        return prevCache;
      });

      if (selectedConversationRef.current?.id === newMessage.conversation_id) {
        setMessages(prevMessages => {
          if (!prevMessages.some(msg => (msg.id || msg.message_id) === (newMessage.id || newMessage.message_id))) {
            const updatedMessages = [...prevMessages, newMessage];
            return updatedMessages.sort((a, b) => new Date(a.timestamp) - new Date(b.timestamp));
          }
          return prevMessages;
        });

        if (isNearBottomRef.current) {
          setTimeout(scrollToBottom, 100);
        }
      }
    };

    const handleMessageUpdate = (updatedMessage) => {
      setMessagesCache(prevCache => {
        const currentMessages = prevCache[updatedMessage.conversation_id] || [];
        const messageIndex = currentMessages.findIndex(msg => (msg.id || msg.message_id) === (updatedMessage.id || updatedMessage.message_id));

        if (messageIndex !== -1) {
          const updatedMessages = [...currentMessages];
          updatedMessages[messageIndex] = { ...updatedMessages[messageIndex], ...updatedMessage };
          return { ...prevCache, [updatedMessage.conversation_id]: updatedMessages };
        }
        return prevCache;
      });

      if (selectedConversationRef.current?.id === updatedMessage.conversation_id) {
        setMessages(prevMessages => {
          const messageIndex = prevMessages.findIndex(msg => (msg.id || msg.message_id) === (updatedMessage.id || updatedMessage.message_id));
          if (messageIndex !== -1) {
            const updatedMessages = [...prevMessages];
            updatedMessages[messageIndex] = { ...updatedMessages[messageIndex], ...updatedMessage };
            return updatedMessages;
          }
          return prevMessages;
        });
      }
    };

    const unsubscribeCreated = subscribe('conversation.message.created', handleNewMessage);
    const unsubscribeUpdated = subscribe('conversation.message.updated', handleMessageUpdate);

    return () => {
      unsubscribeCreated();
      unsubscribeUpdated();
    };
  }, [subscribe, scrollToBottom]);

  // Efecto para manejar el scroll del contenedor de mensajes
  useEffect(() => {
    const container = messagesContainerRef.current;
    if (container) {
      container.addEventListener('scroll', handleScroll);
      return () => container.removeEventListener('scroll', handleScroll);
    }
  }, [handleScroll]);

  const handleSendMessage = async () => {
    if (selectedTemplate) {
      if (!selectedConversation || !selectedObligation) return;
      try {
        await sendTemplatedMessage({
          template_id: selectedTemplate.id,
          phone_number: selectedConversation.customer_phone_number,
          cedula: selectedConversation.client_cedula,
          obligacion: selectedObligation,
        });
        setSelectedTemplate(null);
        setSelectedObligation(null);
        fetchConversations();
      } catch (error) {
        console.error('Error sending template message:', error);
        alert('Error al enviar la plantilla: ' + error.message);
      }
    } else {
      if (newMessage.trim() === '' || !selectedConversation) return;

      const temporaryId = -Date.now();
      const optimisticMessage = {
        id: temporaryId,
        message_id: `temp_${Date.now()}`,
        body: newMessage,
        timestamp: new Date().toISOString(),
        from_phone_number: 'me',
        message_type: 'text',
        status: 'pending',
      };

      setMessages(prevMessages => [...prevMessages, optimisticMessage]);
      const messageToSend = newMessage;
      setNewMessage('');
      setTimeout(scrollToBottom, 100);

      try {
        const messageData = {
          messaging_product: "whatsapp",
          recipient_type: "individual",
          to: selectedConversation.customer_phone_number,
          type: 'text',
          text: { body: messageToSend },
        };
        const sentMessage = await sendMessage(selectedConversation.id, messageData);

        if (sentMessage && sentMessage.messages && sentMessage.messages.length > 0) {
          const finalMessage = sentMessage.messages[0];
          const updateMessageState = (prevMessages) =>
            prevMessages.map(msg =>
              msg.id === temporaryId
                ? { ...msg, status: 'sent', message_id: finalMessage.id, id: finalMessage.id }
                : msg
            );

          setMessages(updateMessageState);
          setMessagesCache(prevCache => ({
            ...prevCache,
            [selectedConversation.id]: updateMessageState(prevCache[selectedConversation.id] || [])
          }));
        }

      } catch (error) {
        console.error('Error sending message:', error);
        setMessages(prevMessages =>
          prevMessages.map(msg =>
            msg.id === temporaryId ? { ...msg, status: 'failed' } : msg
          )
        );
        if (error.message && !error.message.includes('CORS') && !error.message.includes('Failed to fetch')) {
          alert('Error al enviar el mensaje: ' + error.message);
        }
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
    <div className="flex h-full min-h-0 bg-transparent overflow-hidden" style={{background: 'transparent'}}>
      <WppConversationSidebar
        conversations={conversations}
        selectedConversation={selectedConversation}
        onSelectConversation={setSelectedConversation}
        userRole={userRole}
        onConversationInitiated={fetchConversations}
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
        isSessionExpired={isSessionExpired}
        onOpenExpiredSessionModal={() => setIsExpiredSessionModalOpen(true)}
        selectedTemplate={selectedTemplate}
        onCancelTemplate={() => setSelectedTemplate(null)}
      />

      {userRole !== 'administrador' && (
        <WppClientInfo selectedConversation={selectedConversation} userRole={userRole} setClientInfo={setClientInfo} />
      )}

      <DocumentPreviewModal fileUrl={previewFileUrl} onClose={() => setPreviewFileUrl(null)} />
      <ExpiredSessionModal
        isOpen={isExpiredSessionModalOpen}
        onClose={() => setIsExpiredSessionModalOpen(false)}
        onConversationInitiated={fetchConversations}
        conversation={selectedConversation}
        clientInfo={clientInfo}
        onTemplateSelect={setSelectedTemplate}
        onObligationSelect={setSelectedObligation}
      />
    </div>
  );
};

export default WhatsAppChatPage;
