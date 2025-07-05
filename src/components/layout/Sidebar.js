import React, { useState, useEffect } from 'react';
import UserInfo from '../collaboration/UserInfo.js';
import CollaboratorLegend from '../collaboration/CollaboratorLegend.js';
import CodeManagement from '../collaboration/codePalette/CodeManagement.js';
import AdminControls from '../collaboration/AdminControls.js';
import SlidingTabControl from '../collaboration/SlidingTabControl.js';
import NotificationList from '../collaboration/notifications/NotificationList.js';
import { useNotificationContext } from '../../contexts/NotificationContext.js';

const Sidebar = ({ 
  currentUser, 
  currentUserProfile, 
  userProfiles, 
  userProfilesLoaded, 
  onCodeSelect, 
  onMessage,
  isSelectionActive,
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
        {activeTab === 'analysis' ? (
          // Analysis Tools Page
          <div className="p-6">
            <UserInfo 
              currentUser={currentUser}
              currentUserProfile={currentUserProfile}
              userProfilesLoaded={userProfilesLoaded}
            />

            <CodeManagement 
              allCodes={allCodes}
              onCodeSelect={onCodeSelect}
              disabled={!isSelectionActive}
              currentUser={currentUser}
              userProfiles={userProfiles}
              onAddCode={onAddCode}
              onUpdateCode={onUpdateCode}
              onDeleteCode={onDeleteCode}
              onMessage={onMessage}
              onCheckCodeUsage={onCheckCodeUsage}
              onDeleteHighlightsByCode={onDeleteHighlightsByCode}
            />

            <CollaboratorLegend 
              userProfiles={userProfiles}
              currentUser={currentUser}
            />
          </div>
        ) : (
          // Notifications Page
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
        )}
      </div>
      
      {/* Footer - Only show on Analysis Tools page */}
      {activeTab === 'analysis' && (
        <div className="flex-shrink-0 border-t border-gray-200 p-6">
          <AdminControls 
            onMessage={onMessage}
            showHoverTooltips={showHoverTooltips}
            showAuthorInfo={showAuthorInfo}
            onToggleHoverTooltips={onToggleHoverTooltips}
            onToggleAuthorInfo={onToggleAuthorInfo}
          />
        </div>
      )}
    </aside>
  );
};

export default Sidebar;
