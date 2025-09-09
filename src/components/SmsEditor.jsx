import React from 'react';

const SmsEditor = ({ content, setTemplate, contentRef, smsLimitExceeded, setSmsLimitExceeded }) => {
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
    </div>
  );
};

export default SmsEditor;
