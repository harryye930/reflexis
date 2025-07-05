import React from 'react';
import { getUserDisplayColor } from '../../lib/utils/hoverUtils.js';
import { hexToRgba } from '../../lib/utils/colorUtils.js';

// Opacity constants based on total number of codes
const OPACITY = {
  ONE_CODE: 0.4,
  TWO_CODES: 0.6,
  THREE_PLUS_CODES: 0.8
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
  const getBackgroundStyle = (segment, userProfiles, showAuthorInfo) => {
    const totalCodes = segment.highlights.length;
    const uniqueUsers = [...new Set(segment.highlights.map(h => h.userId))];
    const userColors = uniqueUsers.map(userId => {
      const user = userProfiles[userId];
      return getUserDisplayColor(user, showAuthorInfo);
    });

    // Determine opacity based on total number of codes
    let opacity;
    if (totalCodes === 1) {
      opacity = OPACITY.ONE_CODE;
    } else if (totalCodes === 2) {
      opacity = OPACITY.TWO_CODES;
    } else {
      opacity = OPACITY.THREE_PLUS_CODES;
    }

    // Single highlight
    if (totalCodes === 1) {
      const user = userProfiles[segment.highlights[0].userId];
      const userColor = getUserDisplayColor(user, showAuthorInfo);
      return {
        backgroundColor: hexToRgba(userColor, opacity)
      };
    }

    // Multiple highlights - create gradient patterns based on unique users
    if (userColors.length === 1) {
      // Same user, multiple codes
      return {
        backgroundColor: hexToRgba(userColors[0], opacity)
      };
    } else if (userColors.length === 2) {
      // Two different users
      return {
        background: `linear-gradient(45deg, 
          ${hexToRgba(userColors[0], opacity)} 50%, 
          ${hexToRgba(userColors[1], opacity)} 50%)`
      };
    } else if (userColors.length === 3) {
      // Three different users
      return {
        background: `linear-gradient(45deg, 
          ${hexToRgba(userColors[0], opacity)} 0%, 
          ${hexToRgba(userColors[0], opacity)} 33%, 
          ${hexToRgba(userColors[1], opacity)} 33%, 
          ${hexToRgba(userColors[1], opacity)} 67%, 
          ${hexToRgba(userColors[2], opacity)} 67%, 
          ${hexToRgba(userColors[2], opacity)} 100%)`
      };
    } else {
      // Four or more different users
      const colorStops = userColors.map((color, i) => {
        const start = (i / userColors.length) * 100;
        const end = ((i + 1) / userColors.length) * 100;
        return `${hexToRgba(color, opacity)} ${start}%, ${hexToRgba(color, opacity)} ${end}%`;
      }).join(', ');

      return {
        background: `linear-gradient(45deg, ${colorStops})`
      };
    }
  };

  // Early return for segments without highlights
  if (segment.highlights.length === 0) {
    return <span>{segment.text}</span>;
  }

  // Get background style using helper function
  const backgroundStyle = getBackgroundStyle(segment, userProfiles, showAuthorInfo);
  
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
      className={highlightClasses}
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
      onClick={(e) => onHighlightClick(e, segment.highlights)}
      onMouseEnter={(e) => onHighlightHover(e, segment.highlights)}
      onMouseLeave={onHighlightLeave}
    >
      {/* Visual indicators for multiple highlights */}
      {segment.highlights.length > 1 && (
        <span 
          className="absolute -top-1 -right-1 text-xs bg-gray-800 text-white rounded-full w-4 h-4 flex items-center justify-center font-bold highlight-count-indicator"
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
          {segment.highlights.length}
        </span>
      )}
      {segment.text}
    </mark>
  );
};

export default HighlightSegment; 