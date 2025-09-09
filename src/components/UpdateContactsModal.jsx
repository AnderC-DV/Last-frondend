import React, { useState } from 'react';
import { uploadContactsCSV } from '../services/api'; // Assuming this function exists in api.js

const UpdateContactsModal = ({ isOpen, onClose }) => {
  const [selectedFile, setSelectedFile] = useState(null);
  const [isUploading, setIsUploading] = useState(false);
  const [uploadMessage, setUploadMessage] = useState('');

  const handleFileChange = (event) => {
    setSelectedFile(event.target.files[0]);
    setUploadMessage('');
  };

  const handleUpload = async () => {
    if (!selectedFile) {
      setUploadMessage('Por favor, seleccione un archivo CSV.');
      return;
    }

    setIsUploading(true);
    setUploadMessage('');

    try {
      const response = await uploadContactsCSV(selectedFile);
      setUploadMessage('¡Archivo subido exitosamente!');
      // Optionally, you can handle the response data here
      console.log('Upload successful:', response);
      setTimeout(() => {
        onClose();
        setSelectedFile(null);
      }, 2000);
    } catch (error) {
      setUploadMessage('Error al subir el archivo. Por favor, inténtelo de nuevo.');
      console.error('Upload error:', error);
    } finally {
      setIsUploading(false);
    }
  };

  if (!isOpen) {
    return null;
  }

  return (
    <div
      className="fixed inset-0 flex justify-center items-center z-50 bg-gradient-to-br from-white/20 via-white/10 to-white/5 dark:from-white/10 dark:via-white/5 dark:to-transparent backdrop-blur-xl transition-colors"
    >
      <div
        className="relative w-full max-w-md p-6 rounded-2xl shadow-2xl border border-white/30 bg-white/40 dark:bg-white/10 backdrop-blur-2xl
        before:content-[''] before:absolute before:inset-0 before:rounded-2xl before:bg-gradient-to-br before:from-white/60 before:to-white/30 dark:before:from-white/20 dark:before:to-white/5 before:opacity-70 before:pointer-events-none"
        role="dialog"
        aria-modal="true"
      >
        <div className="relative">
        <h2 className="text-2xl font-bold mb-4 text-gray-800">Actualizar Datos de Contacto</h2>
        <p className="mb-4 text-gray-600">
          Seleccione un archivo CSV para actualizar la información de los contactos de manera masiva.
        </p>
        
        <div className="mb-4">
          <input
            type="file"
            accept=".csv"
            onChange={handleFileChange}
            className="block w-full text-sm text-gray-500 file:mr-4 file:py-2 file:px-4 file:rounded-full file:border-0 file:text-sm file:font-semibold file:bg-gray-100 file:text-gray-700 hover:file:bg-gray-200"
          />
        </div>

        {selectedFile && (
          <div className="mb-4 text-sm text-gray-500">
            <p>Archivo seleccionado: {selectedFile.name}</p>
          </div>
        )}

        {uploadMessage && (
          <div className={`mb-4 text-sm ${uploadMessage.includes('Error') ? 'text-red-500' : 'text-green-500'}`}>
            {uploadMessage}
          </div>
        )}

        <div className="flex justify-end gap-4">
          <button
            onClick={onClose}
            disabled={isUploading}
            className="px-4 py-2 bg-gray-200 text-gray-800 rounded-md hover:bg-gray-300 disabled:opacity-50"
          >
            Cancelar
          </button>
          <button
            onClick={handleUpload}
            disabled={!selectedFile || isUploading}
            className="px-4 py-2 bg-gray-800 text-white rounded-md hover:bg-gray-700 disabled:bg-gray-400"
          >
            {isUploading ? 'Subiendo...' : 'Subir Archivo'}
          </button>
        </div>
        </div>
      </div>
    </div>
  );
};

export default UpdateContactsModal;
