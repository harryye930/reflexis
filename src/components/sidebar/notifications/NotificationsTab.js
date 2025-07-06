import React from 'react';
import NotificationList from '../../collaboration/notifications/NotificationList.js';

const NotificationsTab = ({ 
  notifications,
  notificationsLoading,
  markAsRead,
  markAsUnread,
  deleteNotification,
  markAllAsRead,
  addDemoNotification
}) => {
  return (
    <div className="p-6">
      <div className="mb-4">
        <div className="flex items-center justify-between">
          <div>
            <h2 className="text-xl font-bold text-gray-900">Notifications</h2>
            <p className="text-sm text-gray-600 mt-1">
              Stay updated with collaboration activities and important updates
            </p>
          </div>
          {/* Demo notification button for development */}
          <button
            onClick={addDemoNotification}
            className="px-3 py-1 text-xs bg-blue-100 text-blue-700 rounded-md hover:bg-blue-200 transition-colors"
            title="Add demo notification for testing"
          >
            + Demo
          </button>
        </div>
      </div>
      
      <NotificationList
        notifications={notifications}
        loading={notificationsLoading}
        onMarkAsRead={markAsRead}
        onMarkAsUnread={markAsUnread}
        onDelete={deleteNotification}
        onMarkAllAsRead={markAllAsRead}
      />
    </div>
  );
};

export default NotificationsTab;
