import React from 'react';
import { getUserDisplayColor, getUserDisplayName, shouldShowAuthorInfo } from '../../lib/utils/hoverUtils.js';
import { hexToRgba } from '../../lib/utils/colorUtils.js';

// Grey color for all highlight backgrounds
const HIGHLIGHT_GREY = '#9ca3af'; // gray-400

// Opacity constants based on total number of codes
const OPACITY = {
  ONE_CODE: 0.3,
  TWO_CODES: 0.5,
  THREE_PLUS_CODES: 0.7
};

const HighlightSegment = ({
  segment,
  userProfiles,
  currentUser,
  showAuthorInfo,
  onHighlightClick,
  onHighlightHover,
  onHighlightLeave
}) => {
  // Helper function to determine background style for a segment
  const getBackgroundStyle = (segment) => {
    const totalCodes = segment.highlights.length;

    // Determine opacity based on total number of codes
    let opacity;
    if (totalCodes === 1) {
      opacity = OPACITY.ONE_CODE;
    } else if (totalCodes === 2) {
      opacity = OPACITY.TWO_CODES;
    } else {
      opacity = OPACITY.THREE_PLUS_CODES;
    }

    // Always use grey background regardless of users
    return {
      backgroundColor: hexToRgba(HIGHLIGHT_GREY, opacity)
    };
  };

  // Early return for segments without highlights
  if (segment.highlights.length === 0) {
    return <span>{segment.text}</span>;
  }

  // Helper function to render coder indicators
  const renderCoderIndicators = (highlights, userProfiles, currentUser, showAuthorInfo) => {
    if (!showAuthorInfo) {
      return null;
    }

    // Get unique user codes (not unique users)
    // Each highlight represents a unique user-code combination
    const userCodeIndicators = highlights.map(highlight => {
      const user = userProfiles[highlight.userId];
      const userColor = getUserDisplayColor(user, true); // Always get individual colors for indicators
      const userName = getUserDisplayName(user, true, currentUser, highlight.userId);
      
      return {
        userId: highlight.userId,
        highlightId: highlight.id, // Use highlight ID to ensure uniqueness
        color: userColor,
        name: userName
      };
    });

    // For single user code, show just colored dot and name
    if (userCodeIndicators.length === 1) {
      const indicator = userCodeIndicators[0];
      return (
        <div 
          className="absolute -top-2 -right-2 flex items-center gap-1 text-xs bg-white rounded-full px-2 py-1 shadow-sm border border-gray-200 transition-opacity duration-200 group-hover:opacity-30"
          style={{ 
            userSelect: 'none',
            pointerEvents: 'none',
            zIndex: 10,
            WebkitUserSelect: 'none',
            MozUserSelect: 'none',
            msUserSelect: 'none'
          }}
          unselectable="on"
        >
          <div
            className="w-2 h-2 rounded-full flex-shrink-0"
            style={{ backgroundColor: indicator.color }}
          />
          <span className="text-gray-700 font-medium whitespace-nowrap max-w-20 truncate">
            {indicator.name}
          </span>
        </div>
      );
    }

    // For multiple user codes, show stacked dots with count
    return (
      <div className="absolute -top-2 -right-2 transition-opacity duration-200 group-hover:opacity-30" style={{ zIndex: 10 }}>
        <div 
          className="flex items-center gap-1 text-xs bg-white rounded-full px-2 py-1 shadow-sm border border-gray-200"
          style={{ 
            userSelect: 'none',
            pointerEvents: 'none',
            WebkitUserSelect: 'none',
            MozUserSelect: 'none',
            msUserSelect: 'none'
          }}
          unselectable="on"
        >
          {/* Show dots for first 3 user codes */}
          <div className="flex items-center -space-x-1">
            {userCodeIndicators.slice(0, 3).map((indicator) => (
              <div
                key={indicator.highlightId}
                className="w-2 h-2 rounded-full border border-white"
                style={{ backgroundColor: indicator.color }}
              />
            ))}
            {userCodeIndicators.length > 3 && (
              <span className="text-gray-600 font-bold ml-1">+{userCodeIndicators.length - 3}</span>
            )}
          </div>
        </div>
      </div>
    );
  };

  // Get background style using helper function
  const backgroundStyle = getBackgroundStyle(segment);
  
  // Determine if current user owns any of these highlights
  const isOwner = segment.highlights.some(h => currentUser && h.userId === currentUser.uid);
  
  // Determine CSS classes
  const highlightClasses = [
    'highlight',
    segment.highlights.length > 1 ? 'multiple-highlights' : '',
    isOwner ? 'owned-highlight' : '',
    'highlight-segment'
  ].filter(Boolean).join(' ');

  // Determine outline style
  const outlineStyle = segment.highlights.length > 1 ? '1px dotted rgba(0,0,0,0.2)' : 'none';

  return (
    <mark
      className={`${highlightClasses} group`}
      style={{
        ...backgroundStyle,
        position: 'relative',
        borderRadius: '2px',
        padding: '1px 2px',
        margin: '0 -1px',
        cursor: 'pointer',
        border: 'none',
        outline: outlineStyle
      }}
      data-highlight-ids={segment.highlights.map(h => h.id).join(',')}
      onClick={(e) => onHighlightClick(e, segment.highlights)}
      onMouseEnter={(e) => onHighlightHover(e, segment.highlights)}
      onMouseLeave={onHighlightLeave}
    >
      {/* Coder indicators - only show when showAuthorInfo is true */}
      {renderCoderIndicators(segment.highlights, userProfiles, currentUser, showAuthorInfo)}
      {segment.text}
    </mark>
  );
};

export default HighlightSegment; 