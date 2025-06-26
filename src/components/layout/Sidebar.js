import React from 'react';
import UserInfo from '../collaboration/UserInfo.js';
import CodePalette from '../collaboration/CodePalette.js';
import CollaboratorLegend from '../collaboration/CollaboratorLegend.js';
import AdminControls from '../collaboration/AdminControls.js';

const Sidebar = ({ 
  currentUser, 
  currentUserProfile, 
  userProfiles, 
  userProfilesLoaded, 
  onCodeSelect, 
  onMessage,
  isSelectionActive 
}) => {
  return (
    <aside className="w-full md:w-1/3 lg:w-1/4 bg-white border-l border-gray-200 p-6 flex flex-col">
      <div className="flex-grow">
        <h2 className="text-xl font-bold text-gray-900 mb-4">Analysis Tools</h2>

        <UserInfo 
          currentUser={currentUser}
          currentUserProfile={currentUserProfile}
          userProfilesLoaded={userProfilesLoaded}
        />

        <CodePalette 
          onCodeSelect={onCodeSelect}
          disabled={!isSelectionActive}
        />

        <CollaboratorLegend userProfiles={userProfiles} />
      </div>
      
      <AdminControls onMessage={onMessage} />
    </aside>
  );
};

export default Sidebar;
