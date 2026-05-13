import React, { useState } from 'react';
import { HighlightAlt, Sell } from '@mui/icons-material';
import { getUserDisplayColor, getUserDisplayName, shouldShowAuthorInfo } from '../../../lib/utils/hoverUtils';
import ResearchBackgroundDisplay from '../../common/ResearchBackgroundDisplay.js';

const CollaboratorLegend = ({
  userProfiles,
  currentUser,
  showAuthorInfo = true,
  disableLlm = false,
  hiddenUserIds = [],
  onToggleHiddenUser,
  hiddenCodeOwnerIds = [],
  onToggleHiddenCodeOwner
}) => {
  const [hoveredUser, setHoveredUser] = useState(null);

  // Don't show the legend if showAuthorInfo is false
  if (!shouldShowAuthorInfo(showAuthorInfo)) {
    return null;
  }

  const hiddenSet = new Set(hiddenUserIds);
  const hiddenCodeOwnerSet = new Set(hiddenCodeOwnerIds);

  return (
    <div>
      <h3 className="font-semibold text-gray-700 mb-3">Collaborators</h3>
      <div id="legend-container" className="space-y-2">
        {Object.entries(userProfiles).map(([userId, profile]) => {
          const userColor = getUserDisplayColor(profile, showAuthorInfo);
          const userName = getUserDisplayName(profile, showAuthorInfo, currentUser, userId);
          const isCurrentUser = currentUser && userId === currentUser.uid;
          const isHidden = hiddenSet.has(userId);
          const areCodesHidden = hiddenCodeOwnerSet.has(userId);

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
                <div className="flex flex-shrink-0 items-center gap-1">
                  {onToggleHiddenUser && (
                    <button
                      type="button"
                      onClick={() => onToggleHiddenUser(userId)}
                      className={`p-1 rounded focus:outline-none focus:ring-1 ${
                        isHidden
                          ? 'bg-gray-100 text-gray-300 hover:text-gray-500 focus:ring-gray-300'
                          : 'bg-blue-50 text-blue-700 hover:bg-blue-100 hover:text-blue-800 focus:ring-blue-300'
                      }`}
                      title={isHidden ? `Show ${userName || 'this collaborator'}'s corpus highlights` : `Hide ${userName || 'this collaborator'}'s corpus highlights`}
                      aria-label={isHidden ? 'Show corpus highlights' : 'Hide corpus highlights'}
                      aria-pressed={isHidden}
                    >
                      <HighlightAlt fontSize="small" />
                    </button>
                  )}
                  {onToggleHiddenCodeOwner && (
                    <button
                      type="button"
                      onClick={() => onToggleHiddenCodeOwner(userId)}
                      className={`p-1 rounded focus:outline-none focus:ring-1 ${
                        areCodesHidden
                          ? 'bg-gray-100 text-gray-300 hover:text-gray-500 focus:ring-gray-300'
                          : 'bg-blue-50 text-blue-700 hover:bg-blue-100 hover:text-blue-800 focus:ring-blue-300'
                      }`}
                      title={areCodesHidden ? `Show ${userName || 'this collaborator'}'s qualitative codes` : `Hide ${userName || 'this collaborator'}'s qualitative codes`}
                      aria-label={areCodesHidden ? 'Show qualitative codes' : 'Hide qualitative codes'}
                      aria-pressed={areCodesHidden}
                    >
                      <Sell fontSize="small" />
                    </button>
                  )}
                </div>
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
