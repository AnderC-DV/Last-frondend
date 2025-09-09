import React, { useState } from 'react';
import TemplateCreateWhatsApp from '../schemas/TemplateCreateWhatsApp'; // Import the schema
import { createTemplate } from '../services/api'; // Assuming an API call to create templates

const WhatsAppEditor = () => {
  const [templateName, setTemplateName] = useState('');
  const [metaTemplateName, setMetaTemplateName] = useState('');
  const [category, setCategory] = useState('MARKETING'); // Default category
  const [bodyText, setBodyText] = useState('');
  const [footerText, setFooterText] = useState('');
  const [headerType, setHeaderType] = useState('NONE'); // NONE, TEXT, IMAGE, DOCUMENT, VIDEO
  const [headerText, setHeaderText] = useState('');
  const [headerGcsObjectName, setHeaderGcsObjectName] = useState('');
  const [headerFileName, setHeaderFileName] = useState('');
  const [headerMimeType, setHeaderMimeType] = useState('');
  const [buttons, setButtons] = useState([]);
  const [error, setError] = useState(null);
  const [successMessage, setSuccessMessage] = useState(null);

  const handleAddButton = () => {
    setButtons([...buttons, { type: 'QUICK_REPLY', text: '' }]);
  };

  const handleButtonChange = (index, field, value) => {
    const newButtons = [...buttons];
    newButtons[index][field] = value;
    setButtons(newButtons);
  };

  const handleRemoveButton = (index) => {
    const newButtons = buttons.filter((_, i) => i !== index);
    setButtons(newButtons);
  };

  const handleSubmit = async (e) => {
    e.preventDefault();
    setError(null);
    setSuccessMessage(null);

    const components = {};
    if (bodyText) {
      components.body = { text: bodyText };
    }
    if (footerText) {
      components.footer = { text: footerText };
    }
    if (headerType !== 'NONE') {
      components.header = { format: headerType };
      if (headerType === 'TEXT') {
        components.header.text = headerText;
      } else {
        components.header.gcs_object_name = headerGcsObjectName;
        if (headerType === 'DOCUMENT' || headerType === 'VIDEO') {
          components.header.file_name = headerFileName;
          components.header.mime_type = headerMimeType;
        }
      }
    }
    if (buttons.length > 0) {
      components.buttons = buttons;
    }

    try {
      const newTemplate = new TemplateCreateWhatsApp(
        templateName,
        metaTemplateName,
        category,
        components
      );
      
      // Assuming createTemplate API call exists and takes the schema object
      await createTemplate(newTemplate);
      setSuccessMessage("Plantilla de WhatsApp creada exitosamente!");
      // Optionally clear form or redirect
    } catch (err) {
      console.error("Error creating WhatsApp template:", err);
      setError(err.message || "Error al crear la plantilla de WhatsApp.");
    }
  };

  return (
    <div className="p-6 bg-white rounded-lg shadow-md">
      <h3 className="text-xl font-bold text-gray-800 mb-4">Crear Nueva Plantilla de WhatsApp</h3>
      <form onSubmit={handleSubmit}>
        {/* Basic Template Info */}
        <div className="mb-4">
          <label className="block text-sm font-medium text-gray-700 mb-2">Nombre de la Plantilla</label>
          <input
            type="text"
            className="w-full p-2 border rounded-md"
            value={templateName}
            onChange={(e) => setTemplateName(e.target.value)}
            required
          />
        </div>
        <div className="mb-4">
          <label className="block text-sm font-medium text-gray-700 mb-2">Nombre de la Plantilla en Meta</label>
          <input
            type="text"
            className="w-full p-2 border rounded-md"
            value={metaTemplateName}
            onChange={(e) => setMetaTemplateName(e.target.value)}
            pattern="^[a-z0-9_]+$"
            title="Solo letras minúsculas, números y guiones bajos."
            required
          />
        </div>
        <div className="mb-4">
          <label className="block text-sm font-medium text-gray-700 mb-2">Categoría</label>
          <select
            className="w-full p-2 border rounded-md"
            value={category}
            onChange={(e) => setCategory(e.target.value)}
            required
          >
            <option value="MARKETING">Marketing</option>
            <option value="UTILITY">Utilidad</option>
            <option value="AUTHENTICATION">Autenticación</option>
          </select>
        </div>

        {/* Header Component */}
        <div className="mb-4 p-4 border rounded-md bg-gray-50">
          <label className="block text-sm font-medium text-gray-700 mb-2">Encabezado (Header)</label>
          <select
            className="w-full p-2 border rounded-md mb-2"
            value={headerType}
            onChange={(e) => setHeaderType(e.target.value)}
          >
            <option value="NONE">Sin Encabezado</option>
            <option value="TEXT">Texto</option>
            <option value="IMAGE">Imagen</option>
            <option value="DOCUMENT">Documento</option>
            <option value="VIDEO">Video</option>
          </select>

          {headerType === 'TEXT' && (
            <input
              type="text"
              className="w-full p-2 border rounded-md"
              placeholder="Texto del encabezado (ej: Hola {nombre})"
              value={headerText}
              onChange={(e) => setHeaderText(e.target.value)}
              required={headerType === 'TEXT'}
            />
          )}
          {['IMAGE', 'DOCUMENT', 'VIDEO'].includes(headerType) && (
            <>
              <input
                type="text"
                className="w-full p-2 border rounded-md mb-2"
                placeholder="Nombre del objeto GCS (ej: whatsapp/123/media/abc123.jpg)"
                value={headerGcsObjectName}
                onChange={(e) => setHeaderGcsObjectName(e.target.value)}
                required={['IMAGE', 'DOCUMENT', 'VIDEO'].includes(headerType)}
              />
              {(headerType === 'DOCUMENT' || headerType === 'VIDEO') && (
                <>
                  <input
                    type="text"
                    className="w-full p-2 border rounded-md mb-2"
                    placeholder="Nombre del archivo (ej: recibo_2025.pdf)"
                    value={headerFileName}
                    onChange={(e) => setHeaderFileName(e.target.value)}
                    required={['DOCUMENT', 'VIDEO'].includes(headerType)}
                  />
                  <input
                    type="text"
                    className="w-full p-2 border rounded-md"
                    placeholder="Tipo MIME (ej: application/pdf, video/mp4)"
                    value={headerMimeType}
                    onChange={(e) => setHeaderMimeType(e.target.value)}
                    required={['DOCUMENT', 'VIDEO'].includes(headerType)}
                  />
                </>
              )}
            </>
          )}
        </div>

        {/* Body Component */}
        <div className="mb-4 p-4 border rounded-md bg-gray-50">
          <label className="block text-sm font-medium text-gray-700 mb-2">Cuerpo del Mensaje (Body)</label>
          <textarea
            className="w-full p-2 border rounded-md"
            rows="4"
            placeholder="Texto del cuerpo (ej: Hola {nombre}, tu pedido #{numero_pedido} está listo.)"
            value={bodyText}
            onChange={(e) => setBodyText(e.target.value)}
            required
          ></textarea>
        </div>

        {/* Footer Component */}
        <div className="mb-4 p-4 border rounded-md bg-gray-50">
          <label className="block text-sm font-medium text-gray-700 mb-2">Pie de Página (Footer) (Opcional)</label>
          <input
            type="text"
            className="w-full p-2 border rounded-md"
            placeholder="Texto del pie de página (ej: Responde STOP para dejar de recibir mensajes)"
            value={footerText}
            onChange={(e) => setFooterText(e.target.value)}
          />
        </div>

        {/* Buttons Component */}
        <div className="mb-4 p-4 border rounded-md bg-gray-50">
          <label className="block text-sm font-medium text-gray-700 mb-2">Botones (Opcional)</label>
          {buttons.map((button, index) => (
            <div key={index} className="flex items-center space-x-2 mb-2">
              <select
                className="p-2 border rounded-md flex-grow"
                value={button.type}
                onChange={(e) => handleButtonChange(index, 'type', e.target.value)}
              >
                <option value="QUICK_REPLY">Respuesta Rápida</option>
                <option value="URL">URL</option>
                <option value="PHONE_NUMBER">Número de Teléfono</option>
              </select>
              <input
                type="text"
                className="p-2 border rounded-md flex-grow"
                placeholder="Texto del botón"
                value={button.text}
                onChange={(e) => handleButtonChange(index, 'text', e.target.value)}
                required
              />
              {button.type === 'URL' && (
                <input
                  type="text"
                  className="p-2 border rounded-md flex-grow"
                  placeholder="URL (ej: https://www.example.com)"
                  value={button.url || ''}
                  onChange={(e) => handleButtonChange(index, 'url', e.target.value)}
                  required
                />
              )}
              {button.type === 'PHONE_NUMBER' && (
                <input
                  type="text"
                  className="p-2 border rounded-md flex-grow"
                  placeholder="Número de teléfono (ej: 573059117385)"
                  value={button.phone_number || ''}
                  onChange={(e) => handleButtonChange(index, 'phone_number', e.target.value)}
                  required
                />
              )}
              <button
                type="button"
                onClick={() => handleRemoveButton(index)}
                className="bg-red-500 text-white p-2 rounded-md hover:bg-red-600"
              >
                Eliminar
              </button>
            </div>
          ))}
          <button
            type="button"
            onClick={handleAddButton}
            className="mt-2 bg-blue-500 text-white p-2 rounded-md hover:bg-blue-600"
          >
            Añadir Botón
          </button>
        </div>

        {error && <p className="text-red-500 mb-4">{error}</p>}
        {successMessage && <p className="text-green-500 mb-4">{successMessage}</p>}

        <button
          type="submit"
          className="w-full bg-green-500 text-white p-3 rounded-md font-bold hover:bg-green-600"
        >
          Guardar Plantilla
        </button>
      </form>
    </div>
  );
};

export default WhatsAppEditor;
