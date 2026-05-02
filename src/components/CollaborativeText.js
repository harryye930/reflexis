import React, { useEffect, useState } from 'react';
import { useDocuments } from '../hooks/useDocuments.js';
import { useHighlights } from '../hooks/useHighlights.js';
import { useUserProfiles } from '../hooks/useUserProfiles.js';
import { useUserActivity } from '../hooks/useUserActivity.js';
import { useCodes } from '../hooks/useCodes.js';
import { useCodeDisagreement } from '../hooks/useCodeDisagreement.js';
import { useHighlightManagement } from '../hooks/useHighlightManagement.js';
import { useMessageHandler } from '../hooks/useMessageHandler.js';
import { useNavigateToHighlight } from '../hooks/useNavigateToHighlight.js';
import { useHoverPreferences } from '../hooks/useHoverPreferences.js';
import { filterUniquelyCodedHighlights } from '../lib/utils/highlightFilterUtils.js';

// Components
import HighlightedText from './highlight/HighlightedText.js';
import HighlightingModal from './highlight/HighlightModal.js';
import ReflexiveModal from './reflexive/ReflexiveModal.js';
import MessageBox from './common/MessageBox.js';
import DocumentBrowser from './document/DocumentBrowser.js';
import Sidebar from './sidebar/Sidebar.js';
import DocumentHeader from './document/DocumentHeader.js';
import CodeDriftModal from './code-drift/CodeDriftModal.js';
import ReflectiveQuoteTicker from './common/ReflectiveQuoteTicker.js';

function CollaborativeTextContent({ currentUser, project, onBackToProjects, onSignOut }) {
  const projectId = project?.id;
  const isOwner = project?.membership?.role === 'owner';
  const loading = !currentUser || !projectId;
  // Custom hooks for data management
  const { documents, activeDocument, activeDocumentId, documentsLoaded, addDocument, updateDocument, deleteDocument, switchActiveDocument } = useDocuments(projectId, currentUser, isOwner);
  const { highlights, addHighlight, deleteHighlight } = useHighlights(projectId, currentUser, activeDocumentId);
  const { userProfiles, userProfilesLoaded } = useUserProfiles(projectId, currentUser);
  const { allCodes, deletedCodes, addCode, updateCode, deleteCode, mergeCodes, splitCode } = useCodes(projectId, currentUser);
  
  // Disagreement analysis hook
  const { 
    codeDisagreementData, 
    getCodeDisagreement, 
    getCodesByDisagreement, 
    getDisagreementSummary, 
    loading: disagreementLoading 
  } = useCodeDisagreement(projectId, allCodes, userProfiles, currentUser);
  
  // Reflexive modal state
  const [showReflexiveModal, setShowReflexiveModal] = useState(false);
  const [reflexiveModalPosition, setReflexiveModalPosition] = useState({ x: 0, y: 0 });
  const [selectedHighlightForReflexive, setSelectedHighlightForReflexive] = useState(null);
  const [selectedCodeForReflexive, setSelectedCodeForReflexive] = useState(null);
  
  // Custom hooks for UI management
  const { message, showMessage } = useMessageHandler();
  
  // Hover preferences
  const { 
    showHoverTooltips, 
    showAuthorInfo, 
    toggleHoverTooltips, 
    toggleAuthorInfo,
    disableHighlightManagement,
    toggleDisableHighlightManagement,
    disableCodeDriftDetection,
    toggleDisableCodeDriftDetection,
    showCodeDetails,
  toggleShowCodeDetails,
  hideSameCodeHighlights,
  toggleHideSameCodeHighlights
  } = useHoverPreferences(projectId);
  
  // Highlight management hook - uses original highlights for management operations
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
    isSelectionActive,
    //conceptual drift related
    isDetecting,
    driftData,
    showDriftModal,
    pendingHighlight,
    handleRefineDefinition,
    handleSplitCode,
    handleApplyAnyway,
    closeDriftModal,
    applyPendingHighlight
  } = useHighlightManagement(
    currentUser, 
    activeDocument, 
    activeDocumentId, 
    highlights,
    addHighlight, 
    deleteHighlight,
    projectId,
    disableCodeDriftDetection // Add disableCodeDriftDetection parameter
  );

  useUserActivity(currentUser);

  // Navigation hook
  const handleNavigateToHighlight = useNavigateToHighlight(
    projectId,
    activeDocumentId,
    highlights,
    switchActiveDocument,
    showMessage
  );

  // Enhanced handlers with message feedback
  const handleAddHighlight = async (code, options = {}) => {
    const result = await baseHandleAddHighlight(code, options);
    if (result.success) {
      showMessage('Highlight added!');
    } else {
      showMessage('Failed to add highlight.', true);
      console.error('Add highlight error:', "code:", code, "selected text:", selectedText, "result:", result);
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

  // Start reflexive flow from coding modal after highlight creation
  const handleStartReflexiveFromCodingModal = ({ highlightId, code, selectedText }) => {
    if (!highlightId || !code) return;
    setSelectedHighlightForReflexive({ id: highlightId, text: selectedText });
    setSelectedCodeForReflexive(code);
    setReflexiveModalPosition({ x: window.innerWidth / 2, y: window.innerHeight / 2 - 200 });
    setShowReflexiveModal(true);
  };

  // Handle reflexive click for existing highlights
  const handleReflexiveClick = (highlight, code) => {
    setSelectedHighlightForReflexive(highlight);
    setSelectedCodeForReflexive(code);
    
    // Position the modal near the center of the viewport
    const modalPosition = {
      x: window.innerWidth / 2,
      y: window.innerHeight / 2 - 200
    };
    setReflexiveModalPosition(modalPosition);
    setShowReflexiveModal(true);
  };

  // Handle reflexive modal completion
  const handleReflexiveComplete = () => {
    setShowReflexiveModal(false);
    setSelectedHighlightForReflexive(null);
    setSelectedCodeForReflexive(null);
    showMessage('Reflexive responses saved successfully');
  };

  // Handle reflexive modal close
  const handleReflexiveClose = () => {
    setShowReflexiveModal(false);
    setSelectedHighlightForReflexive(null);
    setSelectedCodeForReflexive(null);
  };

  const currentUserProfile = currentUser && userProfiles[currentUser.uid];

  // Filter highlights based on uniquely coded text setting
  const filteredHighlights = filterUniquelyCodedHighlights(highlights, hideSameCodeHighlights);

  return (
    <div className="flex h-screen pt-12">
      <header className="fixed top-0 left-0 right-0 h-12 bg-white border-b border-gray-200 z-50 flex items-center px-4 gap-4">
        <div className="flex items-center gap-3 flex-shrink-0">
          <button
            type="button"
            onClick={onBackToProjects}
            className="px-3 py-1.5 text-sm text-gray-700 border border-gray-300 rounded-md hover:bg-gray-50"
          >
            Projects
          </button>
          <div>
            <div className="text-sm font-semibold text-gray-900">{project?.name}</div>
            <div className="text-xs text-gray-500">Collaborative analysis</div>
          </div>
        </div>
        <ReflectiveQuoteTicker seedKey={projectId || ''} />
        <button
          type="button"
          onClick={onSignOut}
          className="px-3 py-1.5 text-sm text-gray-700 border border-gray-300 rounded-md hover:bg-gray-50 flex-shrink-0"
        >
          Sign Out
        </button>
      </header>
      {/* Document Browser - Left Panel */}
      <div className="w-80 flex-shrink-0">
        <DocumentBrowser
          documents={documents}
          activeDocument={activeDocument}
          onDocumentSwitch={switchActiveDocument}
          onAddDocument={addDocument}
          onDeleteDocument={deleteDocument}
          onMessage={showMessage}
          currentUser={currentUser}
          isOwner={isOwner}
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

          {!loading && documentsLoaded && !activeDocument && (
            <div className="text-center p-12 border border-dashed border-slate-300 rounded-lg bg-white">
              <p className="text-slate-700 font-medium">No document selected</p>
              <p className="text-sm text-slate-500 mt-2">
                {isOwner
                  ? 'Add a transcript or other text to the corpus on the left to begin analysis.'
                  : 'Wait for an admin to add a document to this project, or add one yourself.'}
              </p>
            </div>
          )}

          {!loading && documentsLoaded && activeDocument && (
            <HighlightedText
              projectId={projectId}
              highlights={filteredHighlights}
              userProfiles={userProfiles}
              currentUser={currentUser}
              onTextSelection={handleTextSelection}
              onDeleteHighlight={handleDeleteHighlight}
              onReflexiveClick={handleReflexiveClick}
              allCodes={allCodes}
              activeDocument={activeDocument}
              showHoverTooltips={showHoverTooltips}
              showAuthorInfo={showAuthorInfo}
              disableHighlightManagement={disableHighlightManagement}
              showReflexiveModal={showReflexiveModal}
              reflexiveHighlightId={selectedHighlightForReflexive?.id}
            />
          )}
        </div>
      </main>

      {/* Analysis Tools Sidebar - Right Panel */}
      <div className="w-80 xl:w-96 flex-shrink-0">
        <Sidebar
          projectId={projectId}
          currentUser={currentUser}
          currentUserProfile={currentUserProfile}
          userProfiles={userProfiles}
          userProfilesLoaded={userProfilesLoaded}
          onCodeSelect={handleAddHighlight}
          onMessage={showMessage}
          allCodes={allCodes}
          deletedCodes={deletedCodes}
          onAddCode={addCode}
          onUpdateCode={updateCode}
          onDeleteCode={deleteCode}
          onMergeCodes={mergeCodes}
          onSplitCode={splitCode}
          onCheckCodeUsage={checkCodeUsage}
          onDeleteHighlightsByCode={deleteHighlightsByCode}
          showHoverTooltips={showHoverTooltips}
          showAuthorInfo={showAuthorInfo}
          onToggleHoverTooltips={toggleHoverTooltips}
          onToggleAuthorInfo={toggleAuthorInfo}
          disableHighlightManagement={disableHighlightManagement}
          onToggleDisableHighlightManagement={toggleDisableHighlightManagement}
          disableCodeDriftDetection={disableCodeDriftDetection}
          onToggleDisableCodeDriftDetection={toggleDisableCodeDriftDetection}
          showCodeDetails={showCodeDetails}
          onToggleShowCodeDetails={toggleShowCodeDetails}
          hideSameCodeHighlights={hideSameCodeHighlights}
          onToggleHideSameCodeHighlights={toggleHideSameCodeHighlights}
          onNavigateToHighlight={handleNavigateToHighlight}
          getCodeDisagreement={getCodeDisagreement}
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
          projectId={projectId}
          documentId={activeDocumentId}
          onAddCode={addCode}
          isDetecting={isDetecting}
          onStartReflexive={handleStartReflexiveFromCodingModal}
        />
      )}

      {/* Reflexive Modal for existing highlights */}
      {showReflexiveModal && selectedHighlightForReflexive && selectedCodeForReflexive && (
        <ReflexiveModal
          modalPosition={reflexiveModalPosition}
          selectedCode={selectedCodeForReflexive}
          selectedText={selectedHighlightForReflexive.text}
          onComplete={handleReflexiveComplete}
          onClose={handleReflexiveClose}
          currentUser={currentUser}
          projectId={projectId}
          documentId={activeDocumentId}
          highlightId={selectedHighlightForReflexive.id}
        />
      )}

      {/* Conceptual Drift Modal */}
      {showDriftModal && (
        <CodeDriftModal
          isOpen={showDriftModal}
          onClose={closeDriftModal}
          driftData={driftData}
          pendingHighlight={pendingHighlight}
          onRefineDefinition={handleRefineDefinition}
          onSplitCode={handleSplitCode}
          onApplyAnyway={handleApplyAnyway}
          onMessage={showMessage}
          allCodes={allCodes}
          currentUser={currentUser}
          isDetecting={isDetecting}
          onApplyPendingHighlight={applyPendingHighlight}
          onUpdateCode={updateCode}
        />
      )}

      {/* Message System */}
      <MessageBox message={message} />
    </div>
  );
}

export default function CollaborativeText(props) {
  return <CollaborativeTextContent {...props} />;
}
