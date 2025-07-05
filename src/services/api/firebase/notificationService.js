import { collection, doc, addDoc, updateDoc, deleteDoc, onSnapshot, query, orderBy, where } from 'firebase/firestore';
import { db } from '../../../lib/firebase.js';

export class NotificationService {
  constructor(appId) {
    this.appId = appId;
  }

  // Listen to notifications for a specific user
  onNotificationsSnapshot(userId, callback) {
    const notificationsRef = collection(db, 'apps', this.appId, 'notifications');
    const q = query(
      notificationsRef,
      where('userId', '==', userId),
      orderBy('createdAt', 'desc')
    );

    return onSnapshot(q, (snapshot) => {
      const notificationsList = snapshot.docs.map(doc => ({
        id: doc.id,
        ...doc.data()
      }));
      callback(notificationsList);
    });
  }

  // Add a new notification
  async addNotification(notification, userId) {
    try {
      const notificationsRef = collection(db, 'apps', this.appId, 'notifications');
      await addDoc(notificationsRef, {
        ...notification,
        userId,
        read: false,
        createdAt: new Date(),
        updatedAt: new Date()
      });
      return { success: true };
    } catch (error) {
      console.error('Error adding notification:', error);
      return { success: false, error };
    }
  }

  // Mark notification as read
  async markAsRead(notificationId) {
    try {
      const notificationRef = doc(db, 'apps', this.appId, 'notifications', notificationId);
      await updateDoc(notificationRef, {
        read: true,
        updatedAt: new Date()
      });
      return { success: true };
    } catch (error) {
      console.error('Error marking notification as read:', error);
      return { success: false, error };
    }
  }

  // Mark notification as unread
  async markAsUnread(notificationId) {
    try {
      const notificationRef = doc(db, 'apps', this.appId, 'notifications', notificationId);
      await updateDoc(notificationRef, {
        read: false,
        updatedAt: new Date()
      });
      return { success: true };
    } catch (error) {
      console.error('Error marking notification as unread:', error);
      return { success: false, error };
    }
  }

  // Delete a notification
  async deleteNotification(notificationId) {
    try {
      const notificationRef = doc(db, 'apps', this.appId, 'notifications', notificationId);
      await deleteDoc(notificationRef);
      return { success: true };
    } catch (error) {
      console.error('Error deleting notification:', error);
      return { success: false, error };
    }
  }

  // Mark all notifications as read
  async markAllAsRead(userId) {
    try {
      const notificationsRef = collection(db, 'apps', this.appId, 'notifications');
      const q = query(
        notificationsRef,
        where('userId', '==', userId),
        where('read', '==', false)
      );
      
      const snapshot = await new Promise((resolve) => {
        const unsubscribe = onSnapshot(q, resolve, { includeMetadataChanges: true });
        setTimeout(() => unsubscribe(), 1000); // Timeout after 1 second
      });
      
      const unreadNotifications = snapshot.docs;
      const promises = unreadNotifications.map(doc => 
        this.markAsRead(doc.id)
      );
      await Promise.all(promises);
      return { success: true };
    } catch (error) {
      console.error('Error marking all notifications as read:', error);
      return { success: false, error };
    }
  }

  // Get notifications for a specific user
  async getNotifications(userId) {
    try {
      const notificationsRef = collection(db, 'apps', this.appId, 'notifications');
      const q = query(
        notificationsRef,
        where('userId', '==', userId),
        orderBy('createdAt', 'desc')
      );
      
      const snapshot = await new Promise((resolve) => {
        const unsubscribe = onSnapshot(q, resolve, { includeMetadataChanges: true });
        setTimeout(() => unsubscribe(), 1000); // Timeout after 1 second
      });
      
      const notificationsList = snapshot.docs.map(doc => ({
        id: doc.id,
        ...doc.data()
      }));
      
      return { success: true, data: notificationsList };
    } catch (error) {
      console.error('Error getting notifications:', error);
      return { success: false, error };
    }
  }
} 