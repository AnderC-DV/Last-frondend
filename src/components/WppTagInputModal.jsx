import React, { useState, useEffect, useRef } from 'react';

const WppTagInputModal = ({ isOpen, onClose, onSubmit }) => {
  const [tagName, setTagName] = useState('');
  const inputRef = useRef(null);

  useEffect(() => {
    if (isOpen) {
      // Focus the input when the modal opens
      setTimeout(() => inputRef.current?.focus(), 100);
    } else {
      // Reset tag name when modal closes
      setTagName('');
    }
  }, [isOpen]);

  if (!isOpen) {
    return null;
  }

  const handleSubmit = (e) => {
    e.preventDefault();
    if (tagName.trim()) {
      onSubmit(tagName.trim());
    }
  };

  return (
    <div className="fixed inset-0 bg-black/30 backdrop-blur-md flex justify-center items-center z-50">
      <div className="bg-white rounded-lg shadow-xl p-6 w-full max-w-md mx-4">
        <form onSubmit={handleSubmit}>
          <h2 className="text-xl font-semibold text-gray-800 mb-4">Agregar Nueva Etiqueta</h2>
          <input
            ref={inputRef}
            type="text"
            value={tagName}
            onChange={(e) => setTagName(e.target.value)}
            placeholder="Nombre de la etiqueta..."
            className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-green-500"
          />
          <div className="flex justify-end gap-4 mt-6">
            <button
              type="button"
              onClick={onClose}
              className="px-4 py-2 text-sm font-medium text-gray-700 bg-gray-100 border border-gray-300 rounded-lg hover:bg-gray-200"
            >
              Cancelar
            </button>
            <button
              type="submit"
              className="px-4 py-2 text-sm font-medium text-white bg-green-600 rounded-lg hover:bg-green-700"
            >
              Agregar
            </button>
          </div>
        </form>
      </div>
    </div>
  );
};

export default WppTagInputModal;