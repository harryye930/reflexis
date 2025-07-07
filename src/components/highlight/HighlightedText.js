import React, { useRef, useEffect, useState } from 'react';
import { getAbsoluteIndex, arraysEqual } from '../../lib/utils/selectionUtils.js';
import HighlightTooltip from './HighlightTooltip.js';
import HighlightManagementPanel from './HighlightManagementPanel.js';
import HighlightSegment from './HighlightSegment.js';
import { useTextSegmentation } from '../../hooks/useTextSegmentation.js';

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



  // Use the custom hook for text segmentation
  const segments = useTextSegmentation(highlights, sourceText);

  const renderTextWithHighlights = () => {
    return (
      <span>
        {segments.map((segment, index) => (
          <HighlightSegment
            key={index}
            segment={segment}
            userProfiles={userProfiles}
            currentUser={currentUser}
            showAuthorInfo={showAuthorInfo}
            onHighlightClick={handleHighlightClick}
            onHighlightHover={handleHighlightHover}
            onHighlightLeave={handleHighlightLeave}
          />
        ))}
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
