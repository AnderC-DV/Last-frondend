import React, { useState } from 'react';
import { Bell } from 'lucide-react';
import { useNotifications } from '../hooks/useNotifications';
import NotificationPanel from './NotificationPanel';

const NotificationIcon = () => {
  const { unreadCount, fetchNotifications } = useNotifications();
  const [isPanelOpen, setIsPanelOpen] = useState(false);

  const handleTogglePanel = () => {
    console.debug('[NotificationIcon] Toggle clicked. isPanelOpen(before)=', isPanelOpen, 'unreadCount=', unreadCount);
    if (!isPanelOpen) {
      console.debug('[NotificationIcon] Opening panel -> fetchNotifications()');
      fetchNotifications();
    }
    setIsPanelOpen(prev => {
      const next = !prev;
      console.debug('[NotificationIcon] isPanelOpen(after)=', next);
      return next;
    });
  };

  return (
    <div className="relative">
      <button onClick={handleTogglePanel} className="relative">
        <Bell className="h-6 w-6 text-gray-600" />
        {unreadCount > 0 && (
          <span className="absolute -top-2 -right-2 flex h-5 w-5 items-center justify-center rounded-full bg-red-500 text-xs font-bold text-white ring-2 ring-white">
            {unreadCount}
          </span>
        )}
      </button>
  {isPanelOpen && <NotificationPanel onClose={() => { console.debug('[NotificationIcon] Panel onClose invoked'); setIsPanelOpen(false); }} />}
    </div>
  );
};

export default NotificationIcon;
