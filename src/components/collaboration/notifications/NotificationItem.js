import React from 'react';
import { getNotificationTypeIcon } from '../../../lib/utils/notificationUtils.js';

const NotificationItem = ({ 
  notification, 
  onMarkAsRead, 
  onMarkAsUnread, 
  onDelete 
}) => {
  const handleMarkAsRead = () => {
    if (!notification.read) {
      onMarkAsRead(notification.id);
    }
  };

  const handleMarkAsUnread = () => {
    if (notification.read) {
      onMarkAsUnread(notification.id);
    }
  };

  const handleDelete = () => {
    onDelete(notification.id);
  };

  const getNotificationIcon = (type) => {
    return getNotificationTypeIcon(type);
  };

  const formatTimestamp = (timestamp) => {
    const date = timestamp?.seconds ? new Date(timestamp.seconds * 1000) : new Date(timestamp);
    const now = new Date();
    const diffInHours = (now - date) / (1000 * 60 * 60);
    
    if (diffInHours < 1) {
      return 'Just now';
    } else if (diffInHours < 24) {
      return `${Math.floor(diffInHours)}h ago`;
    } else if (diffInHours < 48) {
      return 'Yesterday';
    } else {
      return date.toLocaleDateString();
    }
  };

  return (
    <div className={`p-4 border rounded-lg transition-all duration-200 ${
      notification.read 
        ? 'bg-gray-50 border-gray-200' 
        : 'bg-blue-50 border-blue-200 shadow-sm'
    }`}>
      <div className="flex items-start gap-3">
        {/* Icon */}
        <div className={`flex-shrink-0 w-8 h-8 rounded-full flex items-center justify-center text-sm ${
          notification.read 
            ? 'bg-gray-200 text-gray-600' 
            : 'bg-blue-100 text-blue-600'
        }`}>
          {getNotificationIcon(notification.type)}
        </div>

        {/* Content */}
        <div className="flex-1 min-w-0">
          <div className="flex items-start justify-between">
            <div className="flex-1">
              <h4 className={`text-sm font-medium ${
                notification.read ? 'text-gray-700' : 'text-gray-900'
              }`}>
                {notification.title}
              </h4>
              <p className={`text-sm mt-1 ${
                notification.read ? 'text-gray-500' : 'text-gray-700'
              }`}>
                {notification.message}
              </p>
              <p className="text-xs text-gray-400 mt-2">
                {formatTimestamp(notification.createdAt)}
              </p>
            </div>

            {/* Read indicator */}
            {!notification.read && (
              <div className="flex-shrink-0 w-2 h-2 bg-blue-500 rounded-full ml-2 mt-1"></div>
            )}
          </div>

          {/* Actions */}
          <div className="flex items-center gap-2 mt-3">
            {!notification.read ? (
              <button
                onClick={handleMarkAsRead}
                className="text-xs px-2 py-1 text-blue-600 hover:bg-blue-100 rounded transition-colors"
                title="Mark as read"
              >
                Mark read
              </button>
            ) : (
              <button
                onClick={handleMarkAsUnread}
                className="text-xs px-2 py-1 text-gray-600 hover:bg-gray-100 rounded transition-colors"
                title="Mark as unread"
              >
                Mark unread
              </button>
            )}
            <button
              onClick={handleDelete}
              className="text-xs px-2 py-1 text-red-600 hover:bg-red-100 rounded transition-colors"
              title="Delete notification"
            >
              Delete
            </button>
          </div>
        </div>
      </div>
    </div>
  );
};

export default NotificationItem;
