import React, { useState, useEffect, useCallback, useRef } from 'react';
import WppConversationList from './WppConversationList';
import InitiateConversationModal from './InitiateConversationModal';
import WppTagInputModal from './WppTagInputModal';
import { getConversations, addTagToConversation, markConversationAsUnread } from '../services/api';
import useDebounce from '../hooks/useDebounce';

const CONVERSATION_PAGE_SIZE = 50;

const WppConversationSidebar = ({
  selectedConversation,
  onSelectConversation,
  userRole,
  onConversationInitiated,
}) => {
  const [allConversations, setAllConversations] = useState([]);
  const [visibleConversations, setVisibleConversations] = useState([]);
  const [isLoading, setIsLoading] = useState(false);
  const [page, setPage] = useState(1);
  const [hasMore, setHasMore] = useState(false);

  const [activeFilter, setActiveFilter] = useState('Todos');
  const [isModalOpen, setIsModalOpen] = useState(false);
  const [searchTerm, setSearchTerm] = useState('');
  const debouncedSearchTerm = useDebounce(searchTerm, 500);

  const [isTagModalOpen, setIsTagModalOpen] = useState(false);
  const [taggingConversationId, setTaggingConversationId] = useState(null);

  const [contextMenu, setContextMenu] = useState(null);
  const scrollContainerRef = useRef(null);

  // 1. Carga única de todas las conversaciones
  const fetchAllConversations = useCallback(async (searchTerm) => {
    setIsLoading(true);
    try {
      const params = {
        limit: 10000, // Límite muy alto para traer todo
        search: searchTerm || undefined,
      };
      const conversationsData = await getConversations(params);
      setAllConversations(conversationsData);
      // Mostrar el primer lote inmediatamente
      setVisibleConversations(conversationsData.slice(0, CONVERSATION_PAGE_SIZE));
      setPage(2); // Preparar para la siguiente página
      setHasMore(conversationsData.length > CONVERSATION_PAGE_SIZE);
    } catch (error) {
      console.error('Error fetching conversations:', error);
    } finally {
      setIsLoading(false);
    }
  }, []);

  // Efecto para la carga inicial y la búsqueda
  useEffect(() => {
    fetchAllConversations(debouncedSearchTerm);
  }, [debouncedSearchTerm, fetchAllConversations]);

  // Efecto para cerrar el menú contextual al hacer clic fuera
  useEffect(() => {
    const handleClickOutside = (event) => {
      if (contextMenu) {
        setContextMenu(null);
      }
    };

    document.addEventListener('click', handleClickOutside);
    return () => {
      document.removeEventListener('click', handleClickOutside);
    };
  }, [contextMenu]);

  // 2. Carga progresiva desde el estado local
  const handleLoadMore = useCallback(() => {
    if (!hasMore || isLoading) return;

    const nextPage = page;
    const startIndex = (nextPage - 1) * CONVERSATION_PAGE_SIZE;
    const endIndex = nextPage * CONVERSATION_PAGE_SIZE;
    
    const newVisibleConversations = allConversations.slice(startIndex, endIndex);

    if (newVisibleConversations.length > 0) {
      setVisibleConversations(prev => [...prev, ...newVisibleConversations]);
      setPage(nextPage + 1);
    }
    
    setHasMore(endIndex < allConversations.length);

  }, [page, hasMore, isLoading, allConversations]);

  const handleAddTag = (conversationId) => {
    setTaggingConversationId(conversationId);
    setIsTagModalOpen(true);
  };

  const handleConfirmAddTag = async (tagName) => {
    if (!taggingConversationId || !tagName) return;
    try {
      await addTagToConversation(taggingConversationId, tagName);
      // Refrescar la lista de conversaciones para mostrar la nueva etiqueta
      fetchAllConversations(debouncedSearchTerm);
    } catch (error) {
      alert('Error al agregar etiqueta: ' + error.message);
    } finally {
      setIsTagModalOpen(false);
      setTaggingConversationId(null);
    }
  };

  const handleMarkAsUnread = async (conversationId) => {
    try {
      await markConversationAsUnread(conversationId);
      const updateConversations = (conversations) =>
        conversations.map(c =>
          c.id === conversationId ? { ...c, read_status: 'sent' } : c
        );
      setAllConversations(updateConversations);
      setVisibleConversations(updateConversations);
    } catch (error) {
      alert('Error al marcar como no leído: ' + error.message);
    } finally {
      setContextMenu(null);
    }
  };

  const handleContextMenu = (event, conversation) => {
    event.preventDefault();
    setContextMenu({
      x: event.clientX,
      y: event.clientY,
      conversationId: conversation.id,
    });
  };

  const getButtonClass = (filterName) => (
    activeFilter === filterName
      ? "px-3 py-1 text-sm font-medium text-green-600 bg-green-50 border border-green-300 rounded-full"
      : "px-3 py-1 text-sm font-medium text-gray-600 bg-white border border-gray-300 rounded-full hover:bg-gray-50"
  );

  return (
    <div className="w-80 bg-white border-r border-gray-200 flex flex-col h-full min-h-0">
      <div className="p-4 border-b border-gray-200 flex justify-between items-center">
        <h2 className="text-xl font-semibold text-gray-800">Conversaciones</h2>
        <button onClick={() => setIsModalOpen(true)} className="p-2 rounded-full hover:bg-gray-200" title="Iniciar nueva conversación">
          <svg xmlns="http://www.w3.org/2000/svg" className="h-6 w-6" fill="none" viewBox="0 0 24 24" stroke="currentColor">
            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 4v16m8-8H4" />
          </svg>
        </button>
      </div>
      <InitiateConversationModal isOpen={isModalOpen} onClose={() => setIsModalOpen(false)} onConversationInitiated={onConversationInitiated} />
      <div className="p-3 bg-gray-50 border-b border-gray-200">
        <input
          type="text"
          placeholder="Buscar por nombre, teléfono o cédula..."
          className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-green-500"
          value={searchTerm}
          onChange={(e) => setSearchTerm(e.target.value)}
        />
      </div>
      <div className="flex justify-around p-3 bg-gray-100 border-b border-gray-200">
        <button className={getButtonClass('Nuevos')} onClick={() => setActiveFilter('Nuevos')}>Nuevos</button>
        <button className={getButtonClass('Activos')} onClick={() => setActiveFilter('Activos')}>Activos</button>
        <button className={getButtonClass('Todos')} onClick={() => setActiveFilter('Todos')}>Todos</button>
      </div>
      <div ref={scrollContainerRef} className="flex-1 min-h-0 overflow-y-auto">
        <WppConversationList
          conversations={visibleConversations}
          selectedConversation={selectedConversation}
          onSelectConversation={onSelectConversation}
          userRole={userRole}
          onAddTag={handleAddTag}
          scrollContainerRef={scrollContainerRef}
          onLoadMore={handleLoadMore}
          hasMore={hasMore}
          isLoading={isLoading}
          onContextMenu={handleContextMenu}
        />
      </div>
      {contextMenu && (
        <div
          style={{ top: contextMenu.y, left: contextMenu.x }}
          className="absolute z-50 bg-white rounded-md shadow-lg border"
          onMouseLeave={() => setContextMenu(null)}
        >
          <button
            onClick={() => handleMarkAsUnread(contextMenu.conversationId)}
            className="block w-full text-left px-4 py-2 text-sm text-gray-700 hover:bg-gray-100"
          >
            Marcar como no leído
          </button>
        </div>
      )}
      <WppTagInputModal
        isOpen={isTagModalOpen}
        onClose={() => setIsTagModalOpen(false)}
        onSubmit={handleConfirmAddTag}
      />
    </div>
  );
};

export default WppConversationSidebar;