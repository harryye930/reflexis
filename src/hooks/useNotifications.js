import { useState, useEffect } from 'react';
import { collection, doc, addDoc, updateDoc, deleteDoc, onSnapshot, query, orderBy, where } from 'firebase/firestore';
import { db } from '../lib/firebase.js';

export const useNotifications = (appId, currentUser) => {
  const [notifications, setNotifications] = useState([]);
  const [loading, setLoading] = useState(true);
  const [unreadCount, setUnreadCount] = useState(0);

  useEffect(() => {
    if (!appId || !currentUser) {
      setNotifications([]);
      setUnreadCount(0);
      setLoading(false);
      return;
    }

    const notificationsRef = collection(db, 'apps', appId, 'notifications');
    const q = query(
      notificationsRef,
      where('userId', '==', currentUser.uid),
      orderBy('createdAt', 'desc')
    );

    const unsubscribe = onSnapshot(q, (snapshot) => {
      const notificationsList = snapshot.docs.map(doc => ({
        id: doc.id,
        ...doc.data()
      }));

      setNotifications(notificationsList);
      setUnreadCount(notificationsList.filter(n => !n.read).length);
      setLoading(false);
    });

    return () => unsubscribe();
  }, [appId, currentUser]);

  const addNotification = async (notification) => {
    if (!appId || !currentUser) return { success: false };

    try {
      const notificationsRef = collection(db, 'apps', appId, 'notifications');
      await addDoc(notificationsRef, {
        ...notification,
        userId: currentUser.uid,
        read: false,
        createdAt: new Date(),
        updatedAt: new Date()
      });
      return { success: true };
    } catch (error) {
      console.error('Error adding notification:', error);
      return { success: false, error };
    }
  };

  const markAsRead = async (notificationId) => {
    if (!appId) return { success: false };

    try {
      const notificationRef = doc(db, 'apps', appId, 'notifications', notificationId);
      await updateDoc(notificationRef, {
        read: true,
        updatedAt: new Date()
      });
      return { success: true };
    } catch (error) {
      console.error('Error marking notification as read:', error);
      return { success: false, error };
    }
  };

  const markAsUnread = async (notificationId) => {
    if (!appId) return { success: false };

    try {
      const notificationRef = doc(db, 'apps', appId, 'notifications', notificationId);
      await updateDoc(notificationRef, {
        read: false,
        updatedAt: new Date()
      });
      return { success: true };
    } catch (error) {
      console.error('Error marking notification as unread:', error);
      return { success: false, error };
    }
  };

  const deleteNotification = async (notificationId) => {
    if (!appId) return { success: false };

    try {
      const notificationRef = doc(db, 'apps', appId, 'notifications', notificationId);
      await deleteDoc(notificationRef);
      return { success: true };
    } catch (error) {
      console.error('Error deleting notification:', error);
      return { success: false, error };
    }
  };

  const markAllAsRead = async () => {
    if (!appId) return { success: false };

    try {
      const unreadNotifications = notifications.filter(n => !n.read);
      const promises = unreadNotifications.map(notification => 
        markAsRead(notification.id)
      );
      await Promise.all(promises);
      return { success: true };
    } catch (error) {
      console.error('Error marking all notifications as read:', error);
      return { success: false, error };
    }
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
