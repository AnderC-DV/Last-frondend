import React from 'react';

const DocumentPreviewModal = ({ fileUrl, onClose }) => {
  if (!fileUrl) return null;

  return (
    <div className="fixed inset-0 flex justify-center items-center z-50">
      {/* Glassmorphism background */}
      <div
        className="absolute inset-0 bg-white/10 backdrop-blur-md"
        style={{
          background: 'rgba(255, 255, 255, 0.1)',
          backdropFilter: 'blur(10px)',
          WebkitBackdropFilter: 'blur(10px)'
        }}
        onClick={onClose}
      />

      <div className="relative bg-white/90 backdrop-blur-xl rounded-2xl shadow-2xl w-11/12 h-5/6 max-w-4xl flex flex-col border border-white/20">
        <div className="flex justify-between items-center p-6 border-b border-white/20 bg-white/10 backdrop-blur-sm rounded-t-2xl">
          <h2 className="text-xl font-semibold text-gray-800 drop-shadow-sm">Vista Previa del Documento</h2>
          <button
            onClick={onClose}
            className="p-2 rounded-full bg-white/20 hover:bg-white/30 text-gray-700 hover:text-gray-900 transition-all duration-200 transform hover:scale-105 shadow-lg"
          >
            <svg xmlns="http://www.w3.org/2000/svg" className="h-5 w-5" fill="none" viewBox="0 0 24 24" stroke="currentColor">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M6 18L18 6M6 6l12 12" />
            </svg>
          </button>
        </div>
        <div className="flex-1 p-6 bg-white/5 backdrop-blur-sm rounded-b-2xl">
          <iframe
            src={fileUrl}
            title="Document Preview"
            className="w-full h-full border-0 rounded-xl shadow-inner bg-white"
          />
        </div>
      </div>
    </div>
  );
};

export default DocumentPreviewModal;
