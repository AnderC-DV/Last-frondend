import React, { useState } from 'react';
import EmailPreview from './wizards/EmailPreview';

const TemplateReviewModal = ({ template, onClose, onReview }) => {
  const [rejectionReason, setRejectionReason] = useState('');
  const [isApproving, setIsApproving] = useState(true);

  const handleReview = () => {
    if (isApproving) {
      onReview(template.id, true);
    } else {
      if (!rejectionReason || rejectionReason.trim().length < 10) {
        alert('Por favor, proporciona una razón para el rechazo con al menos 10 caracteres.');
        return;
      }
      onReview(template.id, false, rejectionReason);
    }
  };

  const isRejected = template.status === 'REJECTED_INTERNAL' || template.status === 'REJECTED';

  return (
    <div className="fixed inset-0 bg-black/30 backdrop-blur-sm flex justify-center items-center z-50 p-4">
      <div className="bg-white/80 backdrop-blur-lg rounded-xl shadow-xl max-w-2xl w-full border border-white/20 flex flex-col max-h-[90vh]">
        <div className="p-8 border-b">
          <h2 className="text-2xl font-bold text-gray-800">Revisar Plantilla</h2>
        </div>
        
        <div className="p-8 overflow-y-auto">
          <div className="mb-4">
            <strong>Nombre:</strong> {template.name}
          </div>
          <div className="mb-4">
            <strong>Canal:</strong> {template.channel_type}
          </div>
          {template.subject && (
            <div className="mb-4">
              <strong>Asunto:</strong> {template.subject}
            </div>
          )}
          <div className="mb-4">
            <strong>Contenido:</strong>
            {template.channel_type === 'EMAIL' ? (
              <EmailPreview subject={template.subject} htmlContent={template.content} />
            ) : (
              <div className="border p-4 mt-2 rounded bg-gray-50 whitespace-pre-wrap">
                {template.content}
              </div>
            )}
          </div>
          <div className="mb-4">
            <strong>Creado por:</strong> {template.creator.full_name} ({template.creator.email})
          </div>

          {template.status === 'APPROVED' ? (
            <div className="my-6 p-4 bg-green-50 border border-green-200 rounded-md">
              <p className="text-center font-semibold text-green-700">Esta plantilla ya ha sido aprobada.</p>
            </div>
          ) : isRejected ? (
            <div className="my-6">
              <h3 className="font-semibold text-red-600">Motivo del Rechazo:</h3>
              <p className="mt-2 p-3 bg-red-50 border border-red-200 rounded-md text-red-800">
                {template.rejection_reason || 'No se proporcionó una razón específica.'}
              </p>
            </div>
          ) : (
            <>
              <div className="my-6">
                <div className="flex items-center mb-4">
                  <input type="radio" id="approve" name="reviewAction" checked={isApproving} onChange={() => setIsApproving(true)} className="mr-2" />
                  <label htmlFor="approve">Aprobar</label>
                </div>
                <div className="flex items-center">
                  <input type="radio" id="reject" name="reviewAction" checked={!isApproving} onChange={() => setIsApproving(false)} className="mr-2" />
                  <label htmlFor="reject">Rechazar</label>
                </div>
              </div>

              {!isApproving && (
                <div className="mb-4">
                  <label htmlFor="rejectionReason" className="block font-semibold mb-2">Motivo del Rechazo (obligatorio)</label>
                  <textarea
                    id="rejectionReason"
                    value={rejectionReason}
                    onChange={(e) => setRejectionReason(e.target.value)}
                    className="w-full p-2 border rounded"
                    rows="3"
                  ></textarea>
                </div>
              )}
            </>
          )}
        </div>

        <div className="p-8 border-t mt-auto">
          <div className="flex justify-end space-x-4">
            {isRejected || template.status === 'APPROVED' ? (
              <button onClick={onClose} className="px-4 py-2 bg-gray-800 text-white rounded hover:bg-gray-700">Cerrar</button>
            ) : (
              <>
                <button onClick={onClose} className="px-4 py-2 bg-gray-200 rounded hover:bg-gray-300">Cancelar</button>
                <button onClick={handleReview} className={`px-4 py-2 text-white rounded ${isApproving ? 'bg-green-500 hover:bg-green-600' : 'bg-red-500 hover:bg-red-600'}`}>
                  Confirmar {isApproving ? 'Aprobación' : 'Rechazo'}
                </button>
              </>
            )}
          </div>
        </div>
      </div>
    </div>
  );
};

export default TemplateReviewModal;
