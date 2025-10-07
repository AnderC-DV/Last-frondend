import React, { useState, useEffect } from 'react';
import WppWindowCounter from './WppWindowCounter';
import WppTagInputModal from './WppTagInputModal';
import {
  addTagToConversation,
  assignConversation,
  markConversationAsRead,
  markConversationAsUnread
} from '../services/api';

const WppConversationList = ({ conversations, selectedConversation, onSelectConversation, userRole }) => {
  const [localConversations, setLocalConversations] = useState(conversations);
  const [contextMenu, setContextMenu] = useState({ visible: false, x: 0, y: 0, selectedConvo: null });
  const [isTagModalOpen, setIsTagModalOpen] = useState(false);
  const [taggingConversationId, setTaggingConversationId] = useState(null);

  useEffect(() => {
    setLocalConversations(conversations);
  }, [conversations]);

  const handleAddTag = (conversationId) => {
    setTaggingConversationId(conversationId);
    setIsTagModalOpen(true);
  };

  const handleConfirmAddTag = async (tagName) => {
    if (!taggingConversationId || !tagName) return;

    try {
      await addTagToConversation(taggingConversationId, tagName);
      // For now, we reload to see the change. A better approach would be to update the state locally.
      window.location.reload();
    } catch (error) {
      alert('Error al agregar etiqueta: ' + error.message);
    } finally {
      setIsTagModalOpen(false);
      setTaggingConversationId(null);
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

  const handleMarkAsUnread = async () => {
    if (contextMenu.selectedConvo) {
      try {
        await markConversationAsUnread(contextMenu.selectedConvo.id);
        setLocalConversations(prevConvos =>
          prevConvos.map(c =>
            c.id === contextMenu.selectedConvo.id ? { ...c, read_status: 'sent' } : c
          )
        );
      } catch (error) {
        console.error('Error al marcar la conversación como no leída:', error);
      }
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

  const formatTimestamp = (timestamp) => {
    if (!timestamp) return '';
    const date = new Date(timestamp);
    const today = new Date();
    
    const isToday = date.getDate() === today.getDate() &&
                  date.getMonth() === today.getMonth() &&
                  date.getFullYear() === today.getFullYear();

    if (isToday) {
      return date.toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' });
    } else {
      return date.toLocaleDateString('es-ES', { day: '2-digit', month: '2-digit', year: '2-digit' });
    }
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
                <div className="flex-1 min-w-0">
                  <h3 className={`font-semibold truncate text-base ${isUnread ? 'text-green-700 font-bold' : 'text-gray-700'}`}>{convo.chat_title}</h3>
                  <p className={`text-sm truncate ${isUnread ? 'text-green-800' : 'text-gray-500'}`}>{convo.customer_phone_number}</p>
                </div>
                <div className="flex flex-col items-end ml-2 flex-shrink-0">
                  <span className="text-xs text-gray-400">
                    {formatTimestamp(convo.updated_at)}
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

      <WppTagInputModal
        isOpen={isTagModalOpen}
        onClose={() => setIsTagModalOpen(false)}
        onSubmit={handleConfirmAddTag}
      />
    </div>
  );
}

export default WppConversationList;
