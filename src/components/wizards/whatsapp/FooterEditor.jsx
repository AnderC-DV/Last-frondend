import React from 'react';

const FooterEditor = ({ template, setTemplate }) => {
  const footer = template.components?.footer || { text: '' };

  const setFooter = (newFooter) => {
    setTemplate(prev => ({
      ...prev,
      components: {
        ...prev.components,
        footer: newFooter
      }
    }));
  };

  const handleTextChange = (e) => {
    const newText = e.target.value;
    if (newText === '') {
      const newComponents = { ...template.components };
      delete newComponents.footer;
      setTemplate(prev => ({ ...prev, components: newComponents }));
    } else {
      setFooter({ text: newText });
    }
  };

  return (
    <div className="p-4 border rounded-md bg-white mb-4">
      <label htmlFor="footerText" className="block text-sm font-medium text-gray-700 mb-2">
        Pie de Página (Opcional)
      </label>
      <input
        type="text"
        id="footerText"
        className="w-full p-2 border rounded-md"
        placeholder="Texto del pie de página (máx 60 caracteres)"
        value={footer.text}
        onChange={handleTextChange}
        maxLength="60"
      />
    </div>
  );
};

export default FooterEditor;
