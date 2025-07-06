import React from 'react';
import NotificationItem from './NotificationItem.js';

const NotificationList = ({ 
  notifications, 
  loading, 
  onMarkAsRead, 
  onMarkAsUnread, 
  onDelete,
  onMarkAllAsRead
}) => {
  if (loading) {
    return (
      <div className="flex items-center justify-center py-8">
        <div className="flex items-center gap-2 text-gray-500">
          <svg className="animate-spin h-4 w-4" fill="none" viewBox="0 0 24 24">
            <circle className="opacity-25" cx="12" cy="12" r="10" stroke="currentColor" strokeWidth="4"></circle>
            <path className="opacity-75" fill="currentColor" d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4zm2 5.291A7.962 7.962 0 014 12H0c0 3.042 1.135 5.824 3 7.938l3-2.647z"></path>
          </svg>
          <span className="text-sm">Loading notifications...</span>
        </div>
      </div>
    );
  }

  if (!notifications || notifications.length === 0) {
    return (
      <div className="text-center py-12">
        <div className="w-16 h-16 mx-auto mb-4 bg-gray-100 rounded-full flex items-center justify-center">
          <svg className="w-8 h-8 text-gray-400" fill="none" stroke="currentColor" viewBox="0 0 24 24">
            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={1} d="M15 17h5l-5 5-5-5h5v-5h0zm-5-10h5l-5-5-5 5h5v5h0z" />
          </svg>
        </div>
        <h3 className="text-sm font-medium text-gray-700 mb-2">No notifications yet</h3>
        <p className="text-xs text-gray-500 max-w-sm mx-auto leading-relaxed">
          You&apos;ll receive notifications here for important updates, mentions, and collaboration activities.
        </p>
      </div>
    );
  }

  const unreadCount = notifications.filter(n => !n.read).length;

  return (
    <div className="space-y-4">
      {/* Header with actions */}
      {unreadCount > 0 && (
        <div className="flex items-center justify-between pb-3 border-b border-gray-200">
          <span className="text-sm text-gray-600">
            {unreadCount} unread notification{unreadCount !== 1 ? 's' : ''}
          </span>
          <button
            onClick={onMarkAllAsRead}
            className="text-xs px-3 py-1 text-blue-600 hover:bg-blue-50 rounded-md transition-colors"
          >
            Mark all read
          </button>
        </div>
      )}

      {/* Notifications list */}
      <div className="space-y-3">
        {notifications.map(notification => (
          <NotificationItem
            key={notification.id}
            notification={notification}
            onMarkAsRead={onMarkAsRead}
            onMarkAsUnread={onMarkAsUnread}
            onDelete={onDelete}
          />
        ))}
      </div>
    </div>
  );
};

export default NotificationList;
