import React from 'react';

const WppChatHeader = ({ selectedConversation }) => {
  return (
    <div className="p-4 border-b border-gray-200 bg-white flex items-center">
      <div className="flex-1">
        <h2 className="text-lg font-semibold text-gray-800">
          {selectedConversation ? selectedConversation.customer_phone_number : 'Seleccione una conversación'}
        </h2>
        {selectedConversation && (
          <p className="text-sm text-gray-500">En línea</p>
        )}
      </div>
    </div>
  );
};

export default WppChatHeader;