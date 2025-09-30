import React, { useState, useEffect } from 'react';
import WppWindowCounter from './WppWindowCounter';
import { addTagToConversation, assignConversation } from '../services/api';

// Simulación de llamadas a la API
const markConversationAsReadAPI = async (conversationId) => {
  console.log(`PUT /api/conversations/${conversationId}/read`);
  await new Promise(resolve => setTimeout(resolve, 500)); // Simular latencia
  return { success: true };
};

const markConversationAsUnreadAPI = async (conversationId) => {
  console.log(`PUT /api/conversations/${conversationId}/unread`);
  await new Promise(resolve => setTimeout(resolve, 500)); // Simular latencia
  return { success: true };
};

const WppConversationList = ({ conversations, selectedConversation, onSelectConversation, userRole }) => {
  const [localConversations, setLocalConversations] = useState(conversations);
  const [contextMenu, setContextMenu] = useState({ visible: false, x: 0, y: 0, selectedConvo: null });

  useEffect(() => {
    setLocalConversations(conversations);
  }, [conversations]);

  const handleAddTag = async (conversationId) => {
    const tagName = window.prompt('Ingrese el nombre de la etiqueta:');
    if (tagName && tagName.trim()) {
      try {
        await addTagToConversation(conversationId, tagName.trim());
        window.location.reload();
      } catch (error) {
        alert('Error al agregar etiqueta: ' + error.message);
      }
    }
  };

  const handleAssignConversation = async (conversationId) => {
    const managerId = window.prompt('Ingrese el ID del gestor al que asignar la conversación:');
    if (managerId && managerId.trim()) {
      try {
        await assignConversation(conversationId, managerId.trim());
        alert('Conversación asignada exitosamente');
        window.location.reload();
      } catch (error) {
        alert('Error al asignar conversación: ' + error.message);
      }
    }
  };

  const markConversationAsRead = async (conversationId) => {
    try {
      const response = await markConversationAsReadAPI(conversationId);
      if (response.success) {
        setLocalConversations(prevConvos =>
          prevConvos.map(convo =>
            convo.id === conversationId ? { ...convo, read_status: 'read' } : convo
          )
        );
      }
    } catch (error) {
      console.error('Error al marcar la conversación como leída:', error);
    }
  };

  const markConversationAsUnread = async (conversationId) => {
    try {
      const response = await markConversationAsUnreadAPI(conversationId);
      if (response.success) {
        setLocalConversations(prevConvos =>
          prevConvos.map(convo =>
            convo.id === conversationId ? { ...convo, read_status: 'sent' } : convo
          )
        );
      }
    } catch (error) {
      console.error('Error al marcar la conversación como no leída:', error);
    }
  };

  const handleConversationSelect = (convo) => {
    if (convo.read_status === 'sent') {
      markConversationAsRead(convo.id);
    }
    onSelectConversation(convo);
  };

  const handleContextMenu = (event, convo) => {
    event.preventDefault();
    setContextMenu({
      visible: true,
      x: event.clientX,
      y: event.clientY,
      selectedConvo: convo,
    });
  };

  const handleCloseContextMenu = () => {
    setContextMenu({ ...contextMenu, visible: false });
  };

  const handleMarkAsUnread = () => {
    if (contextMenu.selectedConvo) {
      markConversationAsUnread(contextMenu.selectedConvo.id);
    }
    handleCloseContextMenu();
  };

  useEffect(() => {
    if (contextMenu.visible) {
      document.addEventListener('click', handleCloseContextMenu);
      return () => {
        document.removeEventListener('click', handleCloseContextMenu);
      };
    }
  }, [contextMenu.visible]);

  return (
    <div className="flex-1 overflow-y-auto">
      <ul className="divide-y divide-gray-200">
        {localConversations.map((convo) => {
          const isUnread = convo.read_status === 'sent';
          return (
            <li
              key={convo.id}
              className={`p-4 cursor-pointer hover:bg-gray-50 transition-colors ${
                selectedConversation?.id === convo.id ? 'bg-green-50 border-r-4 border-green-500' : ''
              }`}
              onClick={() => handleConversationSelect(convo)}
              onContextMenu={(e) => handleContextMenu(e, convo)}
            >
              <div className="flex justify-between items-start mb-1">
                <h3 className={`font-semibold truncate ${isUnread ? 'text-gray-900 font-bold' : 'text-gray-600'}`}>{convo.customer_phone_number}</h3>
                <div className="flex flex-col items-end ml-2 flex-shrink-0">
                  <span className="text-xs text-gray-500">
                    {convo.last_client_message_at ? new Date(convo.last_client_message_at).toLocaleTimeString([], {hour: '2-digit', minute:'2-digit'}) : ''}
                  </span>
                  <WppWindowCounter lastClientMessageAt={convo.last_client_message_at} />
                </div>
              </div>
              <div className="flex items-center justify-between">
                <p className={`text-sm truncate ${isUnread ? 'text-gray-800 font-bold' : 'text-gray-600'}`}>
                  {convo.last_message_preview || 'Último mensaje'}
                </p>
                {isUnread && (
                  <span className="ml-2 flex-shrink-0 w-3 h-3 bg-green-500 rounded-full"></span>
                )}
              </div>
              {(userRole === 'coordinador' || userRole === 'gestor' || userRole === 'Admin') && (
                <div className="flex items-center gap-1 ml-2 mt-2">
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
            </li>
          );
        })}
      </ul>
      {contextMenu.visible && (
        <div
          className="absolute bg-white border border-gray-200 rounded-md shadow-lg py-1"
          style={{ top: contextMenu.y, left: contextMenu.x }}
        >
          <button
            className="block w-full text-left px-4 py-2 text-sm text-gray-700 hover:bg-gray-100"
            onClick={handleMarkAsUnread}
          >
            Marcar como no leído
          </button>
        </div>
      )}
    </div>
  );
};

export default WppConversationList;
