import React from 'react';

const NotificationIndicator = ({ unreadCount, size = "md" }) => {
  if (!unreadCount || unreadCount === 0) return null;

  const sizeClasses = {
    sm: "w-4 h-4 text-xs",
    md: "w-5 h-5 text-xs", 
    lg: "w-6 h-6 text-sm"
  };

  const displayCount = unreadCount > 99 ? "99+" : unreadCount.toString();

  return (
    <div className={`${sizeClasses[size]} bg-red-500 text-white rounded-full flex items-center justify-center font-medium shadow-sm border-2 border-white`}>
      {displayCount}
    </div>
  );
};

export default NotificationIndicator;
