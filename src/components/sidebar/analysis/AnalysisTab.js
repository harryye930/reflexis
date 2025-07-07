import React from 'react';
import UserInfo from '../shared/UserInfo.js';
import CodeManagement from './codes/CodeManagement.js';

const AnalysisTab = ({ 
  currentUser, 
  currentUserProfile, 
  userProfiles, 
  userProfilesLoaded, 
  onCodeSelect, 
  onMessage,
  allCodes,
  onAddCode,
  onUpdateCode,
  onDeleteCode,
  onCheckCodeUsage,
  onDeleteHighlightsByCode
}) => {
  return (
    <div className="p-6">
      <UserInfo 
        currentUser={currentUser}
        currentUserProfile={currentUserProfile}
        userProfilesLoaded={userProfilesLoaded}
      />

      <CodeManagement 
        allCodes={allCodes}
        onCodeSelect={onCodeSelect}
        disabled={false}
        currentUser={currentUser}
        userProfiles={userProfiles}
        onAddCode={onAddCode}
        onUpdateCode={onUpdateCode}
        onDeleteCode={onDeleteCode}
        onMessage={onMessage}
        onCheckCodeUsage={onCheckCodeUsage}
        onDeleteHighlightsByCode={onDeleteHighlightsByCode}
      />
    </div>
  );
};

export default AnalysisTab;
