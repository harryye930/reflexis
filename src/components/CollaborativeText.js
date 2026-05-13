import React, { useEffect, useMemo, useState } from 'react';
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
import { filterUniquelyCodedHighlights, filterHighlightsByHiddenUsers } from '../lib/utils/highlightFilterUtils.js';
import { parseResearchBackgroundFromStorage } from '../constants/researchBackground.js';
import { ProjectService } from '../services/api/firebase/projectService.js';

// Components
import HighlightedText from './highlight/HighlightedText.js';
import HighlightingModal from './highlight/HighlightModal.js';
import ReflexiveModal from './reflexive/ReflexiveModal.js';
import MessageBox from './common/MessageBox.js';
import DocumentBrowser from './document/DocumentBrowser.js';
import Sidebar from './sidebar/Sidebar.js';
import DocumentHeader from './document/DocumentHeader.js';
import CodeDriftModal from './code-drift/CodeDriftModal.js';
import ProjectCodeHistoryGraph from './project/ProjectCodeHistoryGraph.js';
import ProjectWorkspaceHeader from './project/ProjectWorkspaceHeader.js';

const ACTIVE_COLLABORATOR_WINDOW_MS = 90 * 1000;
const ACTIVE_COLLABORATOR_REFRESH_MS = 30 * 1000;

const getTimestampMillis = (value) => {
  if (!value) return 0;
  if (typeof value.toMillis === 'function') return value.toMillis();
  if (typeof value.toDate === 'function') return value.toDate().getTime();
  if (value instanceof Date) return value.getTime();
  if (typeof value === 'number') return value;
  if (typeof value === 'string') return Date.parse(value) || 0;
  if (typeof value.seconds === 'number') return value.seconds * 1000;
  return 0;
};

const getProfileInitial = (name) => {
  const trimmedName = (name || '').trim();
  return trimmedName ? trimmedName.charAt(0).toUpperCase() : '?';
};

const getProjectInitialDataView = (profile) => {
  if (!profile) return '';

  if (typeof profile.initialDataView === 'string' && profile.initialDataView.trim()) {
    return profile.initialDataView.trim();
  }

  return parseResearchBackgroundFromStorage(profile.researchBackground || '').initialDataView.trim();
};

const InitialDataViewReminder = ({ onUpdateView, onDismiss, dismissing }) => (
  <div className="mb-5 rounded-md border border-slate-200 bg-slate-50 px-4 py-3">
    <div className="flex flex-col gap-3 sm:flex-row sm:items-start sm:justify-between">
      <div>
        <p className="text-sm font-medium text-slate-800">Add your view on the data when you&rsquo;re ready.</p>
        <p className="mt-1 text-sm leading-6 text-slate-600">
          After you&rsquo;ve had some time with this project&rsquo;s documents, note what you&rsquo;re noticing.
          This stays with this project, so it can be different from your other work/projects.
        </p>
      </div>
      <div className="flex flex-shrink-0 items-center gap-2">
        <button
          type="button"
          onClick={onDismiss}
          disabled={dismissing}
          className="px-3 py-1.5 text-xs font-medium text-slate-600 hover:text-slate-800 disabled:opacity-50"
        >
          Later
        </button>
        <button
          type="button"
          onClick={onUpdateView}
          className="rounded-md border border-slate-300 bg-white px-3 py-1.5 text-xs font-medium text-slate-700 hover:bg-slate-100"
        >
          Update view
        </button>
      </div>
    </div>
  </div>
);

function CollaborativeTextContent({ currentUser, project, onBackToProjects, onSignOut }) {
  const projectId = project?.id;
  const isOwner = project?.membership?.role === 'owner';
  const loading = !currentUser || !projectId;
  const projectService = useMemo(() => new ProjectService(), []);
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
  const [sidebarActiveTab, setSidebarActiveTab] = useState('analysis');
  const [profileEditRequestId, setProfileEditRequestId] = useState(0);
  const [reminderHiddenForSession, setReminderHiddenForSession] = useState(false);
  const [dismissingInitialViewReminder, setDismissingInitialViewReminder] = useState(false);
  const [activeCollaboratorNow, setActiveCollaboratorNow] = useState(() => Date.now());
  const [showProjectHistoryGraph, setShowProjectHistoryGraph] = useState(false);
  
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
    disableLlm,
    toggleDisableLlm,
    showCodeDetails,
  toggleShowCodeDetails,
  hideSameCodeHighlights,
  toggleHideSameCodeHighlights,
  hiddenCodeOwnerIds,
  toggleHiddenCodeOwner,
  hiddenUserIds,
  toggleHiddenUser
  } = useHoverPreferences(projectId, currentUser);
  
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
    disableCodeDriftDetection || disableLlm // Add disableCodeDriftDetection parameter
  );

  useUserActivity(currentUser, projectId);

  useEffect(() => {
    setActiveCollaboratorNow(Date.now());
    const interval = setInterval(() => {
      setActiveCollaboratorNow(Date.now());
    }, ACTIVE_COLLABORATOR_REFRESH_MS);

    return () => clearInterval(interval);
  }, [projectId]);

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
  const activeCollaborators = useMemo(() => {
    return Object.entries(userProfiles).filter(([userId, profile]) => {
      if (currentUser?.uid === userId) return true;

      const lastSeenMillis = getTimestampMillis(profile.lastSeen);
      return lastSeenMillis && activeCollaboratorNow - lastSeenMillis <= ACTIVE_COLLABORATOR_WINDOW_MS;
    }).map(([userId, profile]) => ({
      userId,
      name: profile.name || 'Collaborator',
      color: profile.color || '#64748b',
      initial: getProfileInitial(profile.name)
    }));
  }, [activeCollaboratorNow, currentUser?.uid, userProfiles]);

  const currentInitialDataView = getProjectInitialDataView(currentUserProfile);
  const shouldShowInitialDataViewReminder = Boolean(
    currentUserProfile
    && !currentInitialDataView
    && !currentUserProfile.initialDataViewReminderDismissedAt
    && !reminderHiddenForSession
  );

  // Filter highlights: drop hidden authors first, then optionally drop uniquely-coded ones
  const visibleByAuthor = filterHighlightsByHiddenUsers(highlights, hiddenUserIds);
  const filteredHighlights = filterUniquelyCodedHighlights(visibleByAuthor, hideSameCodeHighlights);

  // Codes available to apply from the code selection modal honor hidden code authors.
  const hiddenCodeOwnerSet = new Set(hiddenCodeOwnerIds);
  const selectableCodes = hiddenCodeOwnerSet.size > 0
    ? (allCodes || []).filter(code => !hiddenCodeOwnerSet.has(code.createdBy))
    : allCodes;

  useEffect(() => {
    setSidebarActiveTab('analysis');
    setProfileEditRequestId(0);
    setReminderHiddenForSession(false);
    setDismissingInitialViewReminder(false);
    setShowProjectHistoryGraph(false);
  }, [projectId]);

  if (showProjectHistoryGraph) {
    return (
      <ProjectCodeHistoryGraph
        projectId={projectId}
        projectName={project?.name || 'Project'}
        activeCollaborators={activeCollaborators}
        onBack={() => setShowProjectHistoryGraph(false)}
        onSignOut={onSignOut}
      />
    );
  }

  const handleOpenProjectProfile = () => {
    setSidebarActiveTab('admin');
    setProfileEditRequestId(Date.now());
    setReminderHiddenForSession(true);
  };

  const handleDismissInitialDataViewReminder = async () => {
    if (!projectId || !currentUser?.uid) return;

    setDismissingInitialViewReminder(true);
    const result = await projectService.dismissInitialDataViewReminder(projectId, currentUser.uid);
    setDismissingInitialViewReminder(false);

    if (result.success) {
      setReminderHiddenForSession(true);
    } else {
      showMessage('Could not save that reminder preference.', true);
    }
  };

  return (
    <div className="flex h-screen pt-12">
      <ProjectWorkspaceHeader
        projectId={projectId}
        projectName={project?.name || 'Project'}
        subtitle="Collaborative analysis"
        leftButtonLabel="Projects"
        onLeftButtonClick={onBackToProjects}
        activeCollaborators={activeCollaborators}
        onSignOut={onSignOut}
      />
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

          {shouldShowInitialDataViewReminder && (
            <InitialDataViewReminder
              onUpdateView={handleOpenProjectProfile}
              onDismiss={handleDismissInitialDataViewReminder}
              dismissing={dismissingInitialViewReminder}
            />
          )}

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
              disableLlm={disableLlm}
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
          disableLlm={disableLlm}
          onToggleDisableLlm={toggleDisableLlm}
          showCodeDetails={showCodeDetails}
          onToggleShowCodeDetails={toggleShowCodeDetails}
          hideSameCodeHighlights={hideSameCodeHighlights}
          onToggleHideSameCodeHighlights={toggleHideSameCodeHighlights}
          hiddenCodeOwnerIds={hiddenCodeOwnerIds}
          onToggleHiddenCodeOwner={toggleHiddenCodeOwner}
          hiddenUserIds={hiddenUserIds}
          onToggleHiddenUser={toggleHiddenUser}
          onNavigateToHighlight={handleNavigateToHighlight}
          onOpenProjectHistory={() => setShowProjectHistoryGraph(true)}
          getCodeDisagreement={getCodeDisagreement}
          activeTab={sidebarActiveTab}
          onActiveTabChange={setSidebarActiveTab}
          profileEditRequestId={profileEditRequestId}
        />
      </div>

      {/* Modals and Overlays */}
    {showModal && (
        <HighlightingModal
          modalPosition={modalPosition}
          allCodes={selectableCodes}
          onCodeSelect={handleAddHighlight}
          onClose={closeModal}
          selectedText={selectedText}
          currentUser={currentUser}
          projectId={projectId}
          documentId={activeDocumentId}
          onAddCode={addCode}
          isDetecting={isDetecting}
          hiddenCodeOwnerIds={hiddenCodeOwnerIds}
          userProfiles={userProfiles}
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
