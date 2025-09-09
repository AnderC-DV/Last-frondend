import React, { useEffect, useState } from 'react';
import { getConversations, sendMessage } from '../services/api';

const WhatsAppChatPage = () => {
  const [conversations, setConversations] = useState([]);
  const [selectedConversation, setSelectedConversation] = useState(null);
  const [messages, setMessages] = useState([]);
  const [newMessage, setNewMessage] = useState('');

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

  const handleSendMessage = async () => {
    if (newMessage.trim() === '' || !selectedConversation) return;

    try {
      const message = await sendMessage(selectedConversation.id, {
        type: 'text',
        text: { body: newMessage },
      });
      setMessages([...messages, message]);
      setNewMessage('');
    } catch (error) {
      console.error('Error sending message:', error);
    }
  };
  return (
    <div className="flex h-screen bg-gray-100">
      {/* Conversations List */}
      <div className="w-1/4 bg-white border-r border-gray-200">
        <div className="p-4 border-b border-gray-200">
          <h2 className="text-xl font-semibold">Conversaciones</h2>
        </div>
        <div className="p-2">
          <input
            type="text"
            placeholder="Buscar cliente..."
            className="w-full px-4 py-2 border border-gray-300 rounded-md"
          />
        </div>
        <div className="flex justify-around p-2 bg-gray-50">
          <button className="px-4 py-2 text-sm font-semibold text-gray-700 bg-white border border-gray-300 rounded-md">Nuevos</button>
          <button className="px-4 py-2 text-sm font-semibold text-gray-700 bg-white border border-gray-300 rounded-md">Activos</button>
          <button className="px-4 py-2 text-sm font-semibold text-gray-700 bg-white border border-gray-300 rounded-md">Todos</button>
        </div>
        <ul>
          {conversations.map((convo) => (
            <li
              key={convo.id}
              className="p-4 border-b border-gray-200 cursor-pointer hover:bg-gray-50"
              onClick={() => setSelectedConversation(convo)}
            >
              <div className="flex justify-between">
                <h3 className="font-semibold">{convo.customer_phone_number}</h3>
                <span className="text-xs text-gray-500">
                  {new Date(convo.last_client_message_at).toLocaleTimeString()}
                </span>
              </div>
              <p className="text-sm text-gray-600 truncate">
                {convo.messages && convo.messages.length > 0 ? convo.messages[convo.messages.length - 1].body : 'No messages'}
              </p>
            </li>
          ))}
        </ul>
      </div>

      {/* Chat Window */}
      <div className="flex-1 flex flex-col">
        <div className="p-4 border-b border-gray-200">
          <h2 className="text-xl font-semibold">
            {selectedConversation ? selectedConversation.customer_phone_number : 'Seleccione una conversación'}
          </h2>
        </div>
        <div className="flex-1 p-4 overflow-y-auto">
          {messages.map((msg) => (
            <div
              key={msg.id}
              className={`flex ${msg.from_phone_number === selectedConversation.customer_phone_number ? 'justify-start' : 'justify-end'} mb-4`}
            >
              <div
                className={`${
                  msg.from_phone_number === selectedConversation.customer_phone_number
                    ? 'bg-gray-200 text-gray-800'
                    : 'bg-blue-500 text-white'
                } rounded-lg py-2 px-4 max-w-sm`}
              >
                {msg.body}
              </div>
            </div>
          ))}
        </div>
        <div className="p-4 bg-white border-t border-gray-200">
          <div className="flex">
            <input
              type="text"
              placeholder="Escribe tu mensaje..."
              className="w-full px-4 py-2 border border-gray-300 rounded-md"
              value={newMessage}
              onChange={(e) => setNewMessage(e.target.value)}
              onKeyPress={(e) => e.key === 'Enter' && handleSendMessage()}
            />
            <button
              className="ml-2 px-4 py-2 bg-blue-500 text-white rounded-md"
              onClick={handleSendMessage}
            >
              Enviar
            </button>
          </div>
        </div>
      </div>

      {/* Client Information */}
      <div className="w-1/4 bg-white border-l border-gray-200">
        <div className="p-4 border-b border-gray-200">
          <h2 className="text-xl font-semibold">Información del Cliente</h2>
        </div>
        <div className="p-4">
          <div className="bg-white p-4 rounded-lg shadow-md mb-4">
            <h3 className="font-semibold text-lg mb-2">Último Resultado</h3>
            <p className="text-gray-700">Promesa de pago</p>
          </div>
          <div className="bg-white p-4 rounded-lg shadow-md mb-4">
            <h3 className="font-semibold text-lg mb-2">Acuerdos</h3>
            <p className="text-gray-700">Estado del Acuerdo: <span className="text-green-500 font-semibold">Activo</span></p>
          </div>
          <div className="bg-white p-4 rounded-lg shadow-md">
            <h3 className="font-semibold text-lg mb-2">Herramientas Internas</h3>
            <div className="flex justify-around">
              <button className="px-4 py-2 text-sm font-semibold text-gray-700 bg-gray-200 rounded-md">Notas</button>
              <button className="px-4 py-2 text-sm font-semibold text-gray-700 bg-gray-200 rounded-md">Tareas</button>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
};

export default WhatsAppChatPage;
