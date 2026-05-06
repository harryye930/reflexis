import React, { useState } from 'react';
import { Visibility, VisibilityOff } from '@mui/icons-material';
import { getUserDisplayColor, getUserDisplayName, shouldShowAuthorInfo } from '../../../lib/utils/hoverUtils';
import ResearchBackgroundDisplay from '../../common/ResearchBackgroundDisplay.js';

const CollaboratorLegend = ({
  userProfiles,
  currentUser,
  showAuthorInfo = true,
  disableLlm = false,
  hiddenUserIds = [],
  onToggleHiddenUser
}) => {
  const [hoveredUser, setHoveredUser] = useState(null);

  // Don't show the legend if showAuthorInfo is false
  if (!shouldShowAuthorInfo(showAuthorInfo)) {
    return null;
  }

  const hiddenSet = new Set(hiddenUserIds);

  return (
    <div>
      <h3 className="font-semibold text-gray-700 mb-3">Collaborators</h3>
      <div id="legend-container" className="space-y-2">
        {Object.entries(userProfiles).map(([userId, profile]) => {
          const userColor = getUserDisplayColor(profile, showAuthorInfo);
          const userName = getUserDisplayName(profile, showAuthorInfo, currentUser, userId);
          const isCurrentUser = currentUser && userId === currentUser.uid;
          const isHidden = hiddenSet.has(userId);

          // Don't show tooltip for current user or if no research background
          const shouldShowTooltip = !isCurrentUser && (profile.researchBackground || profile.reducedResearchBackground);

          return (
            <div key={userId} className="relative">
              <div className="flex items-center justify-between gap-2">
                <div
                  className={`flex items-center min-w-0 flex-1 ${shouldShowTooltip ? 'cursor-help' : ''}`}
                  onMouseEnter={() => shouldShowTooltip && setHoveredUser(userId)}
                  onMouseLeave={() => setHoveredUser(null)}
                >
                  <span
                    className="w-4 h-4 rounded-full mr-2 flex-shrink-0"
                    style={{ backgroundColor: userColor, opacity: isHidden ? 0.35 : 1 }}
                  ></span>
                  <span className={`text-sm truncate ${isHidden ? 'text-gray-400 line-through' : 'text-gray-600'}`}>
                    {userName || 'Loading...'}
                  </span>
                </div>
                {onToggleHiddenUser && (
                  <button
                    type="button"
                    onClick={() => onToggleHiddenUser(userId)}
                    className="p-1 text-gray-400 hover:text-gray-700 focus:outline-none focus:ring-1 focus:ring-gray-300 rounded"
                    title={isHidden ? `Show ${userName || 'this collaborator'}'s highlights` : `Hide ${userName || 'this collaborator'}'s highlights`}
                    aria-label={isHidden ? 'Show highlights' : 'Hide highlights'}
                    aria-pressed={isHidden}
                  >
                    {isHidden
                      ? <VisibilityOff fontSize="small" />
                      : <Visibility fontSize="small" />}
                  </button>
                )}
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
                      disableLlm={disableLlm}
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
