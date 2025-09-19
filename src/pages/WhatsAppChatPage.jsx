import React, { useEffect, useState } from 'react';
import { getConversations, sendMessage, getConversation } from '../services/api';

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

  useEffect(() => {
    if (selectedConversation) {
      const fetchMessages = async () => {
        try {
          const conversationData = await getConversation(selectedConversation.id);
          setMessages(conversationData.messages || []);
        } catch (error) {
          console.error('Error fetching messages:', error);
        }
      };

      fetchMessages();

      // Polling for updates every 5 seconds
      const interval = setInterval(fetchMessages, 5000);

      return () => clearInterval(interval);
    } else {
      setMessages([]);
    }
  }, [selectedConversation]);

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
      }
      setNewMessage('');
    } catch (error) {
      console.error('Error sending message:', error);
      alert('Error al enviar el mensaje: ' + error.message);
    }
  };
  return (
    <div className="flex h-[92vh] bg-gray-50 overflow-hidden">
      {/* Conversations List */}
      <div className="w-80 bg-white border-r border-gray-200 flex flex-col">
        <div className="p-4 border-b border-gray-200 bg-white">
          <h2 className="text-xl font-semibold text-gray-800">Conversaciones</h2>
        </div>
        <div className="p-3 bg-gray-50 border-b border-gray-200">
          <input
            type="text"
            placeholder="Buscar cliente..."
            className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-green-500"
          />
        </div>
        <div className="flex justify-around p-3 bg-gray-100 border-b border-gray-200">
          <button className="px-3 py-1 text-sm font-medium text-gray-600 bg-white border border-gray-300 rounded-full hover:bg-gray-50">Nuevos</button>
          <button className="px-3 py-1 text-sm font-medium text-gray-600 bg-white border border-gray-300 rounded-full hover:bg-gray-50">Activos</button>
          <button className="px-3 py-1 text-sm font-medium text-green-600 bg-green-50 border border-green-300 rounded-full">Todos</button>
        </div>
        <div className="flex-1 overflow-y-auto">
          <ul className="divide-y divide-gray-200">
            {conversations.map((convo) => (
              <li
                key={convo.id}
                className={`p-4 cursor-pointer hover:bg-gray-50 transition-colors ${
                  selectedConversation?.id === convo.id ? 'bg-green-50 border-r-4 border-green-500' : ''
                }`}
                onClick={() => setSelectedConversation(convo)}
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
      </div>

      {/* Chat Window */}
      <div className="flex-1 flex flex-col bg-white">
        {/* Chat Header */}
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

        {/* Messages Area */}
        <div
          className="flex-1 overflow-y-auto p-4 bg-repeat bg-center"
          style={{
            backgroundImage: `url("data:image/svg+xml,%3Csvg width='60' height='60' viewBox='0 0 60 60' xmlns='http://www.w3.org/2000/svg'%3E%3Cg fill='none' fill-rule='evenodd'%3E%3Cg fill='%23f3f4f6' fill-opacity='0.4'%3E%3Cpath d='M36 34v-4h-2v4h-4v2h4v4h2v-4h4v-2h-4zm0-30V0h-2v4h-4v2h4v4h2V6h4V4h-4zM6 34v-4H4v4H0v2h4v4h2v-4h4v-2H6zM6 4V0H4v4H0v2h4v4h2V6h4V4H6z'/%3E%3C/g%3E%3C/g%3E%3C/svg%3E")`,
            backgroundColor: '#e5ddd5'
          }}
        >
            {messages.map((msg, index) => {
              const isIncoming = msg.from_phone_number === selectedConversation?.customer_phone_number;
              let messageContent = '';

              if (msg.message_type === 'text' && msg.body) {
                messageContent = msg.body;
              } else if (msg.message_type === 'image') {
                messageContent = '📷 Imagen';
              } else if (msg.message_type === 'audio') {
                messageContent = '🎵 Audio';
              } else if (msg.message_type === 'document') {
                messageContent = '📄 Documento';
              } else if (msg.message_type === 'video') {
                messageContent = '🎥 Video';
              } else {
                messageContent = msg.body || '[Mensaje no soportado]';
              }

              return (
                <div
                  key={msg.id || msg.message_id || index}
                  className={`flex mb-2 ${isIncoming ? 'justify-start' : 'justify-end'}`}
                >
                  <div
                    className={`max-w-xs lg:max-w-md px-4 py-2 rounded-2xl shadow-sm ${
                      isIncoming
                        ? 'bg-white text-gray-800 rounded-tl-sm'
                        : 'bg-green-500 text-white rounded-tr-sm'
                    }`}
                  >
                    <p className="text-sm leading-relaxed">{messageContent}</p>
                    <p className={`text-xs mt-1 ${isIncoming ? 'text-gray-500' : 'text-green-100'}`}>
                      {msg.timestamp ? new Date(msg.timestamp).toLocaleTimeString([], {hour: '2-digit', minute:'2-digit'}) : ''}
                    </p>
                  </div>
                </div>
              );
            })}
        </div>

        {/* Message Input */}
        <div className="p-4 bg-gray-50 border-t border-gray-200">
          <div className="flex items-center space-x-2">
            <div className="flex-1 relative">
              <input
                type="text"
                placeholder="Escribe un mensaje..."
                className="w-full px-4 py-3 border border-gray-300 rounded-full focus:outline-none focus:ring-2 focus:ring-green-500 focus:border-transparent pr-12"
                value={newMessage}
                onChange={(e) => setNewMessage(e.target.value)}
                onKeyPress={(e) => e.key === 'Enter' && handleSendMessage()}
                disabled={!selectedConversation}
              />
            </div>
            <button
              className={`px-6 py-3 rounded-full font-medium transition-colors ${
                selectedConversation && newMessage.trim()
                  ? 'bg-green-500 text-white hover:bg-green-600'
                  : 'bg-gray-300 text-gray-500 cursor-not-allowed'
              }`}
              onClick={handleSendMessage}
              disabled={!selectedConversation || !newMessage.trim()}
            >
              Enviar
            </button>
          </div>
        </div>
      </div>

      {/* Client Information */}
      <div className="w-80 bg-white border-l border-gray-200 flex flex-col">
        <div className="p-4 border-b border-gray-200 bg-white">
          <h2 className="text-xl font-semibold text-gray-800">Información del Cliente</h2>
        </div>
        <div className="flex-1 p-4 space-y-4 overflow-y-auto">
          <div className="bg-gray-50 p-4 rounded-lg">
            <h3 className="font-semibold text-lg mb-2 text-gray-800">Último Resultado</h3>
            <p className="text-gray-700">Promesa de pago</p>
          </div>
          <div className="bg-gray-50 p-4 rounded-lg">
            <h3 className="font-semibold text-lg mb-2 text-gray-800">Acuerdos</h3>
            <p className="text-gray-700">
              Estado del Acuerdo: <span className="text-green-600 font-semibold">Activo</span>
            </p>
          </div>
          <div className="bg-gray-50 p-4 rounded-lg">
            <h3 className="font-semibold text-lg mb-2 text-gray-800">Herramientas Internas</h3>
            <div className="grid grid-cols-2 gap-2">
              <button className="px-3 py-2 text-sm font-medium text-gray-700 bg-white border border-gray-300 rounded-lg hover:bg-gray-50 transition-colors">
                📝 Notas
              </button>
              <button className="px-3 py-2 text-sm font-medium text-gray-700 bg-white border border-gray-300 rounded-lg hover:bg-gray-50 transition-colors">
                ✅ Tareas
              </button>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
};

export default WhatsAppChatPage;
