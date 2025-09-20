import React from 'react';

const WppConversationList = ({ conversations, selectedConversation, onSelectConversation }) => {
  return (
    <div className="flex-1 overflow-y-auto">
      <ul className="divide-y divide-gray-200">
        {conversations.map((convo) => (
          <li
            key={convo.id}
            className={`p-4 cursor-pointer hover:bg-gray-50 transition-colors ${
              selectedConversation?.id === convo.id ? 'bg-green-50 border-r-4 border-green-500' : ''
            }`}
            onClick={() => onSelectConversation(convo)}
          >
            <div className="flex justify-between items-start mb-1">
              <h3 className="font-semibold text-gray-900 truncate">{convo.customer_phone_number}</h3>
              <span className="text-xs text-gray-500 ml-2 flex-shrink-0">
                {convo.last_client_message_at ? new Date(convo.last_client_message_at).toLocaleTimeString([], {hour: '2-digit', minute:'2-digit'}) : ''}
              </span>
            </div>
            <p className="text-sm text-gray-600 truncate">
              Último mensaje
            </p>
          </li>
        ))}
      </ul>
    </div>
  );
};

export default WppConversationList;