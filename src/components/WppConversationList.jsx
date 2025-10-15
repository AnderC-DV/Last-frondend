import React, { useState, useEffect, useRef, useCallback } from 'react';
import ConversationListItem from './ConversationListItem';
import { getLastMessagesForConversations } from '../services/api';

const MESSAGE_PAGE_SIZE = 20;

const WppConversationList = ({
  conversations,
  selectedConversation,
  onSelectConversation,
  userRole,
  onAddTag,
  scrollContainerRef
}) => {
  const [lastMessages, setLastMessages] = useState({});
  const [page, setPage] = useState(1);
  const [isLoading, setIsLoading] = useState(false); // Para UI (spinner)
  
  const observer = useRef();
  const requestedPages = useRef(new Set());
  const isLoadingRef = useRef(false); // Para control de lógica síncrono

  // 1. Resetear estado cuando la lista de conversaciones principal cambia (ej. por búsqueda)
  useEffect(() => {
    setLastMessages({});
    setPage(1);
    requestedPages.current.clear();
  }, [conversations]);

  const hasMore = (page * MESSAGE_PAGE_SIZE) < conversations.length;

  // 2. Efecto para cargar los mensajes de la página actual con lógica anti-race-condition
  useEffect(() => {
    // Guardia principal: Usamos la ref síncrona para un bloqueo inmediato y seguro.
    if (isLoadingRef.current || conversations.length === 0 || requestedPages.current.has(page)) {
      return;
    }

    const fetchLastMessages = async () => {
      // Bloqueo síncrono e inmediato
      isLoadingRef.current = true;
      requestedPages.current.add(page);
      setIsLoading(true); // Actualizar UI

      const startIndex = (page - 1) * MESSAGE_PAGE_SIZE;
      const endIndex = page * MESSAGE_PAGE_SIZE;
      const conversationsSlice = conversations.slice(startIndex, endIndex);
      const conversationIds = conversationsSlice.map(c => c.id);

      if (conversationIds.length > 0) {
        console.log(`[WppConversationList] Fetching last messages for page ${page}. Conversation IDs:`, conversationIds);
        try {
          const messages = await getLastMessagesForConversations(conversationIds);
          console.log(`[WppConversationList] Received ${Object.keys(messages).length} messages for page ${page}.`);
          setLastMessages(prev => ({ ...prev, ...messages }));
        } catch (error) {
          console.error(`[WppConversationList] Error fetching last messages for page ${page}:`, error);
          requestedPages.current.delete(page); // Permitir reintento si falla
        } finally {
          // Desbloqueo
          isLoadingRef.current = false;
          setIsLoading(false);
        }
      } else {
        isLoadingRef.current = false;
        setIsLoading(false);
      }
    };

    fetchLastMessages();
  }, [page, conversations]); // Dependencias correctas, sin isLoading

  // 3. Intersection Observer para el scroll infinito
  const sentinelRef = useCallback(node => {
    if (observer.current) observer.current.disconnect();
    
    observer.current = new IntersectionObserver(entries => {
      // Usamos la ref de carga aquí también para seguridad
      if (entries[0].isIntersecting && hasMore && !isLoadingRef.current) {
        setPage(p => p + 1);
      }
    }, { root: scrollContainerRef.current });

    if (node) observer.current.observe(node);
  }, [hasMore, scrollContainerRef]);

  return (
    <div className="flex-1 overflow-y-auto bg-gray-50 rounded-xl p-2">
      <div className="space-y-1">
        {conversations.map((convo) => (
          <ConversationListItem
            key={convo.id}
            conversation={convo}
            lastMessage={lastMessages[convo.id]}
            isSelected={selectedConversation?.id === convo.id}
            onSelect={onSelectConversation}
            userRole={userRole}
            onAddTag={onAddTag}
          />
        ))}
        {hasMore && (
          <div ref={sentinelRef} style={{ height: '50px', display: 'flex', justifyContent: 'center', alignItems: 'center' }}>
            {isLoading && <div className="animate-spin rounded-full h-6 w-6 border-b-2 border-green-500"></div>}
          </div>
        )}
      </div>
    </div>
  );
};

export default WppConversationList;
