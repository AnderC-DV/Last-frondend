import React, { useState, useEffect } from 'react';
import WppWindowCounter from './WppWindowCounter';
import {
  addTagToConversation,
  assignConversation,
  markConversationAsRead,
  markConversationAsUnread
} from '../services/api';

const WppConversationList = ({ conversations, selectedConversation, onSelectConversation, userRole }) => {
  const [localConversations, setLocalConversations] = useState(conversations);
  const [contextMenu, setContextMenu] = useState({ visible: false, x: 0, y: 0, selectedConvo: null });

  useEffect(() => {
    setLocalConversations(conversations);
  }, [conversations]);

  // Restaurar función para manejar click en conversación
  const handleConversationClick = async (convo) => {
    if (convo.read_status === 'sent') {
      try {
        await markConversationAsRead(convo.id);
        setLocalConversations(prevConvos =>
          prevConvos.map(c =>
            c.id === convo.id ? { ...c, read_status: 'read' } : c
          )
        );
      } catch (error) {
        console.error('Error al marcar la conversación como leída:', error);
      }
    }
    onSelectConversation(convo);
  };

  return (
    <div className="flex-1 overflow-y-auto bg-gray-50 rounded-xl p-2">
      <ul className="space-y-3">
        {localConversations.map((convo) => {
          const isUnread = convo.read_status === 'sent';
          const isSelected = selectedConversation?.id === convo.id;
          return (
            <li
              key={convo.id}
              className={`relative group shadow-sm rounded-2xl px-4 py-3 cursor-pointer transition-all border border-transparent ${
                isSelected
                  ? 'bg-white border-green-500 ring-2 ring-green-200'
                  : 'bg-white hover:shadow-md hover:border-green-200'
              }`}
              onClick={() => handleConversationClick(convo)}
              onContextMenu={(e) => handleContextMenu(e, convo)}
            >
              <div className="flex justify-between items-start mb-1">
                <h3 className={`font-semibold truncate text-base ${isUnread ? 'text-green-700 font-bold' : 'text-gray-700'}`}>{convo.customer_phone_number}</h3>
                <div className="flex flex-col items-end ml-2 flex-shrink-0">
                  <span className="text-xs text-gray-400">
                    {convo.last_client_message_at ? new Date(convo.last_client_message_at).toLocaleTimeString([], {hour: '2-digit', minute:'2-digit'}) : ''}
                  </span>
                  <WppWindowCounter lastClientMessageAt={convo.last_client_message_at} />
                </div>
              </div>
              <div className="flex items-center justify-between gap-2">
                <p className={`text-sm truncate ${isUnread ? 'text-green-800 font-semibold' : 'text-gray-500'}`}>{convo.last_message_preview || 'Último mensaje'}</p>
                {isUnread && (
                  <span className="ml-2 flex-shrink-0 w-2.5 h-2.5 bg-green-500 rounded-full border-2 border-white shadow"></span>
                )}
              </div>
              {(userRole === 'coordinador' || userRole === 'gestor' || userRole === 'Admin') && (
                <div className="flex items-center flex-wrap gap-2 ml-1 mt-3">
                  {convo.tags && convo.tags.length > 0 && (
                    <div className="flex flex-wrap gap-1">
                      {convo.tags.slice(0, 2).map((tag) => (
                        <span
                          key={tag.id}
                          className="px-2 py-0.5 text-xs bg-blue-100 text-blue-700 rounded-full font-medium border border-blue-200 shadow-sm"
                        >
                          {tag.name}
                        </span>
                      ))}
                      {convo.tags.length > 2 && (
                        <span className="px-2 py-0.5 text-xs bg-gray-100 text-gray-600 rounded-full border border-gray-200 font-medium shadow-sm">
                          +{convo.tags.length - 2}
                        </span>
                      )}
                    </div>
                  )}
                  {userRole === 'coordinador' && !convo.assigned_to_id && (
                    <button
                      className="text-xs bg-orange-100 hover:bg-orange-200 text-orange-700 rounded-full px-2 py-0.5 border border-orange-200 font-medium shadow-sm transition"
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
                      className="text-xs bg-gray-100 hover:bg-gray-200 text-gray-700 rounded-full w-6 h-6 flex items-center justify-center border border-gray-200 font-bold shadow-sm transition"
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
              {/* Sombra y borde para el estado seleccionado */}
              {isSelected && (
                <span className="absolute top-2 right-2 bg-green-100 text-green-700 text-xs px-2 py-0.5 rounded-full border border-green-200 shadow-sm">Seleccionado</span>
              )}
            </li>
          );
        })}
      </ul>
      {contextMenu.visible && (
        <div
          className="absolute z-50 bg-white border border-gray-200 rounded-lg shadow-xl py-1 min-w-[180px]"
          style={{ top: contextMenu.y, left: contextMenu.x }}
        >
          <button
            className="block w-full text-left px-4 py-2 text-sm text-gray-700 hover:bg-gray-100 rounded"
            onClick={handleMarkAsUnread}
          >
            Marcar como no leído
          </button>
        </div>
      )}
    </div>
  );
}

export default WppConversationList;
