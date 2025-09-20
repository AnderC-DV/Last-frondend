import React from 'react';
import WppConversationList from './WppConversationList';

const WppConversationSidebar = ({ conversations, selectedConversation, onSelectConversation }) => {
  return (
    <div className="w-80 bg-white border-r border-gray-200 flex flex-col h-full min-h-0">
      <div className="p-4 border-b border-gray-200 bg-white sticky top-0 z-10">
        <h2 className="text-xl font-semibold text-gray-800">Conversaciones</h2>
      </div>
      <div className="p-3 bg-gray-50 border-b border-gray-200 sticky top-[64px] z-10">
        <input
          type="text"
          placeholder="Buscar cliente..."
          className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-green-500"
        />
      </div>
      <div className="flex justify-around p-3 bg-gray-100 border-b border-gray-200 sticky top-[64px] z-10">
        <button className="px-3 py-1 text-sm font-medium text-gray-600 bg-white border border-gray-300 rounded-full hover:bg-gray-50">Nuevos</button>
        <button className="px-3 py-1 text-sm font-medium text-gray-600 bg-white border border-gray-300 rounded-full hover:bg-gray-50">Activos</button>
        <button className="px-3 py-1 text-sm font-medium text-green-600 bg-green-50 border border-green-300 rounded-full">Todos</button>
      </div>
      <div className="flex-1 min-h-0 overflow-y-auto">
        <WppConversationList
          conversations={conversations}
          selectedConversation={selectedConversation}
          onSelectConversation={onSelectConversation}
        />
      </div>
    </div>
  );
};

export default WppConversationSidebar;