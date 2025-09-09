import React from 'react';

const HeaderEditor = ({ template, setTemplate }) => {
  const header = template.components?.header || { format: 'NONE' };

  const setHeader = (newHeader) => {
    setTemplate(prev => ({
      ...prev,
      components: {
        ...prev.components,
        header: newHeader
      }
    }));
  };

  const handleFormatChange = (e) => {
    const format = e.target.value;
    if (format === 'NONE') {
      // Create a copy of components and delete header from it
      const newComponents = { ...template.components };
      delete newComponents.header;
      setTemplate(prev => ({ ...prev, components: newComponents }));
    } else {
      setHeader({ format });
    }
  };

  return (
    <div className="p-4 border rounded-md bg-white mb-4">
      <label className="block text-sm font-medium text-gray-700 mb-2">Encabezado (Opcional)</label>
      <select
        className="w-full p-2 border rounded-md mb-2"
        value={header.format}
        onChange={handleFormatChange}
      >
        <option value="NONE">Sin Encabezado</option>
        <option value="TEXT">Texto</option>
        <option value="IMAGE">Imagen</option>
        <option value="DOCUMENT">Documento</option>
        <option value="VIDEO">Video</option>
      </select>

      {header.format === 'TEXT' && (
        <input
          type="text"
          className="w-full p-2 border rounded-md"
          placeholder="Texto del encabezado (máx 60 caracteres)"
          value={header.text || ''}
          onChange={(e) => setHeader({ ...header, text: e.target.value })}
          maxLength="60"
        />
      )}
      {['IMAGE', 'DOCUMENT', 'VIDEO'].includes(header.format) && (
        <div className="mt-2">
          <p className="text-xs text-gray-600 mb-2">
            El medio debe ser subido a un bucket de GCS. Proporciona el nombre del objeto.
          </p>
          <input
            type="text"
            className="w-full p-2 border rounded-md mb-2"
            placeholder="Nombre del objeto GCS"
            value={header.gcs_object_name || ''}
            onChange={(e) => setHeader({ ...header, gcs_object_name: e.target.value })}
          />
          {(header.format === 'DOCUMENT' || header.format === 'VIDEO') && (
            <>
              <input
                type="text"
                className="w-full p-2 border rounded-md mb-2"
                placeholder="Nombre del archivo (ej: recibo.pdf)"
                value={header.file_name || ''}
                onChange={(e) => setHeader({ ...header, file_name: e.target.value })}
              />
              <input
                type="text"
                className="w-full p-2 border rounded-md"
                placeholder="Tipo MIME (ej: application/pdf)"
                value={header.mime_type || ''}
                onChange={(e) => setHeader({ ...header, mime_type: e.target.value })}
              />
            </>
          )}
        </div>
      )}
    </div>
  );
};

export default HeaderEditor;
