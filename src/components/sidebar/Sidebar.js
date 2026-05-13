import React, { useState, useEffect } from 'react';
import SlidingTabControl from './shared/SlidingTabControl.js';
import AnalysisTab from './analysis/AnalysisTab.js';
import AdminTab from './admin/AdminTab.js';

const Sidebar = ({ 
  projectId,
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
  disableCodeDriftDetection,
  onToggleDisableCodeDriftDetection,
  disableLlm,
  onToggleDisableLlm,
  showCodeDetails,
  onToggleShowCodeDetails,
  hideSameCodeHighlights,
  onToggleHideSameCodeHighlights,
  hiddenCodeOwnerIds,
  onToggleHiddenCodeOwner,
  hiddenUserIds,
  onToggleHiddenUser,
  // Navigation props
  onNavigateToHighlight,
  onOpenProjectHistory,
  // Disagreement analysis props
  getCodeDisagreement,
  activeTab: controlledActiveTab,
  onActiveTabChange,
  profileEditRequestId
}) => {
  const [internalActiveTab, setInternalActiveTab] = useState('analysis');
  const activeTab = controlledActiveTab || internalActiveTab;
  const setActiveTab = onActiveTabChange || setInternalActiveTab;
  const [livingCodebookState, setLivingCodebookState] = useState({
    isActive: false,
    selectedCode: null
  });

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
            projectId={projectId}
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
            onOpenProjectHistory={onOpenProjectHistory}
            getCodeDisagreement={getCodeDisagreement}
            showCodeDetails={showCodeDetails}
            hiddenCodeOwnerIds={hiddenCodeOwnerIds}
            disableLlm={disableLlm}
          />
        );

      case 'admin':
        return (
          <AdminTab
            projectId={projectId}
            userProfiles={userProfiles}
            currentUser={currentUser}
            showAuthorInfo={showAuthorInfo}
            onMessage={onMessage}
            showHoverTooltips={showHoverTooltips}
            onToggleHoverTooltips={onToggleHoverTooltips}
            onToggleAuthorInfo={onToggleAuthorInfo}
            disableHighlightManagement={disableHighlightManagement}
            onToggleDisableHighlightManagement={onToggleDisableHighlightManagement}
            disableCodeDriftDetection={disableCodeDriftDetection}
            onToggleDisableCodeDriftDetection={onToggleDisableCodeDriftDetection}
            disableLlm={disableLlm}
            onToggleDisableLlm={onToggleDisableLlm}
            showCodeDetails={showCodeDetails}
            onToggleShowCodeDetails={onToggleShowCodeDetails}
            hideSameCodeHighlights={hideSameCodeHighlights}
            onToggleHideSameCodeHighlights={onToggleHideSameCodeHighlights}
            hiddenCodeOwnerIds={hiddenCodeOwnerIds}
            onToggleHiddenCodeOwner={onToggleHiddenCodeOwner}
            hiddenUserIds={hiddenUserIds}
            onToggleHiddenUser={onToggleHiddenUser}
            profileEditRequestId={profileEditRequestId}
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
