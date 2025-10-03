import React from 'react';

const wppPattern = `url("data:image/svg+xml,%3Csvg width='60' height='60' viewBox='0 0 60 60' xmlns='http://www.w3.org/2000/svg'%3E%3Cg fill='none' fill-rule='evenodd'%3E%3Cg fill='%23f3f4f6' fill-opacity='0.4'%3E%3Cpath d='M36 34v-4h-2v4h-4v2h4v4h2v-4h4v-2h-4zm0-30V0h-2v4h-4v2h4v4h2V6h4V4h-4zM6 34v-4H4v4H0v2h4v4h2v-4h4v-2H6zM6 4V0H4v4H0v2h4v4h2V6h4V4H6z'/%3E%3C/g%3E%3C/g%3E%3C/svg%3E")`;

const WppMessageInput = ({
  newMessage,
  setNewMessage,
  handleSendMessage,
  handleMediaFileSelect,
  selectedMediaFile,
  handleSendMedia,
  isUploadingMedia,
  selectedConversation,
  isSessionExpired,
  onOpenExpiredSessionModal,
  selectedTemplate,
  selectedObligation,
  onCancelTemplate
}) => {
  const inputBarClass = 'max-w-3xl mx-auto flex items-end gap-2 bg-white rounded-3xl shadow-lg border border-gray-200 px-4 py-1.5 relative transition-all focus-within:ring-2 focus-within:ring-green-400';

  const renderContent = () => {
    if (isSessionExpired && selectedTemplate) {
      return (
        <>
          <div className="flex-1 px-4 py-2 text-center">
            <p className="text-sm text-gray-600">
              Plantilla seleccionada: <strong>{selectedTemplate.name}</strong>
            </p>
          </div>
          <button
            className={`ml-2 px-5 py-2 rounded-full font-semibold text-base shadow transition-colors ${selectedObligation ? 'bg-green-500 text-white hover:bg-green-600' : 'bg-gray-200 text-gray-400 cursor-not-allowed'}`}
            onClick={handleSendMessage}
            disabled={!selectedObligation}
          >
            ENVIAR PLANTILLA
          </button>
        </>
      );
    }

    if (isSessionExpired) {
      return (
        <div className="flex-1 px-4 py-2 text-center">
          <button
            onClick={onOpenExpiredSessionModal}
            className="px-4 py-2 bg-blue-500 text-white rounded-lg"
          >
            Enviar Plantilla
          </button>
        </div>
      );
    }

    return (
      <>
        <div className="flex items-center gap-1">
          <div className="relative group">
            <label className="p-2 text-gray-500 hover:text-green-600 cursor-pointer transition flex items-center">
              <input type="file" accept="image/*" onChange={(e) => handleMediaFileSelect(e, 'image')} className="hidden" disabled={!selectedConversation} />
              <svg xmlns="http://www.w3.org/2000/svg" className="h-6 w-6" fill="none" viewBox="0 0 24 24" stroke="currentColor"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M3 7a2 2 0 012-2h2l2-3h4l2 3h2a2 2 0 012 2v12a2 2 0 01-2 2H5a2 2 0 01-2-2V7z" /><circle cx="12" cy="13" r="4" /></svg>
            </label>
            <span className="absolute left-1/2 -translate-x-1/2 bottom-10 opacity-0 group-hover:opacity-100 pointer-events-none bg-gray-900 text-white text-xs rounded px-2 py-1 shadow transition-all z-20 whitespace-nowrap">Imagen</span>
          </div>
          <div className="relative group">
            <label className="p-2 text-gray-500 hover:text-green-600 cursor-pointer transition flex items-center">
              <input type="file" accept="video/*" onChange={(e) => handleMediaFileSelect(e, 'video')} className="hidden" disabled={!selectedConversation} />
              <svg xmlns="http://www.w3.org/2000/svg" className="h-6 w-6" fill="none" viewBox="0 0 24 24" stroke="currentColor"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M15 10l4.553-2.276A1 1 0 0121 8.618v6.764a1 1 0 01-1.447.894L15 14M4 6h8a2 2 0 012 2v8a2 2 0 01-2 2H4a2 2 0 01-2-2V8a2 2 0 012-2z" /></svg>
            </label>
            <span className="absolute left-1/2 -translate-x-1/2 bottom-10 opacity-0 group-hover:opacity-100 pointer-events-none bg-gray-900 text-white text-xs rounded px-2 py-1 shadow transition-all z-20 whitespace-nowrap">Video</span>
          </div>
          <div className="relative group">
            <label className="p-2 text-gray-500 hover:text-green-600 cursor-pointer transition flex items-center">
              <input type="file" accept="audio/*" onChange={(e) => handleMediaFileSelect(e, 'audio')} className="hidden" disabled={!selectedConversation} />
              <svg xmlns="http://www.w3.org/2000/svg" className="h-6 w-6" fill="none" viewBox="0 0 24 24" stroke="currentColor"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 19V6l12-2v13" /><circle cx="6" cy="18" r="3" /></svg>
            </label>
            <span className="absolute left-1/2 -translate-x-1/2 bottom-10 opacity-0 group-hover:opacity-100 pointer-events-none bg-gray-900 text-white text-xs rounded px-2 py-1 shadow transition-all z-20 whitespace-nowrap">Audio</span>
          </div>
          <div className="relative group">
            <label className="p-2 text-gray-500 hover:text-green-600 cursor-pointer transition flex items-center">
              <input type="file" accept=".pdf,.doc,.docx,.txt" onChange={(e) => handleMediaFileSelect(e, 'document')} className="hidden" disabled={!selectedConversation} />
              <svg xmlns="http://www.w3.org/2000/svg" className="h-6 w-6" fill="none" viewBox="0 0 24 24" stroke="currentColor"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M7 7V3a1 1 0 011-1h6a1 1 0 011 1v4m-8 0h8m-8 0v12a1 1 0 001 1h6a1 1 0 001-1V7m-8 0h8" /></svg>
            </label>
            <span className="absolute left-1/2 -translate-x-1/2 bottom-10 opacity-0 group-hover:opacity-100 pointer-events-none bg-gray-900 text-white text-xs rounded px-2 py-1 shadow transition-all z-20 whitespace-nowrap">Documento</span>
          </div>
          <div className="relative group">
            <label className="p-2 text-gray-500 hover:text-green-600 cursor-pointer transition flex items-center">
              <input type="file" accept="image/*" onChange={(e) => handleMediaFileSelect(e, 'sticker')} className="hidden" disabled={!selectedConversation} />
              <svg xmlns="http://www.w3.org/2000/svg" className="h-6 w-6" fill="none" viewBox="0 0 24 24" stroke="currentColor"><circle cx="12" cy="12" r="10" /><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M8 14s1.5 2 4 2 4-2 4-2M9 9h.01M15 9h.01" /></svg>
            </label>
            <span className="absolute left-1/2 -translate-x-1/2 bottom-10 opacity-0 group-hover:opacity-100 pointer-events-none bg-gray-900 text-white text-xs rounded px-2 py-1 shadow transition-all z-20 whitespace-nowrap">Sticker</span>
          </div>
        </div>
        <input
          type="text"
          placeholder="Escribe un mensaje..."
          className="flex-1 px-4 py-2 border-none outline-none bg-transparent text-gray-800 placeholder-gray-400 rounded-full focus:ring-0"
          value={newMessage}
          onChange={(e) => setNewMessage(e.target.value)}
          onKeyPress={(e) => e.key === 'Enter' && handleSendMessage()}
          disabled={!selectedConversation}
        />
        <button
          className={`ml-2 px-5 py-2 rounded-full font-semibold text-base shadow transition-colors ${selectedConversation && newMessage.trim() ? 'bg-green-500 text-white hover:bg-green-600' : 'bg-gray-200 text-gray-400 cursor-not-allowed'}`}
          onClick={handleSendMessage}
          disabled={!selectedConversation || !newMessage.trim()}
        >
          Enviar
        </button>
        {selectedMediaFile && (
          <button
            className={`ml-2 px-4 py-2 rounded-full font-medium transition-colors ${isUploadingMedia ? 'bg-gray-400 text-gray-600 cursor-not-allowed' : 'bg-blue-500 text-white hover:bg-blue-600'}`}
            onClick={handleSendMedia}
            disabled={isUploadingMedia}
            title={isUploadingMedia ? 'Subiendo archivo...' : `Enviar ${selectedMediaFile.name}`}
          >
            {isUploadingMedia ? '⏳' : '📤'}
          </button>
        )}
      </>
    );
  };

  return (
    <div
      className="w-full bg-transparent px-0 py-2 flex-shrink-0 flex items-end justify-center"
      style={{
        backgroundImage: wppPattern,
        backgroundColor: '#e5ddd5',
        backgroundRepeat: 'repeat',
        backgroundPosition: 'left bottom',
        backgroundSize: '60px 60px',
        minHeight: '0',
        zIndex: 1
      }}
    >
      <div
        className={inputBarClass}
        style={{
          minHeight: '44px',
          background: 'white',
          boxShadow: '0 2px 16px 0 rgba(0,0,0,0.08)',
          border: '1px solid #e5e7eb'
        }}
      >
        {renderContent()}
      </div>
    </div>
  );
};

export default WppMessageInput;