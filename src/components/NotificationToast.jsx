import React, { useMemo } from 'react';
import { useNavigate } from 'react-router-dom';
import { X, CheckCircle, AlertTriangle, Bell } from 'lucide-react';
import { toast } from 'sonner';

// Diseño actualizado estilo "notificación de escritorio" (inspirado en WhatsApp):
// - Barra/acento lateral con color según tipo
// - Fondo sutil con ligero glass/blur y sombra suave
// - Icono circular coloreado
// - Título compacto + hora + mensaje (2 líneas máx.)
// - Animación slide-in y hover elevación
// NOTA: No se altera la funcionalidad existente; solo presentación.

const NotificationToast = ({ notification }) => {
  const navigate = useNavigate();

  // Formateo ligero de hora (solo HH:MM) si viene created_at
  const timeLabel = useMemo(() => {
    try {
      if (!notification?.created_at) return '';
      const d = new Date(notification.created_at);
      if (isNaN(d.getTime())) return '';
      return d.toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' });
    } catch {
      return '';
    }
  }, [notification?.created_at]);

  const visualConfig = (type) => {
    switch (type) {
      case 'TEMPLATE_APPROVED':
        return { accent: 'bg-green-500', iconBg: 'bg-green-100', iconColor: 'text-green-600' };
      case 'TEMPLATE_REJECTED':
        return { accent: 'bg-red-500', iconBg: 'bg-red-100', iconColor: 'text-red-600' };
      default:
        return { accent: 'bg-blue-500', iconBg: 'bg-blue-100', iconColor: 'text-blue-600' };
    }
  };

  const { accent, iconBg, iconColor } = visualConfig(notification?.type);

  // Fallback robusto para asegurar que siempre mostramos algo
  const displayMessage = (
    notification?.message ||
    notification?.body ||
    notification?.content ||
    notification?.text ||
    notification?.description ||
    ''
  ).toString().trim();

  const safeMessage = displayMessage.length === 0 ? 'Sin contenido' : displayMessage;

  const getNotificationIcon = (type) => {
    const base = 'h-5 w-5';
    switch (type) {
      case 'TEMPLATE_APPROVED':
        return <CheckCircle className={`${base} ${iconColor}`} />;
      case 'TEMPLATE_REJECTED':
        return <AlertTriangle className={`${base} ${iconColor}`} />;
      default:
        return <Bell className={`${base} ${iconColor}`} />;
    }
  };

  const handleToastClick = () => {
    if (notification.type === 'TEMPLATE_APPROVED' || notification.type === 'TEMPLATE_REJECTED') {
      navigate('/templates');
    }
    // (Funcionalidad intacta) dismiss siempre al hacer click
    toast.dismiss(notification.id);
  };

  return (
    <div
      onClick={handleToastClick}
      className={[
        'group relative overflow-hidden',
        // Ancho fijo moderado para evitar el rectángulo gigante del contenedor padre
        'w-[340px] max-w-full',
        'rounded-xl bg-white shadow-sm ring-1 ring-black/5 pointer-events-auto flex cursor-pointer',
        'transition-all duration-200 ease-out',
        'hover:shadow-lg'
      ].join(' ')}
    >
      {/* Barra de acento lateral */}
      <div className={`w-1 ${accent} rounded-l-xl`} aria-hidden="true" />

      {/* Contenido principal */}
      <div className="flex-1 flex p-3 pr-2 gap-3 items-start">
        <div className={`flex-shrink-0 rounded-full ${iconBg} ${iconColor} p-2 shadow-inner`}>{getNotificationIcon(notification.type)}</div>
        <div className="flex-1 min-w-0">
          <div className="flex items-center gap-2 mb-0.5">
            <p className="text-[11px] font-semibold tracking-wide text-gray-700 uppercase select-none">Notificación</p>
            {timeLabel && <span className="text-[10px] font-medium text-gray-400 ml-auto tabular-nums">{timeLabel}</span>}
          </div>
          <p className="text-sm font-medium text-gray-900 leading-snug">
            {notification.type === 'TEMPLATE_APPROVED' && 'Plantilla aprobada'}
            {notification.type === 'TEMPLATE_REJECTED' && 'Plantilla rechazada'}
            {!(notification.type === 'TEMPLATE_APPROVED' || notification.type === 'TEMPLATE_REJECTED') && 'Nueva notificación'}
          </p>
          <p className="mt-0.5 text-xs text-gray-600 leading-snug whitespace-pre-line line-clamp-3">
            {safeMessage}
          </p>
        </div>
      </div>

      {/* Botón cerrar */}
      <div className="flex items-start pt-2 pr-2 pl-1">
        <button
          onClick={(e) => {
            e.stopPropagation();
            toast.dismiss(notification.id);
          }}
          className="text-gray-400 hover:text-gray-600 transition-colors p-1 rounded-md hover:bg-gray-100 focus:outline-none focus-visible:ring-2 focus-visible:ring-offset-1 focus-visible:ring-indigo-400"
          aria-label="Cerrar notificación"
        >
          <X className="h-4 w-4" />
        </button>
      </div>

  {/* Overlay hover reducido */}
  <div className="pointer-events-none absolute inset-0 opacity-0 group-hover:opacity-100 transition-opacity duration-300 bg-white/5" />
    </div>
  );
};

export default NotificationToast;
