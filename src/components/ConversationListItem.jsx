import React from 'react';
import { format, isToday, isYesterday } from 'date-fns';
import { es } from 'date-fns/locale';
import WppWindowCounter from './WppWindowCounter';

const ConversationListItem = ({ conversation, lastMessage, isSelected, onSelect, userRole, onAddTag }) => {
  const formatDate = (timestamp) => {
    if (!timestamp) return null;
    const date = new Date(timestamp);
    if (isNaN(date.getTime())) return null;
    
    if (isToday(date)) return format(date, 'p', { locale: es });
    if (isYesterday(date)) return 'Ayer';
    return format(date, 'dd/MM/yy', { locale: es });
  };

  const renderSmartPreview = () => {
    const truncate = (text, length = 35) => (text && text.length > length ? text.substring(0, length) + '...' : text);

    if (lastMessage) {
      switch (lastMessage.message_type) {
        case 'text':
          return truncate(lastMessage.body);
        case 'image':
          return '📷 Imagen';
        case 'video':
          return '📹 Video';
        case 'audio':
          return '🎵 Audio';
        case 'document':
          return '📄 Documento';
        case 'sticker':
          return '✨ Sticker';
        default:
          return truncate(conversation.last_message_preview) || '[Mensaje no soportado]';
      }
    }
    
    return conversation.last_message_preview || '...';
  };

  const displayTimestamp = lastMessage?.timestamp || conversation.updated_at;
  const isUnread = conversation.read_status === 'sent';

  return (
    <div
      onClick={() => onSelect(conversation)}
      className={`relative group shadow-sm rounded-2xl px-4 py-3 cursor-pointer transition-all border border-transparent ${
        isSelected
          ? 'bg-white border-green-500 ring-2 ring-green-200'
          : 'bg-white hover:shadow-md hover:border-green-200'
      }`}
    >
      <div className="flex justify-between items-start mb-1">
        <div className="flex-1 min-w-0">
          <h3 className={`font-semibold truncate text-base ${isUnread ? 'text-green-700 font-bold' : 'text-gray-700'}`}>{conversation.chat_title}</h3>
          <p className={`text-sm truncate ${isUnread ? 'text-green-800' : 'text-gray-500'}`}>{conversation.customer_phone_number}</p>
        </div>
        <div className="flex flex-col items-end ml-2 flex-shrink-0">
          <span className="text-xs text-gray-400">
            {formatDate(displayTimestamp)}
          </span>
          <WppWindowCounter lastClientMessageAt={conversation.last_client_message_at} />
        </div>
      </div>
      <div className="flex items-center justify-between gap-2">
        <p className={`text-sm truncate ${isUnread ? 'text-green-800 font-semibold' : 'text-gray-500'}`}>
          {renderSmartPreview()}
        </p>
        <div className="flex items-center">
          {isUnread && (
            <span className="flex-shrink-0 w-2.5 h-2.5 bg-green-500 rounded-full border-2 border-white shadow"></span>
          )}
        </div>
      </div>
      {(userRole === 'gestor' || userRole === 'Admin') && (
        <div className="flex items-center flex-wrap gap-2 ml-1 mt-3">
          {conversation.tags?.map(tag => (
            <span key={tag.id} className="px-2 py-0.5 text-xs bg-blue-100 text-blue-700 rounded-full font-medium border border-blue-200 shadow-sm">
              {tag.name}
            </span>
          ))}
          <button
            className="text-xs bg-gray-100 hover:bg-gray-200 text-gray-700 rounded-full w-6 h-6 flex items-center justify-center border border-gray-200 font-bold shadow-sm transition"
            onClick={(e) => { e.stopPropagation(); onAddTag(conversation.id); }}
            title="Agregar etiqueta"
          >
            +
          </button>
        </div>
      )}
    </div>
  );
};

export default ConversationListItem;