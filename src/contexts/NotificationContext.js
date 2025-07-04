import React, { createContext, useContext } from 'react';
import { useLocalNotifications } from '../hooks/useLocalNotifications.js';

const NotificationContext = createContext();

export const NotificationProvider = ({ children }) => {
  const notificationMethods = useLocalNotifications();
  
  return (
    <NotificationContext.Provider value={notificationMethods}>
      {children}
    </NotificationContext.Provider>
  );
};

export const useNotificationContext = () => {
  const context = useContext(NotificationContext);
  if (!context) {
    throw new Error('useNotificationContext must be used within a NotificationProvider');
  }
  return context;
};
