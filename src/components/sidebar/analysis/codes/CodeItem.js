import React, { useState } from 'react';
import CodeChip from '../../../common/CodeChip.js';
import DisagreementMetric from '../../../analysis/DisagreementMetric.js';

const CodeItem = ({ 
  code, 
  onEdit, 
  onDelete,
  currentUser,
  userProfiles,
  showDescriptions,
  variant = "selection", // "selection" or "management"
  onCodeNameClick, // New prop for handling code name clicks
  hideEditButtons = false, // New prop to hide edit/delete buttons
  disagreementData = null // New prop for disagreement data
}) => {
  const [isTransitioning, setIsTransitioning] = useState(false);
  const getUserName = (userId) => {
    if (userId === 'system') return 'System';
    if (userId && userProfiles[userId]) {
      const authorName = userProfiles[userId].name;
      const isCurrentUser = currentUser && userId === currentUser.uid;
      return isCurrentUser ? `${authorName} (you)` : authorName;
    }
    return 'Unknown';
  };

  const getAuthorDisplay = (code) => {
    const creator = getUserName(code.createdBy);
    const updater = code.updatedBy ? getUserName(code.updatedBy) : null;
    if (updater && code.updatedBy !== code.createdBy) {
      return `by ${creator}, updated by ${updater}`;
    }
    return `by ${creator}`;
  };

  const handleContainerClick = (e) => {
    // Only handle Living Codebook navigation
    if (onCodeNameClick) {
      setIsTransitioning(true);
      // Add a small delay to show the transition effect
      setTimeout(() => {
        onCodeNameClick(code);
        setIsTransitioning(false);
      }, 100);
    }
  };

  const isManagementMode = variant === "management";
  const containerClass = isManagementMode 
    ? `code-preview flex items-center justify-between p-3 bg-white rounded-lg border border-gray-200 hover:border-gray-300 transition-all cursor-pointer hover:bg-gray-50 ${isTransitioning ? 'code-transition-exit' : ''}`
    : `code-palette-card group relative cursor-pointer ${isTransitioning ? 'code-transition-exit' : ''}`;

  return (
    <div 
      className={containerClass}
      onClick={handleContainerClick}
      title={onCodeNameClick ? "Click to open Living Codebook" : "Code details"}
    >
      {isManagementMode ? (
        // Management mode layout
        <>
          <div className="flex-1">
            <div className="flex items-center gap-2 mb-2">
              <CodeChip 
                code={code}
                size="md"
                variant="simple"
                isTransitioning={isTransitioning}
              />
              {/* Show disagreement metric when info is shown */}
              {showDescriptions && disagreementData && (
                <DisagreementMetric 
                  disagreementData={disagreementData}
                  size="xs"
                  showLabel={true}
                  showPercentage={false}
                  variant="badge"
                />
              )}
            </div>
            <p className="text-xs text-gray-600 leading-relaxed">{code.description}</p>
            {getAuthorDisplay(code) && (
              <p className="text-xs text-gray-500 mt-1">{getAuthorDisplay(code)}</p>
            )}
          </div>
          {currentUser && !hideEditButtons && (
            <div className="flex gap-1 ml-3">
              <button
                onClick={(e) => {
                  e.stopPropagation(); // Prevent triggering the container click
                  onDelete(code);
                }}
                className="text-sm px-3 py-1 text-red-600 hover:bg-red-50 rounded-md transition-colors"
                title="Delete code"
              >
                🗑️ Delete
              </button>
            </div>
          )}
        </>
      ) : (
        // Selection mode layout
        <div
          className={`code-palette-unified w-full text-left p-4 rounded-xl border border-gray-100 ${code.color} ${code.textColor} font-medium transition-all duration-200 code-badge-transition ${isTransitioning ? 'code-connection-pulse' : ''}`}
          data-code={code.id}
          style={{
            position: 'relative',
            overflow: 'hidden'
          }}
        >
          {/* Add shimmer effect overlay when transitioning */}
          {isTransitioning && (
            <div className="absolute inset-0 bg-gradient-to-r from-transparent via-white/30 to-transparent animate-pulse pointer-events-none" />
          )}
          
          <div className="flex items-start justify-between mb-2">
            <div className="flex-1">
              <div className="flex items-center gap-2">
                <span className="font-medium text-sm">
                  {code.label}
                </span>
                {/* Show disagreement status only when info is shown */}
                {showDescriptions && disagreementData && disagreementData.hasMultipleUsers && (
                  <DisagreementMetric 
                    disagreementData={disagreementData}
                    size="xs"
                    showLabel={true}
                    showPercentage={false}
                    variant="badge"
                  />
                )}
                {/* Connection indicator */}
                {onCodeNameClick && (
                  <span className="text-xs text-gray-400">→</span>
                )}
              </div>
              {getAuthorDisplay(code) && (
                <p className="text-xs opacity-60 mt-1">{getAuthorDisplay(code)}</p>
              )}
            </div>
            
            {currentUser && !hideEditButtons && (
              <div className="flex gap-1 ml-3">
                <button
                  onClick={(e) => {
                    e.stopPropagation();
                    onDelete(code);
                  }}
                  className="text-xs px-2 py-1 text-red-600 hover:bg-red-50 rounded-md transition-colors opacity-0 group-hover:opacity-100"
                  title="Delete code"
                  tabIndex={-1}
                >
                  🗑️
                </button>
              </div>
            )}
          </div>
          
          {showDescriptions && (
            <p className="text-xs opacity-80 leading-relaxed">
              {code.description}
            </p>
          )}
        </div>
      )}
    </div>
  );
};

export default CodeItem;
