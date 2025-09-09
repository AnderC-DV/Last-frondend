import React from 'react';

const BodyEditor = ({ template, setTemplate }) => {
  const body = template.components?.body || { text: '' };

  const setBody = (newBody) => {
    setTemplate(prev => ({
      ...prev,
      components: {
        ...prev.components,
        body: newBody
      }
    }));
  };

  return (
    <div className="p-4 border rounded-md bg-white mb-4">
      <label htmlFor="bodyText" className="block text-sm font-medium text-gray-700 mb-2">
        Cuerpo del Mensaje
      </label>
      <textarea
        id="bodyText"
        className="w-full p-2 border rounded-md"
        rows="5"
        placeholder="Escribe el contenido de tu mensaje aquí. Usa {{1}}, {{2}}, etc., para las variables."
        value={body.text}
        onChange={(e) => setBody({ ...body, text: e.target.value })}
        maxLength="1024"
        required
      ></textarea>
      <p className="text-xs text-gray-500 mt-1">Máximo 1024 caracteres.</p>
    </div>
  );
};

export default BodyEditor;
