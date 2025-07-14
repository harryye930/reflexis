import React from 'react';
import UserInfo from '../shared/UserInfo.js';
import CodeManagement from './codes/CodeManagement.js';
import LivingCodebook from './codebook/LivingCodebook.js';

const AnalysisTab = ({ 
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
  onCheckCodeUsage,
  onDeleteHighlightsByCode,
  livingCodebookState,
  onCodeNameClick,
  onBackToAllCodes,
  onUpdateCodeInLivingCodebook,
  onNavigateToHighlight
}) => {
  // If Living Codebook is active, show it instead of the normal view
  if (livingCodebookState.isActive && livingCodebookState.selectedCode) {
    return (
      <div className="code-transition-enter">
        <LivingCodebook 
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
        onMessage={onMessage}
        onCheckCodeUsage={onCheckCodeUsage}
        onDeleteHighlightsByCode={onDeleteHighlightsByCode}
        onCodeNameClick={onCodeNameClick}
      />
    </div>
  );
};

export default AnalysisTab;
