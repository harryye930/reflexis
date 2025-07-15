import React, { useState, useEffect } from 'react';
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
  onMessage,
  // Code management props
  allCodes,
  deletedCodes, // New prop for deleted codes
  onAddCode,
  onUpdateCode,
  onDeleteCode,
  onMergeCodes, // New prop for code merging
  onSplitCode, // New prop for code splitting
  onCheckCodeUsage,
  onDeleteHighlightsByCode,
  // Hover preferences props
  showHoverTooltips,
  showAuthorInfo,
  onToggleHoverTooltips,
  onToggleAuthorInfo,
  disableHighlightManagement,
  onToggleDisableHighlightManagement,
  // Navigation props
  onNavigateToHighlight
}) => {
  const [activeTab, setActiveTab] = useState('analysis');
  const [livingCodebookState, setLivingCodebookState] = useState({
    isActive: false,
    selectedCode: null
  });
  
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

  const handleCodeNameClick = (code) => {
    // Always select the latest code object from allCodes by id
    const latestCode = allCodes.find(c => c.id === code.id || c.docId === code.docId);
    setLivingCodebookState({
      isActive: true,
      selectedCode: latestCode || code // fallback to passed code if not found
    });
  };

  // Helper to update selectedCode after edit
  const handleUpdateCodeInLivingCodebook = (updatedCode) => {
    const latestCode = allCodes.find(c => c.id === updatedCode.id || c.docId === updatedCode.docId);
    setLivingCodebookState(prev => ({
      ...prev,
      selectedCode: latestCode || updatedCode
    }));
  };

  // Helper to clear selectedCode after delete
  const handleBackToAllCodes = () => {
    setLivingCodebookState({
      isActive: false,
      selectedCode: null
    });
  };

  // --- Add this useEffect to sync selectedCode with allCodes after edits ---
  useEffect(() => {
    if (livingCodebookState.isActive && livingCodebookState.selectedCode) {
      const latestCode = allCodes.find(c =>
        c.id === livingCodebookState.selectedCode.id ||
        c.docId === livingCodebookState.selectedCode.docId
      );
      // Only update if the code object is different (by label/description/color/textColor)
      if (
        latestCode &&
        (
          latestCode.label !== livingCodebookState.selectedCode.label ||
          latestCode.description !== livingCodebookState.selectedCode.description ||
          latestCode.color !== livingCodebookState.selectedCode.color ||
          latestCode.textColor !== livingCodebookState.selectedCode.textColor
        )
      ) {
        setLivingCodebookState(prev => ({
          ...prev,
          selectedCode: latestCode
        }));
      }
    }
  }, [allCodes, livingCodebookState.isActive, livingCodebookState.selectedCode]);
  // --- End sync useEffect ---

  const renderActiveTab = () => {
    switch (activeTab) {
      case 'analysis':
        return (
          <AnalysisTab
            currentUser={currentUser}
            currentUserProfile={currentUserProfile}
            userProfiles={userProfiles}
            userProfilesLoaded={userProfilesLoaded}
            onMessage={onMessage}
            allCodes={allCodes}
            deletedCodes={deletedCodes}
            onAddCode={onAddCode}
            onUpdateCode={onUpdateCode}
            onDeleteCode={onDeleteCode}
            onMergeCodes={onMergeCodes} // Pass down the onMergeCodes prop
            onSplitCode={onSplitCode} // Pass down the onSplitCode prop
            onCheckCodeUsage={onCheckCodeUsage}
            onDeleteHighlightsByCode={onDeleteHighlightsByCode}
            livingCodebookState={livingCodebookState}
            onCodeNameClick={handleCodeNameClick}
            onBackToAllCodes={handleBackToAllCodes}
            onUpdateCodeInLivingCodebook={handleUpdateCodeInLivingCodebook}
            onNavigateToHighlight={onNavigateToHighlight}
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
            disableHighlightManagement={disableHighlightManagement}
            onToggleDisableHighlightManagement={onToggleDisableHighlightManagement}
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
