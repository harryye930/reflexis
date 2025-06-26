import React from 'react';

const UserInfo = ({ currentUser, currentUserProfile, userProfilesLoaded }) => {
  if (currentUser && !currentUserProfile && !userProfilesLoaded) {
    return (
      <div id="user-info-loading" className="mb-6 p-4 rounded-lg bg-gray-100 text-center">
        <p className="text-sm text-gray-600">Initializing user...</p>
      </div>
    );
  }

  if (currentUser && !currentUserProfile && userProfilesLoaded) {
    return (
      <div id="user-info-error" className="mb-6 p-4 rounded-lg bg-red-100 text-center">
        <p className="text-sm text-red-600">User profile not found. Please refresh the page.</p>
      </div>
    );
  }

  if (!currentUserProfile) return null;

  return (
    <div 
      id="user-info" 
      className="mb-6 p-4 rounded-lg"
      style={{ backgroundColor: currentUserProfile.color }}
    >
      <h3 className="font-bold text-white text-sm mb-1">Your Session:</h3>
      <p id="user-id-display" className="text-xs text-white break-all">
        {currentUserProfile.name} (Active)
      </p>
    </div>
  );
};

export default UserInfo;
