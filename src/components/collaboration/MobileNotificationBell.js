import React from 'react';
import NotificationIndicator from './notifications/NotificationIndicator.js';

const MobileNotificationBell = ({ unreadCount, onClick }) => {
  if (unreadCount === 0) return null;

  return (
    <button
      onClick={onClick}
      className="fixed top-4 right-4 z-50 bg-blue-600 hover:bg-blue-700 text-white rounded-full p-3 shadow-lg transition-all duration-300 hover:scale-110 md:hidden"
      title={`${unreadCount} unread notification${unreadCount !== 1 ? 's' : ''}`}
    >
      {/* Bell Icon */}
      <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
        <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M15 17h5l-5 5v-5zm-8-4a6 6 0 1112 0c0 7-3 9-3 9H9s-3-2-3-9z" />
        <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M13.73 21a2 2 0 01-3.46 0" />
      </svg>
      
      {/* Unread Count Badge */}
      <div className="absolute -top-1 -right-1">
        <NotificationIndicator unreadCount={unreadCount} size="sm" />
      </div>
    </button>
  );
};

export default MobileNotificationBell;
