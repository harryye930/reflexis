import React, { useState } from 'react';
import { getUserDisplayColor, getUserDisplayName, shouldShowAuthorInfo } from '../../../lib/utils/hoverUtils';
import ResearchBackgroundDisplay from '../../common/ResearchBackgroundDisplay.js';

const CollaboratorLegend = ({ userProfiles, currentUser, showAuthorInfo = true }) => {
  const [hoveredUser, setHoveredUser] = useState(null);

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
          const isCurrentUser = currentUser && userId === currentUser.uid;
          
          // Don't show tooltip for current user or if no research background
          const shouldShowTooltip = !isCurrentUser && (profile.researchBackground || profile.reducedResearchBackground);
          
          return (
            <div key={userId} className="relative">
              <div 
                className={`flex items-center ${shouldShowTooltip ? 'cursor-help' : ''}`}
                onMouseEnter={() => shouldShowTooltip && setHoveredUser(userId)}
                onMouseLeave={() => setHoveredUser(null)}
              >
                <span className="w-4 h-4 rounded-full mr-2" style={{ backgroundColor: userColor }}></span>
                <span className="text-sm text-gray-600">
                  {userName || 'Loading...'}
                </span>
              </div>
              
              {/* Tooltip */}
              {hoveredUser === userId && shouldShowTooltip && (
                <div className="absolute left-0 top-full mt-1 z-50 w-72 bg-white border border-gray-200 rounded-lg shadow-lg p-3">
                  <div className="text-xs font-medium text-gray-700 mb-2 flex items-center">
                    <span 
                      className="w-3 h-3 rounded-full mr-2" 
                      style={{ backgroundColor: userColor }}
                    ></span>
                    Research Background (simplified)
                  </div>
                  
                  {profile.reducedResearchBackground ? (
                    <div className="text-xs text-gray-600 leading-relaxed">
                      {profile.reducedResearchBackground}
                    </div>
                  ) : profile.researchBackground ? (
                    <ResearchBackgroundDisplay 
                      researchBackground={profile.researchBackground}
                      variant="inline"
                      size="xs"
                      showHeaders={false}
                      userName={profile.name}
                    />
                  ) : (
                    <div className="text-xs text-gray-500 italic">
                      No research background available
                    </div>
                  )}
                </div>
              )}
            </div>
          );
        })}
      </div>
    </div>
  );
};

export default CollaboratorLegend;
