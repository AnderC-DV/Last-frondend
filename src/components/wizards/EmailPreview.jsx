import React, { useEffect, useRef } from 'react';

const EmailPreview = ({ subject, htmlContent }) => {
  const iframeRef = useRef(null);

  useEffect(() => {
    if (iframeRef.current && htmlContent) {
      const iframeDoc = iframeRef.current.contentDocument;
      if (iframeDoc) {
        iframeDoc.open();
        iframeDoc.write(htmlContent);
        iframeDoc.close();

        // Ajustar la altura del iframe al contenido
        const resizeIframe = () => {
          if (iframeRef.current) {
            const contentHeight = iframeRef.current.contentWindow.document.body.scrollHeight;
            iframeRef.current.style.height = `${contentHeight}px`;
          }
        };

        // Usar un pequeño delay para asegurar que el contenido se renderice antes de medir
        const timer = setTimeout(resizeIframe, 100);
        
        // Limpiar el timer si el componente se desmonta
        return () => clearTimeout(timer);
      }
    }
  }, [htmlContent]);

  return (
    <div className="mt-8 pt-8 border-t">
      <h3 className="text-xl font-bold text-gray-800 mb-4">Vista Previa del Mensaje</h3>
      <div className="bg-white rounded-xl shadow-md border w-full">
        <div className="p-4 border-b">
          <span className="text-sm font-semibold text-gray-500">Asunto: </span>
          <span className="text-gray-800">{subject || '(Sin asunto)'}</span>
        </div>
        <div className="p-6">
          <iframe
            ref={iframeRef}
            title="Vista previa de Email"
            className="w-full border-0 bg-white" // Se quita la altura fija h-96
            sandbox="allow-same-origin"
            scrolling="no" // Deshabilitar el scroll explícitamente
          />
        </div>
      </div>
      <p className="text-xs text-gray-400 mt-4 text-center">
        Las variables se completarán automáticamente con los datos de cada destinatario.
      </p>
    </div>
  );
};

export default EmailPreview;
