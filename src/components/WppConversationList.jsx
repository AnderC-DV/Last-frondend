import React, { useState, useEffect, useContext } from 'react';
import WppWindowCounter from './WppWindowCounter';
import { addTagToConversation, assignConversation } from '../services/api';
import { NotificationContext } from '../context/NotificationContextDefinition';

const WppConversationList = ({ conversations: initialConversations, selectedConversation, onSelectConversation, userRole }) => {
  const [conversations, setConversations] = useState(initialConversations);
  const { subscribe } = useContext(NotificationContext);

  useEffect(() => {
    setConversations(initialConversations);
  }, [initialConversations]);

  useEffect(() => {
    const handleConversationUpdate = (updatedConvo) => {
      setConversations(prev =>
        prev.map(c => c.id === updatedConvo.id ? { ...c, ...updatedConvo } : c)
      );
    };

    const handleNewConversation = (newConvo) => {
      setConversations(prev => [newConvo, ...prev]);
    };

    const handleNewMessage = (newMessage) => {
      setConversations(prev => {
        const convoIndex = prev.findIndex(c => c.id === newMessage.conversation_id);
        if (convoIndex > -1) {
          const updatedConvo = {
            ...prev[convoIndex],
            last_client_message_at: newMessage.timestamp,
          };
          const newConversations = [...prev];
          newConversations.splice(convoIndex, 1);
          return [updatedConvo, ...newConversations];
        }
        return prev;
      });
    };

    const unsubscribeUpdate = subscribe('conversation.updated', handleConversationUpdate);
    const unsubscribeCreate = subscribe('conversation.created', handleNewConversation);
    const unsubscribeMessage = subscribe('message.created', handleNewMessage);

    return () => {
      unsubscribeUpdate();
      unsubscribeCreate();
      unsubscribeMessage();
    };
  }, [subscribe]);

  const handleAddTag = async (conversationId) => {
    const tagName = window.prompt('Ingrese el nombre de la etiqueta:');
    if (tagName && tagName.trim()) {
      try {
        await addTagToConversation(conversationId, tagName.trim());
        // Recargar conversaciones para mostrar la nueva etiqueta
        // Nota: En una implementación real, podrías optimizar esto con estado local
        window.location.reload();
      } catch (error) {
        alert('Error al agregar etiqueta: ' + error.message);
      }
    }
  };

  const handleAssignConversation = async (conversationId) => {
    // Para simplificar, usar un prompt con ID del gestor
    // En una implementación real, mostraría un dropdown con gestores disponibles
    const managerId = window.prompt('Ingrese el ID del gestor al que asignar la conversación:');
    if (managerId && managerId.trim()) {
      try {
        await assignConversation(conversationId, managerId.trim());
        alert('Conversación asignada exitosamente');
        // Recargar para mostrar el cambio
        window.location.reload();
      } catch (error) {
        alert('Error al asignar conversación: ' + error.message);
      }
    }
  };

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
              <div className="flex flex-col items-end ml-2 flex-shrink-0">
                <span className="text-xs text-gray-500">
                  {convo.last_client_message_at ? new Date(convo.last_client_message_at).toLocaleTimeString([], {hour: '2-digit', minute:'2-digit'}) : ''}
                </span>
                <WppWindowCounter lastClientMessageAt={convo.last_client_message_at} />
              </div>
            </div>
            <div className="flex items-center justify-between">
              <p className="text-sm text-gray-600 truncate">
                Último mensaje
              </p>
              {(userRole === 'coordinador' || userRole === 'gestor' || userRole === 'Admin') && (
                <div className="flex items-center gap-1 ml-2">
                  {convo.tags && convo.tags.length > 0 && (
                    <div className="flex flex-wrap gap-1">
                      {convo.tags.slice(0, 2).map((tag) => (
                        <span
                          key={tag.id}
                          className="px-2 py-1 text-xs bg-blue-100 text-blue-600 rounded-full"
                        >
                          {tag.name}
                        </span>
                      ))}
                      {convo.tags.length > 2 && (
                        <span className="px-2 py-1 text-xs bg-gray-100 text-gray-600 rounded-full">
                          +{convo.tags.length - 2}
                        </span>
                      )}
                    </div>
                  )}
                  {userRole === 'coordinador' && !convo.assigned_to_id && (
                    <button
                      className="text-xs bg-orange-200 hover:bg-orange-300 text-orange-600 rounded-full px-2 py-1"
                      onClick={(e) => {
                        e.stopPropagation();
                        handleAssignConversation(convo.id);
                      }}
                      title="Asignar a gestor"
                    >
                      Asignar
                    </button>
                  )}
                  {(userRole === 'gestor' || userRole === 'Admin') && (
                    <button
                      className="text-xs bg-gray-200 hover:bg-gray-300 text-gray-600 rounded-full w-5 h-5 flex items-center justify-center"
                      onClick={(e) => {
                        e.stopPropagation();
                        handleAddTag(convo.id);
                      }}
                      title="Agregar etiqueta"
                    >
                      +
                    </button>
                  )}
                </div>
              )}
            </div>
          </li>
        ))}
      </ul>
    </div>
  );
};

export default WppConversationList;
