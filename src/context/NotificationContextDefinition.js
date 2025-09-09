import { createContext } from 'react';

// Definir un valor por defecto para el contexto
const defaultNotificationContext = {
  notifications: [],
  unreadCount: 0,
  loading: false,
  loadingCount: false,
  fetchNotifications: () => {},
  markAsRead: () => {},
  markAllAsRead: () => {},
};

export const NotificationContext = createContext(defaultNotificationContext);
