import React from 'react';

const WhatsAppPreview = ({ components }) => {
  if (!components) {
    return <div className="text-gray-500 text-center p-4">No hay componentes para previsualizar.</div>;
  }

  const resolveMediaUrl = (header) => {
    // Preferimos URLs directas si existen; localPreviewUrl es usado durante creación
    return header?.localPreviewUrl || header?.url || header?.public_url || null;
  };

  const renderHeader = (header) => {
    if (!header) return null;
    const mediaUrl = resolveMediaUrl(header);
    switch (header.format) {
      case 'TEXT':
        return <div className="bg-blue-500 text-white p-3 text-sm font-semibold rounded-t-lg">{header.text}</div>;
      case 'IMAGE':
        return (
          <div className="border-b border-gray-200">
            {mediaUrl ? (
              <img src={mediaUrl} alt={header.file_name || 'Imagen'} className="w-full h-auto max-h-64 object-contain bg-black/5" />
            ) : (
              <div className="bg-gray-100 p-6 rounded-t-lg text-center text-gray-600 text-sm">🖼️ Imagen adjunta</div>
            )}
          </div>
        );
      case 'VIDEO':
        return (
          <div className="border-b border-gray-200">
            {mediaUrl ? (
              <video src={mediaUrl} controls className="w-full h-auto max-h-64 bg-black" />
            ) : (
              <div className="bg-gray-100 p-6 rounded-t-lg text-center text-gray-600 text-sm">🎥 Video adjunto</div>
            )}
          </div>
        );
      case 'DOCUMENT':
        return (
          <div className="bg-gray-100 p-4 rounded-t-lg text-center text-gray-700 text-sm border-b border-gray-200">
            📄 {header.file_name || 'Documento'}
            {mediaUrl && (
              <div className="mt-2">
                <a href={mediaUrl} target="_blank" rel="noreferrer" className="text-blue-600 hover:underline">Abrir documento</a>
              </div>
            )}
          </div>
        );
      default:
        return null;
    }
  };

  const renderBody = (body) => {
    if (!body || !body.text) return null;
    // Highlight both {{var}} and {var} plus SPECIAL variables like {SPECIAL:NAME}
    const previewText = body.text.replace(/\{\{([^}]+)\}\}|\{([A-Za-z0-9_:.]+)\}/g, (_m, g1, g2) => {
      const token = g1 || g2;
      return `<span class="font-bold text-blue-700 bg-blue-50 px-1 rounded">{{${token}}}</span>`;
    });
    return <div className="p-3 text-gray-800 text-sm leading-snug" dangerouslySetInnerHTML={{ __html: previewText }}></div>;
  };

  const renderFooter = (footer) => {
    if (!footer || !footer.text) return null;
    return <div className="text-xs text-gray-500 p-3 border-t border-gray-100 bg-gray-50">{footer.text}</div>;
  };

  const renderButtons = (buttons) => {
    if (!buttons || buttons.length === 0) return null;
    return (
      <div className="flex flex-col border-t border-gray-100 bg-gray-50">
        {buttons.map((button, index) => (
          <button
            key={index}
            className="bg-white text-blue-600 py-2 px-4 mx-3 my-1 rounded-md text-sm font-medium border border-blue-200 hover:bg-blue-50"
            disabled
          >
            {button.text} {button.type === 'URL' && '🔗'} {button.type === 'PHONE_NUMBER' && '📞'}
          </button>
        ))}
      </div>
    );
  };

  return (
    <div className="mt-8 pt-8 border-t">
      <h3 className="text-xl font-bold text-gray-800 mb-4">Vista Previa de WhatsApp</h3>
      <div className="relative bg-green-50 rounded-xl shadow-lg w-full max-w-sm mx-auto p-2">
        {/* Simulate chat background */}
        <div className="bg-white rounded-lg overflow-hidden border border-gray-200">
          {renderHeader(components.header)}
          {renderBody(components.body)}
          {renderFooter(components.footer)}
          {renderButtons(components.buttons)}
        </div>
        {/* Optional: Add a small chat "tail" */}
        <div className="absolute bottom-2 -right-2 w-4 h-4 bg-white transform rotate-45 border-r border-b border-gray-200"></div>
      </div>
      <p className="text-xs text-gray-400 mt-4 text-center">
        Esta es una representación visual aproximada de cómo se verá el mensaje en WhatsApp.
        Los medios se muestran cuando hay una URL disponible (local o pública); de lo contrario, se visualiza un placeholder.
      </p>
    </div>
  );
};

export default WhatsAppPreview;
