import React from 'react';

const WppMessageInput = ({
  newMessage,
  setNewMessage,
  handleSendMessage,
  handleMediaFileSelect,
  selectedMediaFile,
  handleSendMedia,
  isUploadingMedia,
  selectedConversation
}) => {
  return (
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

        {/* Media Upload Buttons */}
        <div className="flex space-x-1">
          <label className="px-3 py-2 text-gray-600 hover:text-gray-800 cursor-pointer" title="Enviar imagen">
            <input
              type="file"
              accept="image/*"
              onChange={(e) => handleMediaFileSelect(e, 'image')}
              className="hidden"
              disabled={!selectedConversation}
            />
            📷
          </label>
          <label className="px-3 py-2 text-gray-600 hover:text-gray-800 cursor-pointer" title="Enviar video">
            <input
              type="file"
              accept="video/*"
              onChange={(e) => handleMediaFileSelect(e, 'video')}
              className="hidden"
              disabled={!selectedConversation}
            />
            🎥
          </label>
          <label className="px-3 py-2 text-gray-600 hover:text-gray-800 cursor-pointer" title="Enviar audio">
            <input
              type="file"
              accept="audio/*"
              onChange={(e) => handleMediaFileSelect(e, 'audio')}
              className="hidden"
              disabled={!selectedConversation}
            />
            🎵
          </label>
          <label className="px-3 py-2 text-gray-600 hover:text-gray-800 cursor-pointer" title="Enviar documento">
            <input
              type="file"
              accept=".pdf,.doc,.docx,.txt"
              onChange={(e) => handleMediaFileSelect(e, 'document')}
              className="hidden"
              disabled={!selectedConversation}
            />
            📄
          </label>
          <label className="px-3 py-2 text-gray-600 hover:text-gray-800 cursor-pointer" title="Enviar sticker">
            <input
              type="file"
              accept="image/*"
              onChange={(e) => handleMediaFileSelect(e, 'sticker')}
              className="hidden"
              disabled={!selectedConversation}
            />
            😊
          </label>
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

        {selectedMediaFile && (
          <button
            className={`px-4 py-3 rounded-full font-medium transition-colors ${
              isUploadingMedia
                ? 'bg-gray-400 text-gray-600 cursor-not-allowed'
                : 'bg-blue-500 text-white hover:bg-blue-600'
            }`}
            onClick={handleSendMedia}
            disabled={isUploadingMedia}
            title={isUploadingMedia ? 'Subiendo archivo...' : `Enviar ${selectedMediaFile.name}`}
          >
            {isUploadingMedia ? '⏳' : '📤'}
          </button>
        )}
      </div>
    </div>
  );
};

export default WppMessageInput;