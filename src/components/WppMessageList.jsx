import React, { useRef, useEffect, useLayoutEffect } from 'react';
import WppMessageContent from './WppMessageContent';
import WppMessageStatus from './WppMessageStatus';
import WppScrollToBottomButton from './WppScrollToBottomButton';
import WppDayMarker from './WppDayMarker';

/**
 * Extrae la fecha (sin hora) del timestamp para comparación
 * Retorna un string en formato "YYYY-MM-DD"
 */
const getMessageDay = (timestamp) => {
  if (!timestamp) return null;

  let date;
  if (isNaN(new Date(timestamp).getTime())) {
    date = new Date(Number(timestamp) * 1000);
  } else {
    date = new Date(timestamp);
  }

  const year = date.getFullYear();
  const month = String(date.getMonth() + 1).padStart(2, '0');
  const day = String(date.getDate()).padStart(2, '0');

  return `${year}-${month}-${day}`;
};

const WppMessageList = ({
  messages,
  selectedConversation,
  onDocumentClick,
  messagesEndRef,
  showScrollButton,
  scrollToBottom,
  isLoadingMessages,
  isLoadingOlderMessages,
  hasMoreMessages,
  onLoadOlderMessages, // <-- Nueva prop para cargar mensajes
}) => {
  const messagesContainerRef = useRef(null);
  const loaderRef = useRef(null); // Ref para el elemento "centinela"
  const prevScrollHeightRef = useRef(null); // Ref para guardar el scrollHeight anterior

  // Hook para hacer scroll al final cuando se selecciona una nueva conversación
  useEffect(() => {
    if (messagesContainerRef.current) {
      messagesContainerRef.current.scrollTop = messagesContainerRef.current.scrollHeight;
    }
  }, [selectedConversation]); // Se ejecuta solo al cambiar de conversación

  // Hook para preservar la posición del scroll al cargar mensajes antiguos
  useLayoutEffect(() => {
    if (prevScrollHeightRef.current !== null && messagesContainerRef.current) {
      const scrollHeight = messagesContainerRef.current.scrollHeight;
      // La nueva posición de scroll es la diferencia de altura, manteniendo la vista actual
      const newScrollTop = scrollHeight - prevScrollHeightRef.current;
      messagesContainerRef.current.scrollTop = newScrollTop;
    }
    // Actualizamos la referencia para el próximo renderizado
    if (messagesContainerRef.current) {
      prevScrollHeightRef.current = messagesContainerRef.current.scrollHeight;
    }
  }, [messages]); // Se ejecuta cada vez que los mensajes cambian

  // Hook para el Intersection Observer
  useEffect(() => {
    const observer = new IntersectionObserver(
      (entries) => {
        const firstEntry = entries[0];
        // Si el centinela es visible, hay más mensajes y no estamos cargando, entonces cargamos más.
        if (firstEntry.isIntersecting && hasMoreMessages && !isLoadingOlderMessages) {
          // Guardamos el scrollHeight actual ANTES de que se carguen los nuevos mensajes
          if (messagesContainerRef.current) {
            prevScrollHeightRef.current = messagesContainerRef.current.scrollHeight;
          }
          onLoadOlderMessages();
        }
      },
      { root: messagesContainerRef.current, threshold: 1.0 }
    );

    const currentLoader = loaderRef.current;
    if (currentLoader) {
      observer.observe(currentLoader);
    }

    // Limpieza: desconectar el observador cuando el componente se desmonte
    return () => {
      if (currentLoader) {
        observer.unobserve(currentLoader);
      }
    };
  }, [hasMoreMessages, isLoadingOlderMessages, onLoadOlderMessages]);

  return (
    <div
      ref={messagesContainerRef}
      className="flex-1 min-h-0 h-full overflow-y-auto p-4 bg-repeat bg-center relative"
      style={{
        backgroundImage: `url("data:image/svg+xml,%3Csvg width='60' height='60' viewBox='0 0 60 60' xmlns='http://www.w3.org/2000/svg'%3E%3Cg fill='none' fill-rule='evenodd'%3E%3Cg fill='%23f3f4f6' fill-opacity='0.4'%3E%3Cpath d='M36 34v-4h-2v4h-4v2h4v4h2v-4h4v-2h-4zm0-30V0h-2v4h-4v2h4v4h2V6h4V4h-4zM6 34v-4H4v4H0v2h4v4h2v-4h4v-2H6zM6 4V0H4v4H0v2h4v4h2V6h4V4H6z'/%3E%3C/g%3E%3C/g%3E%3C/svg%3E")`,
        backgroundColor: '#e5ddd5',
        height: '100%'
      }}
    >
      {/* Elemento Centinela y Loader */}
      <div ref={loaderRef} className="h-1" />
      {selectedConversation && isLoadingOlderMessages && hasMoreMessages && (
        <div className="flex justify-center py-4">
          <div className="flex items-center space-x-2 text-gray-500">
            <div className="animate-spin rounded-full h-5 w-5 border-b-2 border-green-500"></div>
            <span className="text-sm">Cargando mensajes antiguos...</span>
          </div>
        </div>
      )}

      {/* Si no hay conversación seleccionada, mostrar mensaje amigable */}
      {!selectedConversation && (
        <div className="flex flex-col items-center justify-center h-full w-full select-none">
          <svg xmlns="http://www.w3.org/2000/svg" className="h-20 w-20 text-green-400 mb-6" fill="none" viewBox="0 0 24 24" stroke="currentColor"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 20.5c4.142 0 7.5-3.358 7.5-7.5s-3.358-7.5-7.5-7.5-7.5 3.358-7.5 7.5c0 1.61.507 3.104 1.38 4.34L4 20l3.16-.88A7.47 7.47 0 0012 20.5z" /><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M8.5 11.5h.01M15.5 11.5h.01" /><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 15c1.5 1 4.5 1 6 0" /></svg>
          <h2 className="text-2xl font-semibold text-gray-700 mb-2">Selecciona una conversación</h2>
          <p className="text-gray-500 text-base text-center max-w-md">Aquí aparecerán los mensajes de la conversación seleccionada.</p>
        </div>
      )}

      {/* Indicador de carga inicial */}
      {selectedConversation && isLoadingMessages && messages.length === 0 && (
        <div className="flex justify-center items-center h-full">
          <div className="flex items-center space-x-2 text-gray-500">
            <div className="animate-spin rounded-full h-6 w-6 border-b-2 border-green-500"></div>
            <span>Cargando conversación...</span>
          </div>
        </div>
      )}

      {/* Mensajes solo si hay conversación seleccionada */}
      {selectedConversation && (() => {
        // Agrupar mensajes por día
        const messagesByDay = messages.reduce((groups, msg, index) => {
          const day = getMessageDay(msg.timestamp);
          if (!groups[day]) {
            groups[day] = [];
          }
          groups[day].push({ msg, index });
          return groups;
        }, {});

        // Renderizar cada grupo de día como un contenedor sticky
        return Object.entries(messagesByDay).map(([day, dayMessages]) => (
          <div key={`day-group-${day}`} className="mb-4">
            {/* Sticky Day Marker */}
            <div className="sticky top-0 z-10 flex justify-center py-2 pointer-events-none select-none">
              <WppDayMarker timestamp={dayMessages[0].msg.timestamp} />
            </div>

            {/* Mensajes del día */}
            {dayMessages.map(({ msg }) => {
              const isIncoming = msg.direction ? msg.direction === 'inbound' : msg.from_phone_number === selectedConversation.customer_phone_number;
              return (
                <div
                  key={`message-${msg.id || msg.message_id || crypto.randomUUID()}`}
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
                    <div className={`flex items-center justify-end text-xs mt-1 ${isIncoming ? 'text-gray-500' : 'text-green-100'}`}>
                      <span>
                        {(() => {
                          if (!msg.timestamp) return '';
                          let date;
                          if (isNaN(new Date(msg.timestamp).getTime())) {
                            date = new Date(Number(msg.timestamp) * 1000);
                          } else {
                            date = new Date(msg.timestamp);
                          }
                          return date.toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' });
                        })()}
                      </span>
                      {!isIncoming && msg.status && (
                        <WppMessageStatus
                          status={msg.status.toLowerCase()}
                          errorMessage={msg.error_message}
                        />
                      )}
                    </div>
                  </div>
                </div>
              );
            })}
          </div>
        ));
      })()}
      <div ref={messagesEndRef} />

      {/* Botón flotante para ir al último mensaje - dentro del área de conversación */}
      {selectedConversation && (
        <WppScrollToBottomButton
          showScrollButton={showScrollButton}
          onScrollToBottom={scrollToBottom}
        />
      )}
    </div>
  );
};

export default WppMessageList;
