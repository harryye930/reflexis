import React, { useRef, useEffect, useState } from 'react';
import { getAbsoluteIndex, arraysEqual } from '../../lib/utils/selectionUtils.js';
import { getUserDisplayColor } from '../../lib/utils/hoverUtils.js';
import HighlightTooltip from './HighlightTooltip.js';
import HighlightManagementPanel from './HighlightManagementPanel.js';

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
    
    // Always show management panel for all highlight clicks for consistency
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

  const renderTextWithHighlights = () => {
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
    
    return (
      <span>
        {segments.map((segment, index) => {
          if (segment.highlights.length === 0) {
            return <span key={index}>{segment.text}</span>;
          }
          
          // Create layered background styles for multiple highlights
          const backgroundLayers = segment.highlights.map((highlight, layerIndex) => {
            const user = userProfiles[highlight.userId];
            const userColor = getUserDisplayColor(user, showAuthorInfo);
            const code = allCodes?.find(c => c.id === highlight.code);
            return {
              color: userColor,
              opacity: segment.highlights.length > 1 ? 0.4 : 0.6
            };
          });
          
          // Combine background styles
          let backgroundStyle;
          if (backgroundLayers.length === 1) {
            backgroundStyle = {
              backgroundColor: backgroundLayers[0].color,
              opacity: backgroundLayers[0].opacity
            };
          } else {
            // For multiple highlights, identify unique users
            const uniqueUsers = [...new Set(segment.highlights.map(h => h.userId))];
            const userColors = uniqueUsers.map(userId => {
              const user = userProfiles[userId];
              const userColor = getUserDisplayColor(user, showAuthorInfo);
              return userColor;
            });
            
            // Convert hex to rgba for better blending
            const hexToRgba = (hex, opacity) => {
              const r = parseInt(hex.slice(1, 3), 16);
              const g = parseInt(hex.slice(3, 5), 16);
              const b = parseInt(hex.slice(5, 7), 16);
              return `rgba(${r}, ${g}, ${b}, ${opacity})`;
            };
            
            if (userColors.length === 1) {
              // Same user, multiple codes - use solid color with higher opacity
              backgroundStyle = {
                backgroundColor: hexToRgba(userColors[0], 0.7)
              };
            } else if (userColors.length === 2) {
              // Two users - diagonal split at 45 degrees
              backgroundStyle = {
                background: `linear-gradient(45deg, ${hexToRgba(userColors[0], 0.6)} 50%, ${hexToRgba(userColors[1], 0.6)} 50%)`
              };
            } else if (userColors.length === 3) {
              // Three users - split into three diagonal sections
              backgroundStyle = {
                background: `linear-gradient(45deg, 
                  ${hexToRgba(userColors[0], 0.6)} 0%, 
                  ${hexToRgba(userColors[0], 0.6)} 33%, 
                  ${hexToRgba(userColors[1], 0.6)} 33%, 
                  ${hexToRgba(userColors[1], 0.6)} 67%, 
                  ${hexToRgba(userColors[2], 0.6)} 67%, 
                  ${hexToRgba(userColors[2], 0.6)} 100%)`
              };
            } else {
              // 4+ users - use a more complex pattern
              const colorStops = userColors.map((color, i) => {
                const start = (i / userColors.length) * 100;
                const end = ((i + 1) / userColors.length) * 100;
                return `${hexToRgba(color, 0.5)} ${start}%, ${hexToRgba(color, 0.5)} ${end}%`;
              }).join(', ');
              
              backgroundStyle = {
                background: `linear-gradient(45deg, ${colorStops})`
              };
            }
          }
          
          const isOwner = segment.highlights.some(h => currentUser && h.userId === currentUser.uid);
          
          return (
            <mark
              key={index}
              className={`highlight ${segment.highlights.length > 1 ? 'multiple-highlights' : ''} ${isOwner ? 'owned-highlight' : ''}`}
              style={{
                ...backgroundStyle,
                position: 'relative',
                borderRadius: '2px',
                padding: '1px 2px',
                margin: '0 -1px',
                cursor: 'pointer',
                border: 'none', // Remove borders that create boxes
                outline: segment.highlights.length > 1 ? `1px dotted rgba(0,0,0,0.2)` : 'none'
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
        })}
      </span>
    );
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
