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
  onAddCode,
  onUpdateCode,
  onDeleteCode,
  onCheckCodeUsage,
  onDeleteHighlightsByCode,
  livingCodebookState,
  onCodeNameClick,
  onBackToAllCodes
}) => {
  // If Living Codebook is active, show it instead of the normal view
  if (livingCodebookState.isActive && livingCodebookState.selectedCode) {
    return (
      <LivingCodebook 
        code={livingCodebookState.selectedCode}
        currentUser={currentUser}
        userProfiles={userProfiles}
        onBack={onBackToAllCodes}
        onEditCode={(code) => {
          // Switch back to code management and start editing
          onBackToAllCodes();
          // This will need to be passed down to trigger the edit form
          onUpdateCode && onUpdateCode(code.docId || code.id, code);
        }}
      />
    );
  }

  return (
    <div className="p-6">
      <UserInfo 
        currentUser={currentUser}
        currentUserProfile={currentUserProfile}
        userProfilesLoaded={userProfilesLoaded}
      />

      <CodeManagement 
        allCodes={allCodes}
        currentUser={currentUser}
        userProfiles={userProfiles}
        onAddCode={onAddCode}
        onUpdateCode={onUpdateCode}
        onDeleteCode={onDeleteCode}
        onMessage={onMessage}
        onCheckCodeUsage={onCheckCodeUsage}
        onDeleteHighlightsByCode={onDeleteHighlightsByCode}
        onCodeNameClick={onCodeNameClick}
      />
    </div>
  );
};

export default AnalysisTab;
