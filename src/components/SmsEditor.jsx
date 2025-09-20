import React, { useState } from 'react';
import { getCharacterCount } from '../services/api';
import { toast } from 'sonner';

const SmsEditor = ({ content, setTemplate, contentRef, smsLimitExceeded, setSmsLimitExceeded }) => {
  const [characterCounts, setCharacterCounts] = useState(null);
  const [isCounting, setIsCounting] = useState(false);
  const handleContentChange = (e) => {
    const newContent = e.target.value;
    if (newContent.length > 300) {
      setSmsLimitExceeded(true);
      return;
    } else if (smsLimitExceeded && newContent.length <= 300) {
      setSmsLimitExceeded(false);
    }
    setTemplate(prev => ({
      ...prev,
      content: newContent,
      components: {
        ...prev.components,
        body: {
          ...prev.components.body,
          text: newContent
        }
      }
    }));
    // Limpiar resultados anteriores cuando cambia el contenido
    setCharacterCounts(null);
  };

  const handleCharacterCount = async () => {
    if (!content.trim()) {
      toast.warning('Ingresa contenido para contar caracteres.');
      return;
    }

    setIsCounting(true);
    try {
      const result = await getCharacterCount(content);
      setCharacterCounts(result);
      toast.success('Conteo de caracteres calculado exitosamente.');
    } catch (error) {
      console.error('Error al contar caracteres:', error);
      toast.error('Error al calcular el conteo de caracteres.');
    } finally {
      setIsCounting(false);
    }
  };

  return (
    <div>
      <label htmlFor="content" className="block text-sm font-medium text-gray-700">Contenido del Mensaje</label>
      <textarea
        id="content"
        ref={contentRef}
        value={content}
        onChange={handleContentChange}
        rows="10"
        className="mt-1 w-full p-2 border rounded-md"
        placeholder="Escribe tu mensaje aquí y arrastra las variables desde la derecha."
      ></textarea>
      <div className="mt-1 flex justify-between items-center text-xs">
        <span className={`font-medium ${smsLimitExceeded ? 'text-red-600' : 'text-gray-500'}`}>{content.length} / 300</span>
        {smsLimitExceeded && (
          <span className="text-red-600">Has superado el límite de 300 caracteres. El texto adicional no se guardará.</span>
        )}
      </div>

      {/* Botón para contar caracteres */}
      <div className="mt-4 flex justify-end">
        <button
          onClick={handleCharacterCount}
          disabled={isCounting || !content.trim()}
          className="px-4 py-2 bg-blue-600 text-white rounded-md hover:bg-blue-700 focus:outline-none focus:ring-2 focus:ring-blue-500 focus:ring-offset-2 disabled:bg-gray-400 disabled:cursor-not-allowed"
        >
          {isCounting ? "Contando..." : "Contar Caracteres"}
        </button>
      </div>

      {/* Resultados del conteo de caracteres */}
      {characterCounts && (
        <div className="mt-4 p-4 bg-blue-50 border border-blue-200 rounded-md">
          <h4 className="text-sm font-medium text-blue-800 mb-2">Resultados del Conteo de Caracteres</h4>
          <div className="text-sm text-blue-700">
            <p><strong>Conteo de caracteres en 10 renderizaciones:</strong></p>
            <ul className="mt-1 list-disc list-inside">
              {characterCounts.map((count, index) => (
                <li key={index}>Renderización {index + 1}: {count} caracteres</li>
              ))}
            </ul>
            <div className="mt-2 pt-2 border-t border-blue-200">
              <p><strong>Estadísticas:</strong></p>
              <p>Mínimo: {Math.min(...characterCounts)} caracteres</p>
              <p>Máximo: {Math.max(...characterCounts)} caracteres</p>
              <p>Promedio: {Math.round(characterCounts.reduce((a, b) => a + b, 0) / characterCounts.length)} caracteres</p>
            </div>
          </div>
        </div>
      )}
    </div>
  );
};

export default SmsEditor;
