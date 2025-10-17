import React, { useEffect } from 'react';
import { X } from 'lucide-react';

/**
 * ModernModal - Componente Modal genérico y reutilizable
 * 
 * Props:
 * - isOpen (boolean): Controla visibilidad del modal
 * - onClose (function): Callback al cerrar
 * - title (string): Título del modal
 * - children (React.ReactNode): Contenido del modal
 * - size (string): 'sm' | 'md' | 'lg' | 'xl' (default: 'md')
 * - showBackdrop (boolean): Mostrar/ocultar backdrop (default: true)
 * - closeOnBackdropClick (boolean): Cerrar al hacer click en backdrop (default: true)
 * - icon (React.ReactNode): Ícono para el header (opcional)
 * - actions (React.ReactNode): Botones/acciones en el footer (opcional)
 */
const ModernModal = ({
  isOpen,
  onClose,
  title,
  children,
  size = 'md',
  showBackdrop = true,
  closeOnBackdropClick = true,
  icon,
  actions,
}) => {
  useEffect(() => {
    if (isOpen) {
      document.body.style.overflow = 'hidden';
    } else {
      document.body.style.overflow = 'unset';
    }

    return () => {
      document.body.style.overflow = 'unset';
    };
  }, [isOpen]);

  const sizeClasses = {
    sm: 'max-w-sm',
    md: 'max-w-md',
    lg: 'max-w-lg',
    xl: 'max-w-2xl',
  };

  return (
    <>
      {/* Backdrop */}
      {showBackdrop && (
        <div
          className={`fixed inset-0 bg-black/40 backdrop-blur-sm z-40 transition-opacity duration-300 ${
            isOpen ? 'opacity-100' : 'opacity-0 pointer-events-none'
          }`}
          onClick={() => closeOnBackdropClick && onClose()}
        />
      )}

      {/* Modal */}
      <div
        className={`fixed inset-0 z-50 flex items-center justify-center pointer-events-none transition-opacity duration-300 ${
          isOpen ? 'opacity-100 pointer-events-auto' : 'opacity-0'
        }`}
      >
        <div
          className={`
            bg-white rounded-lg shadow-2xl
            transform transition-all duration-300 ease-out
            ${isOpen ? 'scale-100 translate-y-0' : 'scale-95 translate-y-4'}
            ${sizeClasses[size] || sizeClasses.md}
            w-full mx-4
            max-h-[90vh] overflow-hidden flex flex-col
          `}
          onClick={(e) => e.stopPropagation()}
        >
          {/* Header */}
          <div className="flex items-center justify-between px-6 py-4 border-b border-gray-200">
            <div className="flex items-center gap-3">
              {icon && (
                <div className="text-green-600">
                  {icon}
                </div>
              )}
              <h2 className="text-lg font-semibold text-gray-800">
                {title}
              </h2>
            </div>
            <button
              onClick={onClose}
              className="
                text-gray-400 hover:text-gray-600
                rounded-lg hover:bg-gray-100
                p-1 transition-all duration-200
              "
              aria-label="Cerrar modal"
            >
              <X className="h-5 w-5" />
            </button>
          </div>

          {/* Body - Scrollable */}
          <div className="flex-1 overflow-y-auto px-6 py-4">
            {children}
          </div>

          {/* Footer - Acciones */}
          {actions && (
            <div className="px-6 py-4 border-t border-gray-200 bg-gray-50 flex gap-3 justify-end">
              {actions}
            </div>
          )}
        </div>
      </div>
    </>
  );
};

export default ModernModal;
