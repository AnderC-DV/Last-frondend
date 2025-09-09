import React from 'react';

const WhatsAppPreview = ({ template }) => {
  const { components = {} } = template;
  const { header, body, footer, buttons } = components;

  // Function to render variables in text
  const renderTextWithVariables = (text) => {
    if (!text) return '';
    // Replace {{1}} with a styled span
    return text.replace(/\{\{(\d+)\}\}/g, '<span class="text-blue-500 font-semibold">[{{$1}}]</span>');
  };

  return (
    <div className="sticky top-4">
      <h3 className="text-lg font-semibold text-gray-800 mb-4">Vista Previa de la Plantilla</h3>
      <div className="bg-gray-200 p-4 rounded-lg flex justify-center">
        <div className="w-80 bg-[#E5DDD5] p-2 rounded-lg shadow-lg">
          <div className="bg-white rounded-md p-2 shadow-sm max-w-full break-words">
            {/* Header Preview */}
            {header && (
              <div className="mb-2">
                {header.format === 'IMAGE' && <div className="h-32 bg-gray-300 rounded-md flex items-center justify-center text-gray-500">Imagen</div>}
                {header.format === 'VIDEO' && <div className="h-32 bg-gray-300 rounded-md flex items-center justify-center text-gray-500">Video</div>}
                {header.format === 'DOCUMENT' && <div className="p-2 bg-gray-100 rounded-md text-sm text-gray-700">📄 {header.file_name || 'Documento'}</div>}
                {header.format === 'TEXT' && <p className="font-bold" dangerouslySetInnerHTML={{ __html: renderTextWithVariables(header.text) }}></p>}
              </div>
            )}

            {/* Body Preview */}
            {body && body.text && (
              <p className="text-sm" dangerouslySetInnerHTML={{ __html: renderTextWithVariables(body.text) }}></p>
            )}

            {/* Footer Preview */}
            {footer && footer.text && (
              <p className="text-xs text-gray-500 mt-2">{footer.text}</p>
            )}
          </div>

          {/* Buttons Preview */}
          {buttons && buttons.length > 0 && (
            <div className="mt-1">
              {buttons.map((button, index) => (
                <div key={index} className="bg-gray-100 border-t border-gray-200 rounded-b-md text-center p-2 text-blue-500 font-medium cursor-pointer">
                  {button.type === 'URL' && '🔗 '}
                  {button.type === 'PHONE_NUMBER' && '📞 '}
                  {button.text}
                </div>
              ))}
            </div>
          )}
        </div>
      </div>
    </div>
  );
};

export default WhatsAppPreview;
