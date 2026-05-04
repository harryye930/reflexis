import React from 'react';
import UserInfo from '../shared/UserInfo.js';
import CodeManagement from './codes/CodeManagement.js';
import LivingCodebook from './codebook/LivingCodebook.js';

const AnalysisTab = ({ 
  projectId,
  currentUser, 
  currentUserProfile, 
  userProfiles, 
  userProfilesLoaded, 
  onMessage,
  allCodes,
  deletedCodes = [], // New prop for deleted codes
  onAddCode,
  onUpdateCode,
  onDeleteCode,
  onMergeCodes, // New prop for code merging
  onSplitCode, // New prop for code splitting
  onCheckCodeUsage,
  onDeleteHighlightsByCode,
  livingCodebookState,
  onCodeNameClick,
  onBackToAllCodes,
  onUpdateCodeInLivingCodebook,
  onNavigateToHighlight,
  getCodeDisagreement, // New prop for disagreement data
  showCodeDetails // New prop for showing/hiding code details
}) => {
  // If Living Codebook is active, show it instead of the normal view
  if (livingCodebookState.isActive && livingCodebookState.selectedCode) {
    return (
      <div className="code-transition-enter">
        <LivingCodebook 
          projectId={projectId}
          code={livingCodebookState.selectedCode}
          currentUser={currentUser}
          userProfiles={userProfiles}
          onBack={onBackToAllCodes}
          onEditCode={onUpdateCode}
          onDeleteCode={onDeleteCode}
          onMessage={onMessage}
          onCheckCodeUsage={onCheckCodeUsage}
          onDeleteHighlightsByCode={onDeleteHighlightsByCode}
          onUpdateCodeInLivingCodebook={onUpdateCodeInLivingCodebook}
          onNavigateToHighlight={onNavigateToHighlight}
          getCodeDisagreement={getCodeDisagreement}
          showCodeDetails={showCodeDetails}
        />
      </div>
    );
  }

  return (
    <div className="p-6 code-transition-enter">
      <UserInfo 
        currentUser={currentUser}
        currentUserProfile={currentUserProfile}
        userProfilesLoaded={userProfilesLoaded}
      />

      <CodeManagement 
        allCodes={allCodes}
        deletedCodes={deletedCodes}
        currentUser={currentUser}
        userProfiles={userProfiles}
        onAddCode={onAddCode}
        onUpdateCode={onUpdateCode}
        onDeleteCode={onDeleteCode}
        onMergeCodes={onMergeCodes}
        onSplitCode={onSplitCode}
        onMessage={onMessage}
        onCheckCodeUsage={onCheckCodeUsage}
        onDeleteHighlightsByCode={onDeleteHighlightsByCode}
        onCodeNameClick={onCodeNameClick}
        getCodeDisagreement={getCodeDisagreement}
        showCodeDetails={showCodeDetails}
      />
    </div>
  );
};

export default AnalysisTab;
