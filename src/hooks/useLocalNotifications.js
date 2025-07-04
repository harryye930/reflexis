import { useState, useCallback } from 'react';
import { getRandomDemoNotification } from '../lib/utils/notificationUtils.js';

export const useLocalNotifications = () => {
  const [notifications, setNotifications] = useState([]);
  const [loading, setLoading] = useState(false);

  // Generate a unique ID for notifications
  const generateId = () => `notification_${Date.now()}_${Math.random().toString(36).substr(2, 9)}`;

  const addNotification = useCallback((notification) => {
    const newNotification = {
      id: generateId(),
      ...notification,
      read: false,
      createdAt: new Date(),
      updatedAt: new Date()
    };

    setNotifications(prev => [newNotification, ...prev]);
    return { success: true, notification: newNotification };
  }, []);

  const markAsRead = useCallback((notificationId) => {
    setNotifications(prev => 
      prev.map(notification => 
        notification.id === notificationId 
          ? { ...notification, read: true, updatedAt: new Date() }
          : notification
      )
    );
    return { success: true };
  }, []);

  const markAsUnread = useCallback((notificationId) => {
    setNotifications(prev => 
      prev.map(notification => 
        notification.id === notificationId 
          ? { ...notification, read: false, updatedAt: new Date() }
          : notification
      )
    );
    return { success: true };
  }, []);

  const deleteNotification = useCallback((notificationId) => {
    setNotifications(prev => prev.filter(notification => notification.id !== notificationId));
    return { success: true };
  }, []);

  const markAllAsRead = useCallback(() => {
    setNotifications(prev => 
      prev.map(notification => ({ 
        ...notification, 
        read: true, 
        updatedAt: new Date() 
      }))
    );
    return { success: true };
  }, []);

  const addDemoNotification = useCallback(() => {
    const demoNotification = getRandomDemoNotification();
    return addNotification(demoNotification);
  }, [addNotification]);

  // Initialize with a welcome notification
  const initializeWithWelcome = useCallback(() => {
    if (notifications.length === 0) {
      addNotification({
        type: 'collaboration',
        title: 'Welcome to ScholarMate!',
        message: 'You can now receive notifications for collaboration activities, mentions, and important updates.',
        priority: 'normal'
      });
    }
  }, [notifications.length, addNotification]);

  const unreadCount = notifications.filter(n => !n.read).length;

  return {
    notifications,
    unreadCount,
    loading,
    addNotification,
    markAsRead,
    markAsUnread,
    deleteNotification,
    markAllAsRead,
    addDemoNotification,
    initializeWithWelcome
  };
};
