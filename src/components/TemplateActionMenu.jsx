import React from 'react';
import { useAuth } from '../context/AuthContext';
import PropTypes from 'prop-types';

// --- Iconos para el menú ---
const EditIcon = () => <svg xmlns="http://www.w3.org/2000/svg" className="h-5 w-5 mr-3 text-gray-500" fill="none" viewBox="0 0 24 24" stroke="currentColor"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M15.232 5.232l3.536 3.536m-2.036-5.036a2.5 2.5 0 113.536 3.536L6.5 21.036H3v-3.5L16.732 3.732z" /></svg>;
const DuplicateIcon = () => <svg xmlns="http://www.w3.org/2000/svg" className="h-5 w-5 mr-3 text-gray-500" fill="none" viewBox="0 0 24 24" stroke="currentColor"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M8 16H6a2 2 0 01-2-2V6a2 2 0 012-2h8a2 2 0 012 2v2m-6 12h8a2 2 0 002-2v-8a2 2 0 00-2-2h-8a2 2 0 00-2 2v8a2 2 0 002 2z" /></svg>;
const PreviewIcon = () => <svg xmlns="http://www.w3.org/2000/svg" className="h-5 w-5" fill="none" viewBox="0 0 24 24" stroke="currentColor"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M15 12a3 3 0 11-6 0 3 3 0 016 0z" /><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M2.458 12C3.732 7.943 7.523 5 12 5c4.478 0 8.268 2.943 9.542 7-1.274 4.057-5.064 7-9.542 7-4.477 0-8.268-2.943-9.542-7z" /></svg>;
const ApproveIcon = () => <svg xmlns="http://www.w3.org/2000/svg" className="h-5 w-5" fill="none" viewBox="0 0 24 24" stroke="currentColor"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M5 13l4 4L19 7" /></svg>;
const RejectIcon = () => <svg xmlns="http://www.w3.org/2000/svg" className="h-5 w-5" fill="none" viewBox="0 0 24 24" stroke="currentColor"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M6 18L18 6M6 6l12 12" /></svg>;
// -------------------------

const TemplateActionMenu = ({ template, onPreview, onApprove, onReject, previewOnly }) => {
  const { user } = useAuth();
  const userRoles = user?.decoded?.roles || [];

  const handlePreviewClick = () => {
    if (typeof onPreview === 'function') {
      onPreview(template);
    }
  };

  const handleApproveClick = () => {
    if (typeof onApprove === 'function') {
      onApprove(template.id);
    }
  };

  const handleRejectClick = () => {
    if (typeof onReject === 'function') {
      onReject(template); // Pasamos el template completo para que el modal pueda obtener el id y la razón
    }
  };

  const canApproveOrReject = () => {
    if (template.status === 'PENDING_OPERATIONS_APPROVAL') {
      return userRoles.includes('Directora de Operaciones') || userRoles.includes('Admin');
    }
    if (template.status === 'PENDING_INTERNAL_APPROVAL') {
      return userRoles.includes('Jurídico') || userRoles.includes('Admin');
    }
    return false;
  };

  return (
    <div className="flex items-center space-x-2">
      {/* Botón de Visualizar */}
      <button
        onClick={handlePreviewClick}
        className="text-gray-500 hover:text-blue-600 p-2 rounded-full focus:outline-none"
        title="Visualizar Plantilla"
      >
        <PreviewIcon />
      </button>

  {/* Botones de Aprobar/Rechazar (condicionales) */}
  {canApproveOrReject() && !previewOnly && (
        <>
          <button
            onClick={handleApproveClick}
            className="text-green-600 hover:text-green-800 p-2 rounded-full focus:outline-none"
            title="Aprobar Plantilla"
          >
            <ApproveIcon />
          </button>
          <button
            onClick={handleRejectClick}
            className="text-red-600 hover:text-red-800 p-2 rounded-full focus:outline-none"
            title="Rechazar Plantilla"
          >
            <RejectIcon />
          </button>
        </>
      )}
    </div>
  );
};

export default TemplateActionMenu;

// PropTypes para validar las props y evitar errores de ejecución
TemplateActionMenu.propTypes = {
  template: PropTypes.object.isRequired,
  onPreview: PropTypes.func.isRequired,
  onApprove: PropTypes.func,
  onReject: PropTypes.func,
  previewOnly: PropTypes.bool,
};

// Valores por defecto
TemplateActionMenu.defaultProps = {
  onApprove: () => {},
  onReject: () => {},
  previewOnly: false,
};
