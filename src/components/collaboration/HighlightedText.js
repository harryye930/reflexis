import React, { useRef, useEffect, useState } from 'react';
import { getAbsoluteIndex, arraysEqual } from '../../lib/utils/selectionUtils.js';
import { getUserDisplayColor } from '../../lib/utils/hoverUtils.js';
import { hexToRgba } from '../../lib/utils/colorUtils.js';
import HighlightTooltip from './HighlightTooltip.js';
import HighlightManagementPanel from './HighlightManagementPanel.js';

// Opacity constants based on total number of codes
const OPACITY = {
  ONE_CODE: 0.4,
  TWO_CODES: 0.6,
  THREE_PLUS_CODES: 0.8
};

const HighlightedText = ({ 
  highlights, 
  userProfiles, 
  currentUser, 
  onTextSelection, 
  onDeleteHighlight,
  allCodes,
  activeDocument,
  showHoverTooltips = true,
  showAuthorInfo = true
}) => {
  const textContainerRef = useRef(null);
  const [tooltip, setTooltip] = useState({
    visible: false,
    highlights: [],
    position: { x: 0, y: 0 }
  });
  const [managementPanel, setManagementPanel] = useState({
    visible: false,
    highlights: [],
    position: { x: 0, y: 0 }
  });

  // Use the text from the active document
  const sourceText = activeDocument?.content || '';

  const handleTextSelection = (e) => {
    const selection = window.getSelection();
    
    // Hide modal if clicking without selecting text
    if (selection.isCollapsed) {
      onTextSelection(null, null, false);
      return;
    }

    // Don't show modal if clicking on a delete button or management panel
    if (e.target.closest('.delete-highlight') || e.target.closest('.highlight-management-panel')) {
      return;
    }

    // Show modal near the selection
    const range = selection.getRangeAt(0);
    const rect = range.getBoundingClientRect();
    
    const modalPosition = {
      x: window.scrollX + rect.left,
      y: window.scrollY + rect.bottom + 5
    };

    onTextSelection(selection, modalPosition, true);
  };

  const handleHighlightHover = (e, currentHighlights) => {
    if (!showHoverTooltips || currentHighlights.length === 0) return;

    const rect = e.target.getBoundingClientRect();
    setTooltip({
      visible: true,
      highlights: currentHighlights,
      position: {
        x: window.scrollX + rect.left + rect.width / 2,
        y: window.scrollY + rect.top - 5
      }
    });
  };

  const handleHighlightLeave = () => {
    setTooltip(prev => ({ ...prev, visible: false }));
  };

  const handleHighlightClick = (e, clickedHighlights) => {
    e.preventDefault();
    e.stopPropagation();
    
    // Check if there's an active text selection - if so, don't show management panel
    // to allow code application instead
    const selection = window.getSelection();
    if (selection && !selection.isCollapsed) {
      return;
    }
    
    // Show management panel only when no text is selected
    const rect = e.target.getBoundingClientRect();
    setManagementPanel({
      visible: true,
      highlights: clickedHighlights,
      position: {
        x: window.scrollX + rect.left + rect.width / 2,
        y: window.scrollY + rect.bottom + 5
      }
    });
  };

  const handleManagementPanelClose = () => {
    setManagementPanel(prev => ({ ...prev, visible: false }));
  };

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

  const renderTextWithHighlights = () => {
    // Early return for no highlights
    if (highlights.length === 0) {
      return <span>{sourceText}</span>;
    }

    // Create segments based on highlight boundaries
    const segments = [];
    const boundaries = new Set([0, sourceText.length]);
    
    // Add all highlight start and end positions as boundaries
    highlights.forEach(h => {
      boundaries.add(h.startIndex);
      boundaries.add(h.endIndex);
    });
    
    const sortedBoundaries = Array.from(boundaries).sort((a, b) => a - b);
    
    // Create segments between boundaries
    for (let i = 0; i < sortedBoundaries.length - 1; i++) {
      const start = sortedBoundaries[i];
      const end = sortedBoundaries[i + 1];
      const text = sourceText.substring(start, end);
      
      // Find all highlights that cover this segment
      const segmentHighlights = highlights.filter(h => 
        h.startIndex <= start && h.endIndex >= end
      );
      
      segments.push({
        text,
        startIndex: start,
        endIndex: end,
        highlights: segmentHighlights
      });
    }
    
    // Render segments with consistent logic
    const renderedSegments = segments.map((segment, index) => {
      // Early return for segments without highlights
      if (segment.highlights.length === 0) {
        return <span key={index}>{segment.text}</span>;
      }

      // Get background style using helper function
      const backgroundStyle = getBackgroundStyle(segment, userProfiles, showAuthorInfo);
      
      // Determine if current user owns any of these highlights
      const isOwner = segment.highlights.some(h => currentUser && h.userId === currentUser.uid);
      
      // Determine CSS classes
      const highlightClasses = [
        'highlight',
        segment.highlights.length > 1 ? 'multiple-highlights' : '',
        isOwner ? 'owned-highlight' : ''
      ].filter(Boolean).join(' ');

      // Determine outline style
      const outlineStyle = segment.highlights.length > 1 ? '1px dotted rgba(0,0,0,0.2)' : 'none';

      return (
        <mark
          key={index}
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
          onClick={(e) => handleHighlightClick(e, segment.highlights)}
          onMouseEnter={(e) => handleHighlightHover(e, segment.highlights)}
          onMouseLeave={handleHighlightLeave}
        >
          {/* Visual indicators for multiple highlights */}
          {segment.highlights.length > 1 && (
            <span className="absolute -top-1 -right-1 text-xs bg-gray-800 text-white rounded-full w-4 h-4 flex items-center justify-center font-bold">
              {segment.highlights.length}
            </span>
          )}
          {segment.text}
        </mark>
      );
    });

    return <span>{renderedSegments}</span>;
  };

  return (
    <div
      id="text-container"
      ref={textContainerRef}
      className="text-lg leading-relaxed bg-white p-8 rounded-lg shadow-sm prose max-w-none"
      onMouseUp={handleTextSelection}
    >
      {sourceText ? renderTextWithHighlights() : (
        <div className="text-gray-500 italic">
          No document content available. Please select a document or add a new one.
        </div>
      )}
      
      {/* Enhanced tooltip component */}
      <HighlightTooltip
        highlights={tooltip.highlights}
        userProfiles={userProfiles}
        allCodes={allCodes}
        showAuthorInfo={showAuthorInfo}
        currentUser={currentUser}
        position={tooltip.position}
        visible={tooltip.visible}
      />

      {/* Highlight management panel for complex interactions */}
      <HighlightManagementPanel
        highlights={managementPanel.highlights}
        userProfiles={userProfiles}
        allCodes={allCodes}
        currentUser={currentUser}
        showAuthorInfo={showAuthorInfo}
        position={managementPanel.position}
        visible={managementPanel.visible}
        onClose={handleManagementPanelClose}
        onDeleteHighlight={onDeleteHighlight}
      />
    </div>
  );
};

export default HighlightedText;
