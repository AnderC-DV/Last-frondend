import React from 'react';
import RichTextEditor from './RichTextEditor';

const EmailEditor = ({ content, setTemplate }) => {
  const handleContentChange = (content) => {
    setTemplate(prev => ({ ...prev, content }));
  };

  return (
    <div>
      <label htmlFor="content" className="block text-sm font-medium text-gray-700">Contenido del Mensaje</label>
      <RichTextEditor
        value={content}
        onChange={handleContentChange}
      />
    </div>
  );
};

export default EmailEditor;
