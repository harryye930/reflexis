import React from 'react';
import { getUserDisplayColor, getUserDisplayName, shouldShowAuthorInfo } from '../../lib/utils/hoverUtils';

const CollaboratorLegend = ({ userProfiles, currentUser, showAuthorInfo = true }) => {
  // Don't show the legend if showAuthorInfo is false
  if (!shouldShowAuthorInfo(showAuthorInfo)) {
    return null;
  }

  return (
    <div>
      <h3 className="font-semibold text-gray-700 mb-3">Collaborators</h3>
      <div id="legend-container" className="space-y-2">
        {Object.entries(userProfiles).map(([userId, profile]) => {
          const userColor = getUserDisplayColor(profile, showAuthorInfo);
          const userName = getUserDisplayName(profile, showAuthorInfo, currentUser, userId);
          
          return (
            <div key={userId} className="flex items-center">
              <span className="w-4 h-4 rounded-full mr-2" style={{ backgroundColor: userColor }}></span>
              <span className="text-sm text-gray-600">
                {userName || 'Loading...'}
              </span>
            </div>
          );
        })}
      </div>
    </div>
  );
};

export default CollaboratorLegend;
