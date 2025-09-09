import React, { useMemo } from 'react';
import { useNotifications } from '../hooks/useNotifications';
import { X, Mail, CheckCircle, AlertTriangle, Bell } from 'lucide-react';

// Formatea tiempo relativo (hace 5m, 2h, 3d)
const formatRelativeTime = (dateStr) => {
  try {
    const date = new Date(dateStr);
    const diff = Date.now() - date.getTime();
    const sec = Math.floor(diff / 1000);
    if (sec < 60) return 'Justo ahora';
    const min = Math.floor(sec / 60);
    if (min < 60) return `Hace ${min}m`;
    const hr = Math.floor(min / 60);
    if (hr < 24) return `Hace ${hr}h`;
    const d = Math.floor(hr / 24);
    if (d < 7) return `Hace ${d}d`;
    return date.toLocaleDateString();
  } catch {
    return '';
  }
};

const NotificationPanel = ({ onClose }) => {
  const { notifications, loading, markAsRead, markAllAsRead } = useNotifications();
  console.debug('[NotificationPanel] Render. loading=', loading, 'notifications.len=', notifications?.length);

  const unreadCount = useMemo(() => (notifications || []).filter(n => !n.is_read).length, [notifications]);

  const getNotificationIcon = (type, isRead) => {
    const base = 'h-5 w-5';
    switch (type) {
      case 'TEMPLATE_APPROVED':
        return <CheckCircle className={`${base} ${isRead ? 'text-green-400' : 'text-green-500'}`} />;
      case 'TEMPLATE_REJECTED':
        return <AlertTriangle className={`${base} ${isRead ? 'text-red-400' : 'text-red-500'}`} />;
      default:
        return <Mail className={`${base} ${isRead ? 'text-gray-300' : 'text-blue-500'}`} />;
    }
  };

  const Skeleton = () => (
    <div className="animate-pulse px-4 py-3 flex items-start gap-4">
      <div className="w-5 h-5 rounded-full bg-gray-200" />
      <div className="flex-1 space-y-2">
        <div className="h-3 bg-gray-200 rounded w-5/6" />
        <div className="h-3 bg-gray-100 rounded w-3/6" />
      </div>
    </div>
  );

  return (
    <div className="absolute right-0 mt-2 w-[420px] max-w-[90vw] z-50">
      <div className="overflow-hidden rounded-2xl shadow-2xl ring-1 ring-black/5 bg-white backdrop-blur supports-[backdrop-filter]:bg-white/80 animate-fade-in">
        {/* Header */}
        <div className="px-5 py-4 bg-gradient-to-r from-blue-600 via-blue-500 to-indigo-500 text-white flex items-center justify-between">
          <div className="flex items-center gap-2">
            <Bell className="h-5 w-5" />
            <h3 className="font-semibold text-sm tracking-wide uppercase">Notificaciones</h3>
            {unreadCount > 0 && (
              <span className="ml-1 px-2 py-0.5 text-[11px] font-medium rounded-full bg-white/20 backdrop-blur-sm">{unreadCount}</span>
            )}
          </div>
          <div className="flex items-center gap-3">
            {unreadCount > 0 && (
              <button
                onClick={() => { console.debug('[NotificationPanel] markAllAsRead clicked'); markAllAsRead(); }}
                className="text-xs font-medium hover:underline focus:outline-none"
              >Marcar todo</button>
            )}
            <button onClick={onClose} className="p-1 rounded hover:bg-white/20 transition-colors">
              <X className="h-5 w-5" />
            </button>
          </div>
        </div>

        {/* Lista */}
        <div className="max-h-96 overflow-y-auto thin-scroll divide-y divide-gray-100">
          {loading && (
            <div>
              <Skeleton />
              <Skeleton />
              <Skeleton />
            </div>
          )}
          {!loading && (!notifications || notifications.length === 0) && (
            <div className="px-6 py-10 text-center text-gray-500 flex flex-col items-center gap-3">
              <div className="w-12 h-12 rounded-full bg-gray-100 flex items-center justify-center">
                <Bell className="h-6 w-6 text-gray-400" />
              </div>
              <p className="text-sm font-medium">No hay notificaciones</p>
              <p className="text-xs text-gray-400 max-w-xs">Te avisaremos cuando ocurra algo relevante como la aprobación o rechazo de plantillas.</p>
            </div>
          )}
          {!loading && notifications && notifications.length > 0 && notifications.map(n => {
            const isUnread = !n.is_read;
            return (
              <button
                key={n.id}
                onClick={() => { if (isUnread) { console.debug('[NotificationPanel] markAsRead clicked id=', n.id); markAsRead(n.id); } else { console.debug('[NotificationPanel] click ignored (already read) id=', n.id); } }}
                className={`w-full text-left group px-5 py-3 flex gap-4 relative transition-colors duration-150 focus:outline-none ${isUnread ? 'bg-blue-50/60 hover:bg-blue-100/70' : 'hover:bg-gray-50'}`}
              >
                <div className="relative mt-0.5">
                  <div className={`flex items-center justify-center rounded-full w-9 h-9 border ${isUnread ? 'bg-white border-blue-200 shadow-sm' : 'bg-gray-50 border-gray-200'}`}>
                    {getNotificationIcon(n.type, !isUnread)}
                  </div>
                  {isUnread && <span className="absolute -top-0.5 -right-0.5 w-3 h-3 rounded-full bg-blue-500 ring-2 ring-white" />}
                </div>
                <div className="flex-1 min-w-0">
                  <p className={`text-sm leading-snug ${isUnread ? 'text-gray-800 font-medium' : 'text-gray-600'}`}>{n.message}</p>
                  <div className="mt-1 flex items-center gap-2 text-[11px] text-gray-400">
                    <span>{formatRelativeTime(n.created_at)}</span>
                    {isUnread && <span className="uppercase tracking-wide text-blue-500 font-semibold text-[10px]">Nuevo</span>}
                  </div>
                </div>
              </button>
            );
          })}
        </div>

        {/* Footer */}
        <div className="px-4 py-2.5 bg-gray-50/80 backdrop-blur-sm flex items-center justify-between text-xs border-t border-gray-100">
          <span className="text-gray-400 select-none">Centro de Notificaciones</span>
          <button className="text-blue-600 hover:text-blue-700 font-medium">Ver todas</button>
        </div>
      </div>
    </div>
  );
};

export default NotificationPanel;
