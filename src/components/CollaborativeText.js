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
import { NotificationProvider, useNotificationContext } from '../contexts/NotificationContext.js';
import { useHoverPreferences } from '../hooks/useHoverPreferences.js';
import { ReflexiveService } from '../services/api/firebase/reflexiveService.js';

// Components
import HighlightedText from './highlight/HighlightedText.js';
import HighlightingModal from './highlight/HighlightModal.js';
import MessageBox from './MessageBox.js';
import UserProfileSetup from './UserProfileSetup.js';
import DocumentBrowser from './document/DocumentBrowser.js';
import Sidebar from './sidebar/Sidebar.js';
import DocumentHeader from './document/DocumentHeader.js';

function CollaborativeTextContent() {
  // Custom hooks for data management
  const { currentUser, loading, needsProfileSetup, completeProfile } = useAuth(appId);
  const { documents, activeDocument, activeDocumentId, documentsLoaded, addDocument, updateDocument, deleteDocument, switchActiveDocument } = useDocuments(appId, currentUser);
  const { highlights, addHighlight, deleteHighlight } = useHighlights(appId, currentUser, activeDocumentId);
  const { userProfiles, userProfilesLoaded } = useUserProfiles(appId, currentUser);
  const { allCodes, addCode, updateCode, deleteCode } = useCodes(appId, currentUser);
  
  // Services
  const reflexiveService = new ReflexiveService(appId);
  
  // Custom hooks for UI management
  const { message, showMessage } = useMessageHandler();
  const { initializeWithWelcome } = useNotificationContext();
  
  // Hover preferences
  const { 
    showHoverTooltips, 
    showAuthorInfo, 
    toggleHoverTooltips, 
    toggleAuthorInfo,
    disableHighlightManagement,
    toggleDisableHighlightManagement
  } = useHoverPreferences(appId);
  
  // Highlight management hook
  const {
    currentSelection,
    modalPosition,
    showModal,
    selectedText,
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
    deleteHighlight
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
      <div className="w-80 flex-shrink-0">
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
      <main className="flex-1 p-8 overflow-y-auto">
        <div className="max-w-4xl mx-auto">
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
              showHoverTooltips={showHoverTooltips}
              showAuthorInfo={showAuthorInfo}
              disableHighlightManagement={disableHighlightManagement}
            />
          )}
        </div>
      </main>

      {/* Analysis Tools Sidebar - Right Panel */}
      <div className="w-80 xl:w-96 flex-shrink-0">
        <Sidebar
          currentUser={currentUser}
          currentUserProfile={currentUserProfile}
          userProfiles={userProfiles}
          userProfilesLoaded={userProfilesLoaded}
          onCodeSelect={handleAddHighlight}
          onMessage={showMessage}
          allCodes={allCodes}
          onAddCode={addCode}
          onUpdateCode={updateCode}
          onDeleteCode={deleteCode}
          onCheckCodeUsage={checkCodeUsage}
          onDeleteHighlightsByCode={deleteHighlightsByCode}
          showHoverTooltips={showHoverTooltips}
          showAuthorInfo={showAuthorInfo}
          onToggleHoverTooltips={toggleHoverTooltips}
          onToggleAuthorInfo={toggleAuthorInfo}
          disableHighlightManagement={disableHighlightManagement}
          onToggleDisableHighlightManagement={toggleDisableHighlightManagement}
        />
      </div>

      {/* Modals and Overlays */}
      {showModal && (
        <HighlightingModal
          modalPosition={modalPosition}
          allCodes={allCodes}
          onCodeSelect={handleAddHighlight}
          onClose={closeModal}
          selectedText={selectedText}
          currentUser={currentUser}
          documentId={activeDocumentId}
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
