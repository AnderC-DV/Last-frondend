import React, { useState } from 'react';
import TemplatePreviewModal from './TemplatePreviewModal';
import TemplateActionMenu from './TemplateActionMenu';
// Quitamos la aprobación/rechazo en esta vista: solo previsualización
// import TemplateReviewModal from './TemplateReviewModal';
// import { approveTemplate, rejectTemplate } from '../services/api';

const TemplateList = ({ templates = [], onTemplateUpdated, statusFilter }) => {
  const [selectedTemplate, setSelectedTemplate] = useState(null);
  // const [isReviewModalOpen, setIsReviewModalOpen] = useState(false);
  const [isPreviewModalOpen, setIsPreviewModalOpen] = useState(false);
  const [isLoading, setIsLoading] = useState(false);
  const [currentPage, setCurrentPage] = useState(1);
  const [rowsPerPage, setRowsPerPage] = useState(10);

  const paginatedTemplates = templates.slice((currentPage - 1) * rowsPerPage, currentPage * rowsPerPage);
  const totalPages = Math.ceil(templates.length / rowsPerPage);
  
  const getChannelIcon = (channelType) => {
    switch(channelType?.toLowerCase()) {
      case 'whatsapp':
        return '💬';
      case 'sms':
        return '📲';
      case 'email':
        return '📧';
      default:
        return '📄';
    }
  };

  // Esta función mapea los estados del backend a textos y colores en la UI
  const getStatusChip = (status) => {
    switch (status) {
      case 'PENDING_INTERNAL_APPROVAL':
        return { 
          text: 'Pendiente Aprobación', 
          color: 'bg-yellow-100 text-yellow-700'
        };
      case 'PENDING_OPERATIONS_APPROVAL':
        return {
          text: 'Pendiente Operaciones',
          color: 'bg-yellow-100 text-yellow-700'
        };
      case 'APPROVED':
        return { 
          text: 'Aprobada', 
          color: 'bg-green-100 text-green-700'
        };
      case 'REJECTED_INTERNAL':
        return { 
          text: 'Rechazada', 
          color: 'bg-red-100 text-red-700'
        };
      case 'REJECTED_OPERATIONS':
        return {
          text: 'Rechazada por Operaciones',
          color: 'bg-red-100 text-red-700'
        };
      case 'DRAFT':
        return {
          text: 'Borrador',
          color: 'bg-blue-100 text-blue-700'
        };
      // Casos adicionales por si la API los devuelve
      case 'PENDING_META_APPROVAL':
        return { 
          text: 'Pendiente Aprobar por Meta', 
          color: 'bg-orange-100 text-orange-700'
        };
      case 'PENDING_APPROVAL':
        return { 
          text: 'Pendiente Meta', 
          color: 'bg-orange-100 text-orange-700'
        };
      case 'REJECTED_META':
        return { 
          text: 'Rechazada por Meta', 
          color: 'bg-red-200 text-red-800'
        };
      default:
        return { 
          text: status || 'Desconocido', 
          color: 'bg-gray-100 text-gray-700'
        };
    }
  };

  // Función para traducir los motivos de rechazo de Meta
  const getTranslatedRejectionReason = (reason) => {
    switch (reason) {
      case 'NONE':
        return 'Sin razón específica';
      case 'INVALID_FORMAT':
        return 'Formato inválido';
      // Agrega más casos según sea necesario
      default:
        return reason || 'Razón desconocida';
    }
  };
  
  // Función para abrir el modal de previsualización
  const openPreviewModal = (template) => {
    setSelectedTemplate(template);
    setIsPreviewModalOpen(true);
  };

  // Se deshabilita rechazo/aprobación en esta vista

  // Aprobación deshabilitada en esta vista

  // Rechazo deshabilitado en esta vista

  return (
    <div>
      <div className="p-6 bg-white rounded-t-xl">
        <div className="flex justify-between items-center mb-4">
          <div>
            <h2 className="text-xl font-bold text-gray-800">Plantillas de Mensajería</h2>
            <p className="text-sm text-gray-500 mt-1">Revisa y aprueba o rechaza las plantillas creadas por tu equipo.</p>
          </div>
        </div>
      </div>
      <div className="overflow-x-auto bg-white rounded-b-xl shadow-lg">
        <table className="min-w-full divide-y divide-gray-200">
          <thead className="bg-gray-50">
            <tr>
              <th scope="col" className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">Nombre de Plantilla</th>
              <th scope="col" className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">Estado</th>
              {statusFilter?.includes('REJECTED') && (
                <th scope="col" className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">Razón Rechazo</th>
              )}
              <th scope="col" className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">Creado Por</th>
              <th scope="col" className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">Fecha Creación</th>
              <th scope="col" className="relative px-6 py-3"><span className="sr-only">Acciones</span></th>
            </tr>
          </thead>
          <tbody className="bg-white divide-y divide-gray-200">
            {paginatedTemplates.length > 0 ? (
              paginatedTemplates.map((template) => {
                const status = getStatusChip(template.status);
                return (
                  <tr key={template.id} className="hover:bg-gray-50 transition-colors duration-150">
                    <td className="px-6 py-4 whitespace-nowrap">
                      <div className="flex items-center">
                        <div className="flex-shrink-0 h-10 w-10 flex items-center justify-center rounded-full bg-gray-100">
                          <span className="text-xl">{getChannelIcon(template.channel_type)}</span>
                        </div>
                        <div className="ml-4">
                          <div className="text-sm font-medium text-gray-900">{template.name}</div>
                          <div className="text-sm text-gray-500">{template.channel_type}</div>
                        </div>
                      </div>
                    </td>
                    <td className="px-6 py-4 whitespace-nowrap">
                      <span className={`px-2.5 py-0.5 inline-flex text-xs leading-5 font-semibold rounded-full ${status.color}`}>{status.text}</span>
                    </td>
                    {statusFilter?.includes('REJECTED') && (
                      <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-500">
                        {template.status === 'REJECTED_META' 
                          ? getTranslatedRejectionReason(template.rejection_reason) 
                          : (template.rejection_reason || 'N/A')}
                      </td>
                    )}
                    <td className="px-6 py-4 whitespace-nowrap">
                      <div className="text-sm text-gray-900">{template.creator?.full_name || 'Usuario desconocido'}</div>
                      <div className="text-xs text-gray-500">{template.creator?.email || ''}</div>
                    </td>
                    <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-500">
                      {template.created_at ? new Date(template.created_at).toLocaleString() : 'N/A'}
                    </td>
                    <td className="px-6 py-4 whitespace-nowrap text-right text-sm font-medium">
                      <TemplateActionMenu
                        template={template}
                        onPreview={openPreviewModal}
                        previewOnly
                      />
                    </td>
                  </tr>
                );
              })
            ) : (
              <tr>
                <td colSpan={statusFilter?.includes('REJECTED') ? 6 : 5} className="px-6 py-10 text-center">
                  <div className="flex flex-col items-center">
                    <svg xmlns="http://www.w3.org/2000/svg" className="h-12 w-12 text-gray-400 mb-3" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                      <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={1.5} d="M9.172 16.172a4 4 0 015.656 0M9 10h.01M15 10h.01M12 16h.01M21 12a9 9 0 11-18 0 9 9 0 0118 0z" />
                    </svg>
                    <p className="text-gray-500 text-sm">{'No hay plantillas disponibles'}</p>
                  </div>
                </td>
              </tr>
            )}
          </tbody>
        </table>
        <div className="p-4 flex items-center justify-between">
          <div>
            <span className="text-sm text-gray-700">
              Mostrando <span className="font-medium">{(currentPage - 1) * rowsPerPage + 1}</span> a <span className="font-medium">{Math.min(currentPage * rowsPerPage, templates.length)}</span> de <span className="font-medium">{templates.length}</span> resultados
            </span>
          </div>
          <div className="flex items-center space-x-2">
            <select value={rowsPerPage} onChange={(e) => { setRowsPerPage(Number(e.target.value)); setCurrentPage(1); }} className="p-1 border rounded-md">
              {[10, 25, 50].map(size => (
                <option key={size} value={size}>Mostrar {size}</option>
              ))}
            </select>
            <button onClick={() => setCurrentPage(p => Math.max(1, p - 1))} disabled={currentPage === 1} className="p-1 border rounded-md disabled:opacity-50">
              Anterior
            </button>
            <span className="text-sm">{currentPage} de {totalPages}</span>
            <button onClick={() => setCurrentPage(p => Math.min(totalPages, p + 1))} disabled={currentPage === totalPages} className="p-1 border rounded-md disabled:opacity-50">
              Siguiente
            </button>
          </div>
        </div>
      </div>
  {/* Revisión deshabilitada en esta vista */}
      {isPreviewModalOpen && selectedTemplate && (
        <TemplatePreviewModal
          template={selectedTemplate}
          onClose={() => setIsPreviewModalOpen(false)}
        />
      )}
      {/* Overlay de carga mientras se procesan acciones */}
      {isLoading && (
        <div className="fixed inset-0 bg-black bg-opacity-30 flex items-center justify-center z-50">
          <div className="bg-white p-4 rounded-lg shadow-lg">
            <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-blue-600 mx-auto"></div>
            <p className="mt-2 text-center text-gray-700">Procesando...</p>
          </div>
        </div>
      )}
    </div>
  );
};

export default TemplateList;
