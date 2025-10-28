import React from 'react';
import { X } from 'lucide-react';

const ModernModal = ({ isOpen, onClose, title, icon, children, size = 'lg', actions = null }) => {
  if (!isOpen) return null;

  // Tamaños de modal optimizados
  const sizeClasses = {
    sm: 'max-w-sm',
    md: 'max-w-2xl',
    lg: 'max-w-4xl',
    xl: 'max-w-5xl',
    '2xl': 'max-w-6xl',
  };

  const handleBackdropClick = (e) => {
    if (e.target === e.currentTarget) {
      onClose();
    }
  };

  return (
    <div
      className="fixed inset-0 flex items-center justify-center z-50 p-4 transition-opacity duration-300"
      style={{
        background: 'rgba(0, 0, 0, 0.3)',
        backdropFilter: 'blur(8px)',
        WebkitBackdropFilter: 'blur(8px)',
      }}
      onClick={handleBackdropClick}
    >
      <div
        className={`bg-white/90 rounded-2xl shadow-2xl w-full ${sizeClasses[size]} max-h-[85vh] overflow-y-auto transform transition-all duration-300 animate-in fade-in zoom-in-95 border border-white/20`}
        style={{
          backdropFilter: 'blur(10px)',
          WebkitBackdropFilter: 'blur(10px)',
          boxShadow: '0 8px 32px rgba(31, 38, 135, 0.37)',
        }}
        onClick={(e) => e.stopPropagation()}
      >
        {/* Header */}
        <div className="sticky top-0 bg-gradient-to-r from-gray-50 to-gray-100 border-b border-gray-200 px-6 py-4 flex items-center justify-between">
          <div className="flex items-center gap-3">
            {icon && <div className="flex-shrink-0">{icon}</div>}
            <h2 className="text-xl font-semibold text-gray-900">{title}</h2>
          </div>
          <button
            onClick={onClose}
            className="text-gray-400 hover:text-gray-600 transition-colors p-1 hover:bg-gray-200 rounded-lg"
            aria-label="Cerrar modal"
          >
            <X className="h-6 w-6" />
          </button>
        </div>

        {/* Contenido */}
        <div className="px-6 py-6">
          {children}
        </div>

        {/* Footer con acciones (si se proporciona) */}
        {actions && (
          <div className="border-t border-gray-200 bg-gray-50 px-6 py-4 rounded-b-xl flex items-center justify-end gap-3">
            {actions}
          </div>
        )}
      </div>
    </div>
  );
};

export default ModernModal;
