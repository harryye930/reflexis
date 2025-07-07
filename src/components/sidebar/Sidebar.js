import React, { useState } from 'react';
import SlidingTabControl from './shared/SlidingTabControl.js';
import AnalysisTab from './analysis/AnalysisTab.js';
import NotificationsTab from './notifications/NotificationsTab.js';
import AdminTab from './admin/AdminTab.js';
import { useNotificationContext } from '../../contexts/NotificationContext.js';

const Sidebar = ({ 
  currentUser, 
  currentUserProfile, 
  userProfiles, 
  userProfilesLoaded, 
  onCodeSelect, 
  onMessage,
  // Code management props
  allCodes,
  onAddCode,
  onUpdateCode,
  onDeleteCode,
  onCheckCodeUsage,
  onDeleteHighlightsByCode,
  // Hover preferences props
  showHoverTooltips,
  showAuthorInfo,
  onToggleHoverTooltips,
  onToggleAuthorInfo
}) => {
  const [activeTab, setActiveTab] = useState('analysis');
  
  // Local notifications context (no Firebase)
  const {
    notifications,
    loading: notificationsLoading,
    unreadCount,
    markAsRead,
    markAsUnread,
    deleteNotification,
    markAllAsRead,
    addDemoNotification
  } = useNotificationContext();

  const renderActiveTab = () => {
    switch (activeTab) {
      case 'analysis':
        return (
          <AnalysisTab
            currentUser={currentUser}
            currentUserProfile={currentUserProfile}
            userProfiles={userProfiles}
            userProfilesLoaded={userProfilesLoaded}
            onCodeSelect={onCodeSelect}
            onMessage={onMessage}
            allCodes={allCodes}
            onAddCode={onAddCode}
            onUpdateCode={onUpdateCode}
            onDeleteCode={onDeleteCode}
            onCheckCodeUsage={onCheckCodeUsage}
            onDeleteHighlightsByCode={onDeleteHighlightsByCode}
          />
        );
      
      case 'notifications':
        return (
          <NotificationsTab
            notifications={notifications}
            notificationsLoading={notificationsLoading}
            markAsRead={markAsRead}
            markAsUnread={markAsUnread}
            deleteNotification={deleteNotification}
            markAllAsRead={markAllAsRead}
            addDemoNotification={addDemoNotification}
          />
        );
      
      case 'admin':
        return (
          <AdminTab
            userProfiles={userProfiles}
            currentUser={currentUser}
            showAuthorInfo={showAuthorInfo}
            onMessage={onMessage}
            showHoverTooltips={showHoverTooltips}
            onToggleHoverTooltips={onToggleHoverTooltips}
            onToggleAuthorInfo={onToggleAuthorInfo}
          />
        );
      
      default:
        return null;
    }
  };

  return (
    <aside className="w-full bg-white border-l border-gray-200 flex flex-col h-screen">
      {/* Tab Control */}
      <div className="flex-shrink-0 p-4 border-b border-gray-200">
        <SlidingTabControl
          activeTab={activeTab}
          onTabChange={setActiveTab}
          unreadCount={unreadCount}
        />
      </div>

      {/* Content Area */}
      <div className="flex-1 overflow-y-auto">
        {renderActiveTab()}
      </div>
    </aside>
  );
};

export default Sidebar;
