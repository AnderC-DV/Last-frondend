import React, { useState, useEffect, useMemo, useRef } from 'react';
import WppConversationList from './WppConversationList';
import InitiateConversationModal from './InitiateConversationModal';
import WppTagInputModal from './WppTagInputModal';
import { addTagToConversation } from '../services/api';
import useDebounce from '../hooks/useDebounce';

const WppConversationSidebar = ({
  conversations,
  isLoading,
  selectedConversation,
  onSelectConversation,
  userRole,
  onConversationInitiated,
  onSearch
}) => {
  const [activeFilter, setActiveFilter] = useState('Todos');
  const [isModalOpen, setIsModalOpen] = useState(false);
  const [searchTerm, setSearchTerm] = useState('');
  const debouncedSearchTerm = useDebounce(searchTerm, 500);

  const [isTagModalOpen, setIsTagModalOpen] = useState(false);
  const [taggingConversationId, setTaggingConversationId] = useState(null);

  const scrollContainerRef = useRef(null);

  useEffect(() => {
    onSearch(debouncedSearchTerm);
  }, [debouncedSearchTerm, onSearch]);

  const handleAddTag = (conversationId) => {
    setTaggingConversationId(conversationId);
    setIsTagModalOpen(true);
  };

  const handleConfirmAddTag = async (tagName) => {
    if (!taggingConversationId || !tagName) return;
    try {
      await addTagToConversation(taggingConversationId, tagName);
      window.location.reload();
    } catch (error) {
      alert('Error al agregar etiqueta: ' + error.message);
    } finally {
      setIsTagModalOpen(false);
      setTaggingConversationId(null);
    }
  };

  const filteredConversations = useMemo(() => {
    return conversations;
  }, [conversations]);

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
        {isLoading ? (
          <div className="flex justify-center items-center h-full">
            <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-green-500"></div>
          </div>
        ) : (
          <WppConversationList
            conversations={filteredConversations}
            selectedConversation={selectedConversation}
            onSelectConversation={onSelectConversation}
            userRole={userRole}
            onAddTag={handleAddTag}
            scrollContainerRef={scrollContainerRef}
          />
        )}
      </div>
      <WppTagInputModal
        isOpen={isTagModalOpen}
        onClose={() => setIsTagModalOpen(false)}
        onSubmit={handleConfirmAddTag}
      />
    </div>
  );
};

export default WppConversationSidebar;