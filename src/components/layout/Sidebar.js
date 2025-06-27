import React from 'react';
import UserInfo from '../collaboration/UserInfo.js';
import CollaboratorLegend from '../collaboration/CollaboratorLegend.js';
import CodeManagement from '../collaboration/codePalette/CodeManagement.js';
import AdminControls from '../collaboration/AdminControls.js';

const Sidebar = ({ 
  currentUser, 
  currentUserProfile, 
  userProfiles, 
  userProfilesLoaded, 
  onCodeSelect, 
  onMessage,
  isSelectionActive,
  // New props for code management
  allCodes,
  onAddCode,
  onUpdateCode,
  onDeleteCode,
  onCheckCodeUsage,
  onDeleteHighlightsByCode
}) => {
  return (
    <aside className="w-full md:w-1/3 lg:w-1/4 bg-white border-l border-gray-200 flex flex-col h-screen">
      <div className="flex-grow overflow-y-auto p-6">
        <h2 className="text-xl font-bold text-gray-900 mb-4">Analysis Tools</h2>

        <UserInfo 
          currentUser={currentUser}
          currentUserProfile={currentUserProfile}
          userProfilesLoaded={userProfilesLoaded}
        />


        <CodeManagement 
          allCodes={allCodes}
          onCodeSelect={onCodeSelect}
          disabled={!isSelectionActive}
          currentUser={currentUser}
          userProfiles={userProfiles}
          onAddCode={onAddCode}
          onUpdateCode={onUpdateCode}
          onDeleteCode={onDeleteCode}
          onMessage={onMessage}
          onCheckCodeUsage={onCheckCodeUsage}
          onDeleteHighlightsByCode={onDeleteHighlightsByCode}
        />

        <CollaboratorLegend 
          userProfiles={userProfiles}
        />
      </div>
      
      <div className="border-t border-gray-200 p-6">
        <AdminControls onMessage={onMessage} />
      </div>
    </aside>
  );
};

export default Sidebar;
