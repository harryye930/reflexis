import { useState, useEffect } from 'react';
import { NotificationService } from '../services/api/firebase/notificationService.js';

export const useNotifications = (appId, currentUser) => {
  const [notifications, setNotifications] = useState([]);
  const [loading, setLoading] = useState(true);
  const [unreadCount, setUnreadCount] = useState(0);
  const [notificationService] = useState(() => new NotificationService(appId));

  useEffect(() => {
    if (!appId || !currentUser) {
      setNotifications([]);
      setUnreadCount(0);
      setLoading(false);
      return;
    }

    const unsubscribe = notificationService.onNotificationsSnapshot(currentUser.uid, (notificationsList) => {
      setNotifications(notificationsList);
      setUnreadCount(notificationsList.filter(n => !n.read).length);
      setLoading(false);
    });

    return () => unsubscribe();
  }, [appId, currentUser, notificationService]);

  const addNotification = async (notification) => {
    if (!appId || !currentUser) return { success: false };

    return await notificationService.addNotification(notification, currentUser.uid);
  };

  const markAsRead = async (notificationId) => {
    if (!appId) return { success: false };

    return await notificationService.markAsRead(notificationId);
  };

  const markAsUnread = async (notificationId) => {
    if (!appId) return { success: false };

    return await notificationService.markAsUnread(notificationId);
  };

  const deleteNotification = async (notificationId) => {
    if (!appId) return { success: false };

    return await notificationService.deleteNotification(notificationId);
  };

  const markAllAsRead = async () => {
    if (!appId || !currentUser) return { success: false };

    return await notificationService.markAllAsRead(currentUser.uid);
  };

  return {
    notifications,
    unreadCount,
    loading,
    addNotification,
    markAsRead,
    markAsUnread,
    deleteNotification,
    markAllAsRead
  };
};
