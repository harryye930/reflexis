import { useState } from 'react';
import { useNotificationContext } from '../contexts/NotificationContext.js';

export const useMobileNotifications = () => {
  const [showMobileNotifications, setShowMobileNotifications] = useState(false);
  const { unreadCount } = useNotificationContext();

  const toggleMobileNotifications = () => {
    setShowMobileNotifications(!showMobileNotifications);
  };

  const closeMobileNotifications = () => {
    setShowMobileNotifications(false);
  };

  return {
    showMobileNotifications,
    unreadCount,
    toggleMobileNotifications,
    closeMobileNotifications
  };
};
