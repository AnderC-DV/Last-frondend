import React, { useState, useMemo } from 'react';
import WppConversationList from './WppConversationList';
import InitiateConversationModal from './InitiateConversationModal';

const WppConversationSidebar = ({ conversations, selectedConversation, onSelectConversation, userRole, onConversationInitiated }) => {
  const [activeFilter, setActiveFilter] = useState('Todos');
  const [isModalOpen, setIsModalOpen] = useState(false);
  const [searchTerm, setSearchTerm] = useState('');

  const filteredConversations = useMemo(() => {
    let filtered = conversations;

    // Primero, aplicar el filtro por estado (Nuevos, Activos, Todos)
    const now = new Date();
    const twentyFourHoursAgo = now.getTime() - (24 * 60 * 60 * 1000);

    switch (activeFilter) {
      case 'Nuevos':
        filtered = filtered.filter(c => c.read_status === 'sent');
        break;
      case 'Activos':
        filtered = filtered.filter(c => {
          if (!c.last_client_message_at) return false;
          const messageDate = new Date(c.last_client_message_at).getTime();
          return messageDate > twentyFourHoursAgo;
        });
        break;
      case 'Todos':
      default:
        // No se aplica ningún filtro de estado
        break;
    }

    // Luego, aplicar el filtro de búsqueda si hay un término de búsqueda
    if (searchTerm.trim() !== '') {
      const lowercasedSearchTerm = searchTerm.toLowerCase();
      filtered = filtered.filter(c => {
        const phoneNumber = c.customer_phone_number || '';
        const cedula = c.client_cedula || '';
        return (
          phoneNumber.toLowerCase().includes(lowercasedSearchTerm) ||
          cedula.toLowerCase().includes(lowercasedSearchTerm)
        );
      });
    }

    return filtered;
  }, [conversations, activeFilter, searchTerm]);

  const getButtonClass = (filterName) => {
    if (activeFilter === filterName) {
      return "px-3 py-1 text-sm font-medium text-green-600 bg-green-50 border border-green-300 rounded-full";
    }
    return "px-3 py-1 text-sm font-medium text-gray-600 bg-white border border-gray-300 rounded-full hover:bg-gray-50";
  };

  return (
    <div className="w-80 bg-white border-r border-gray-200 flex flex-col h-full min-h-0">
      <div className="p-4 border-b border-gray-200 bg-white sticky top-0 z-10 flex justify-between items-center">
        <h2 className="text-xl font-semibold text-gray-800">Conversaciones</h2>
        <button
          onClick={() => setIsModalOpen(true)}
          className="p-2 rounded-full hover:bg-gray-200"
          title="Iniciar nueva conversación"
        >
          <svg xmlns="http://www.w3.org/2000/svg" className="h-6 w-6" fill="none" viewBox="0 0 24 24" stroke="currentColor">
            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 4v16m8-8H4" />
          </svg>
        </button>
      </div>
      <InitiateConversationModal
        isOpen={isModalOpen}
        onClose={() => setIsModalOpen(false)}
        onConversationInitiated={onConversationInitiated}
      />
      <div className="p-3 bg-gray-50 border-b border-gray-200 sticky top-[64px] z-10">
        <input
          type="text"
          placeholder="Buscar por teléfono o cédula..."
          className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-green-500"
          value={searchTerm}
          onChange={(e) => setSearchTerm(e.target.value)}
        />
      </div>
      <div className="flex justify-around p-3 bg-gray-100 border-b border-gray-200 sticky top-[64px] z-10">
        <button className={getButtonClass('Nuevos')} onClick={() => setActiveFilter('Nuevos')}>Nuevos</button>
        <button className={getButtonClass('Activos')} onClick={() => setActiveFilter('Activos')}>Activos</button>
        <button className={getButtonClass('Todos')} onClick={() => setActiveFilter('Todos')}>Todos</button>
      </div>
      <div className="flex-1 min-h-0 overflow-y-auto">
        <WppConversationList
          conversations={filteredConversations}
          selectedConversation={selectedConversation}
          onSelectConversation={onSelectConversation}
          userRole={userRole}
        />
      </div>
    </div>
  );
};

export default WppConversationSidebar;