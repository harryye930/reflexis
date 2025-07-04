import React, { useEffect } from 'react';
import { appId } from '../constants/index.js';
import { useAuth } from '../hooks/useAuth.js';
import { useDocuments } from '../hooks/useDocuments.js';
import { useHighlights } from '../hooks/useHighlights.js';
import { useUserProfiles } from '../hooks/useUserProfiles.js';
import { useUserActivity } from '../hooks/useUserActivity.js';
import { useCodes } from '../hooks/useCodes.js';
import { useHighlightManagement } from '../hooks/useHighlightManagement.js';
import { useMessageHandler } from '../hooks/useMessageHandler.js';
import { useMobileNotifications } from '../hooks/useMobileNotifications.js';
import { NotificationProvider, useNotificationContext } from '../contexts/NotificationContext.js';

// Components
import HighlightedText from './collaboration/HighlightedText.js';
import HighlightingModal from './collaboration/HighlightingModal.js';
import MessageBox from './collaboration/MessageBox.js';
import UserProfileSetup from './collaboration/UserProfileSetup.js';
import DocumentBrowser from './collaboration/DocumentBrowser.js';
import MobileNotificationBell from './collaboration/MobileNotificationBell.js';
import MobileNotificationPanel from './collaboration/MobileNotificationPanel.js';
import MobileCodingPanel from './collaboration/MobileCodingPanel.js';
import Sidebar from './layout/Sidebar.js';
import MobileDocumentSelector from './layout/MobileDocumentSelector.js';
import DocumentHeader from './layout/DocumentHeader.js';

function CollaborativeTextContent() {
  // Custom hooks for data management
  const { currentUser, loading, needsProfileSetup, completeProfile } = useAuth(appId);
  const { documents, activeDocument, activeDocumentId, documentsLoaded, addDocument, updateDocument, deleteDocument, switchActiveDocument } = useDocuments(appId, currentUser);
  const { highlights, addHighlight, deleteHighlight } = useHighlights(appId, currentUser, activeDocumentId);
  const { userProfiles, userProfilesLoaded } = useUserProfiles(appId, currentUser);
  const { allCodes, addCode, updateCode, deleteCode } = useCodes(appId, currentUser);
  
  // Custom hooks for UI management
  const { message, showMessage } = useMessageHandler();
  const { initializeWithWelcome } = useNotificationContext();
  const { 
    showMobileNotifications, 
    unreadCount, 
    toggleMobileNotifications, 
    closeMobileNotifications 
  } = useMobileNotifications();
  
  // Highlight management hook
  const {
    currentSelection,
    modalPosition,
    showModal,
    handleTextSelection,
    handleAddHighlight: baseHandleAddHighlight,
    handleDeleteHighlight: baseHandleDeleteHighlight,
    checkCodeUsage,
    deleteHighlightsByCode,
    closeModal,
    isSelectionActive
  } = useHighlightManagement(
    currentUser, 
    activeDocument, 
    activeDocumentId, 
    highlights, 
    addHighlight, 
    deleteHighlight, 
    allCodes
  );

  useUserActivity(appId, currentUser);

  // Initialize notifications when user is available
  useEffect(() => {
    if (currentUser) {
      initializeWithWelcome();
    }
  }, [currentUser, initializeWithWelcome]);

  // Enhanced handlers with message feedback
  const handleAddHighlight = async (code) => {
    const result = await baseHandleAddHighlight(code);
    if (result.success) {
      showMessage('Highlight added!');
    } else {
      showMessage('Failed to add highlight.', true);
    }
    return result;
  };

  const handleDeleteHighlight = async (id) => {
    const result = await baseHandleDeleteHighlight(id);
    if (result.success) {
      showMessage('Highlight deleted.');
    } else {
      showMessage('Failed to delete highlight.', true);
    }
    return result;
  };

  const currentUserProfile = currentUser && userProfiles[currentUser.uid];

  return (
    <div className="flex h-screen">
      {/* Document Browser - Left Panel */}
      <div className="w-80 flex-shrink-0 hidden lg:block">
        <DocumentBrowser
          documents={documents}
          activeDocument={activeDocument}
          onDocumentSwitch={switchActiveDocument}
          onAddDocument={addDocument}
          onMessage={showMessage}
          currentUser={currentUser}
        />
      </div>

      {/* Main Content Area */}
      <main className="flex-1 p-4 md:p-6 lg:p-8 overflow-y-auto">
        <div className="max-w-4xl mx-auto">
          {/* Mobile Document Selector */}
          <MobileDocumentSelector
            documents={documents}
            activeDocument={activeDocument}
            onDocumentSwitch={switchActiveDocument}
          />

          <DocumentHeader activeDocument={activeDocument} />

          {loading && (
            <div id="loading-text" className="text-center p-8">
              <p className="text-gray-500">Connecting to the collaborative session...</p>
            </div>
          )}

          {!loading && documentsLoaded && (
            <HighlightedText
              highlights={highlights}
              userProfiles={userProfiles}
              currentUser={currentUser}
              onTextSelection={handleTextSelection}
              onDeleteHighlight={handleDeleteHighlight}
              allCodes={allCodes}
              activeDocument={activeDocument}
            />
          )}
        </div>
      </main>

      {/* Analysis Tools Sidebar - Right Panel */}
      <div className="w-80 xl:w-96 flex-shrink-0 hidden md:block">
        <Sidebar
          currentUser={currentUser}
          currentUserProfile={currentUserProfile}
          userProfiles={userProfiles}
          userProfilesLoaded={userProfilesLoaded}
          onCodeSelect={handleAddHighlight}
          onMessage={showMessage}
          isSelectionActive={isSelectionActive}
          allCodes={allCodes}
          onAddCode={addCode}
          onUpdateCode={updateCode}
          onDeleteCode={deleteCode}
          onCheckCodeUsage={checkCodeUsage}
          onDeleteHighlightsByCode={deleteHighlightsByCode}
        />
      </div>

      {/* Mobile Components */}
      <MobileCodingPanel
        allCodes={allCodes}
        currentSelection={currentSelection}
        onCodeSelect={handleAddHighlight}
      />

      {/* Modals and Overlays */}
      {showModal && (
        <HighlightingModal
          modalPosition={modalPosition}
          allCodes={allCodes}
          onCodeSelect={handleAddHighlight}
          onClose={closeModal}
        />
      )}

      {needsProfileSetup && currentUser && (
        <UserProfileSetup
          currentUser={currentUser}
          appId={appId}
          completeProfile={completeProfile}
          onComplete={() => {/* Profile completion is handled by the hook */}}
        />
      )}

      {/* Notification Components */}
      <MobileNotificationBell
        unreadCount={unreadCount}
        onClick={toggleMobileNotifications}
      />

      <MobileNotificationPanel
        isVisible={showMobileNotifications}
        onClose={closeMobileNotifications}
      />

      {/* Message System */}
      <MessageBox message={message} />
    </div>
  );
}

export default function CollaborativeText() {
  return (
    <NotificationProvider>
      <CollaborativeTextContent />
    </NotificationProvider>
  );
}
