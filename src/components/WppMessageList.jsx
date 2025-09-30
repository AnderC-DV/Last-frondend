import React, { useRef } from 'react';
import WppMessageContent from './WppMessageContent';
import WppScrollToBottomButton from './WppScrollToBottomButton';

const WppMessageList = ({
  messages,
  selectedConversation,
  onDocumentClick,
  messagesEndRef,
  showScrollButton,
  scrollToBottom,
  isLoadingMessages,
  isLoadingOlderMessages,
  hasMoreMessages
}) => {
  const messagesContainerRef = useRef(null);

  return (
    <div
      ref={messagesContainerRef}
      className="flex-1 overflow-y-auto p-4 bg-repeat bg-center relative"
      style={{
        backgroundImage: `url("data:image/svg+xml,%3Csvg width='60' height='60' viewBox='0 0 60 60' xmlns='http://www.w3.org/2000/svg'%3E%3Cg fill='none' fill-rule='evenodd'%3E%3Cg fill='%23f3f4f6' fill-opacity='0.4'%3E%3Cpath d='M36 34v-4h-2v4h-4v2h4v4h2v-4h4v-2h-4zm0-30V0h-2v4h-4v2h4v4h2V6h4V4h-4zM6 34v-4H4v4H0v2h4v4h2v-4h4v-2H6zM6 4V0H4v4H0v2h4v4h2V6h4V4H6z'/%3E%3C/g%3E%3C/g%3E%3C/svg%3E")`,
        backgroundColor: '#e5ddd5'
      }}
    >
      {/* Indicador de carga de mensajes antiguos */}
      {isLoadingOlderMessages && hasMoreMessages && (
        <div className="flex justify-center py-4">
          <div className="flex items-center space-x-2 text-gray-500">
            <div className="animate-spin rounded-full h-5 w-5 border-b-2 border-green-500"></div>
            <span className="text-sm">Cargando mensajes antiguos...</span>
          </div>
        </div>
      )}

      {/* Indicador de carga inicial */}
      {isLoadingMessages && messages.length === 0 && (
        <div className="flex justify-center items-center h-full">
          <div className="flex items-center space-x-2 text-gray-500">
            <div className="animate-spin rounded-full h-6 w-6 border-b-2 border-green-500"></div>
            <span>Cargando conversación...</span>
          </div>
        </div>
      )}

      {selectedConversation && messages.map((msg) => {
        const isIncoming = msg.direction ? msg.direction === 'inbound' : msg.from_phone_number === selectedConversation.customer_phone_number;
        return (
          <div
            key={msg.id || msg.message_id || crypto.randomUUID()}
            className={`flex mb-2 ${isIncoming ? 'justify-start' : 'justify-end'}`}
          >
            <div
              className={`max-w-xs lg:max-w-md px-4 py-2 rounded-2xl shadow-sm ${
                isIncoming
                  ? 'bg-white text-gray-800 rounded-tl-sm'
                  : 'bg-green-500 text-white rounded-tr-sm'
              }`}
            >
              <WppMessageContent
                msg={msg}
                conversationId={selectedConversation?.id}
                onDocumentClick={onDocumentClick}
              />
              <p className={`text-xs mt-1 ${isIncoming ? 'text-gray-500' : 'text-green-100'}`}>
                {(() => {
                  if (!msg.timestamp) return '';
                  let date;
                  if (isNaN(new Date(msg.timestamp).getTime())) {
                    // If invalid as ISO, try as Unix seconds
                    date = new Date(Number(msg.timestamp) * 1000);
                  } else {
                    date = new Date(msg.timestamp);
                  }
                  return date.toLocaleTimeString([], {hour: '2-digit', minute:'2-digit'});
                })()}
              </p>
            </div>
          </div>
        );
      })}
      <div ref={messagesEndRef} />

      {/* Botón flotante para ir al último mensaje - dentro del área de conversación */}
      <WppScrollToBottomButton
        showScrollButton={showScrollButton}
        onScrollToBottom={scrollToBottom}
      />
    </div>
  );
};

export default WppMessageList;
