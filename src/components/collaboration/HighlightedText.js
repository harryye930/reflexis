import React, { useRef, useEffect } from 'react';
import { sourceText } from '../../constants/index.js';
import { getAbsoluteIndex, arraysEqual } from '../../lib/utils/selectionUtils.js';

const HighlightedText = ({ 
  highlights, 
  userProfiles, 
  currentUser, 
  onTextSelection, 
  onDeleteHighlight,
  allCodes 
}) => {
  const textContainerRef = useRef(null);

  const handleTextSelection = (e) => {
    const selection = window.getSelection();
    
    // Hide modal if clicking without selecting text
    if (selection.isCollapsed) {
      onTextSelection(null, null, false);
      return;
    }

    // Don't show modal if clicking on a delete button
    if (e.target.classList.contains('delete-highlight')) {
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

  const renderTextWithHighlights = () => {
    if (highlights.length === 0) {
      return <span>{sourceText}</span>;
    }

    // Create an array to track highlight coverage at each character position
    const highlightMap = new Array(sourceText.length).fill(null).map(() => []);
    
    // Populate the highlight map
    highlights.forEach(highlight => {
      for (let i = highlight.startIndex; i < highlight.endIndex; i++) {
        highlightMap[i].push(highlight);
      }
    });

    let elements = [];
    let i = 0;

    while (i < sourceText.length) {
      const currentHighlights = highlightMap[i];
      
      if (currentHighlights.length === 0) {
        // No highlights at this position, find the next position with highlights
        let nextHighlight = i + 1;
        while (nextHighlight < sourceText.length && highlightMap[nextHighlight].length === 0) {
          nextHighlight++;
        }
        
        elements.push(
          <span key={`text-${i}`}>
            {sourceText.substring(i, nextHighlight)}
          </span>
        );
        i = nextHighlight;
      } else {
        // Find the end of this highlight segment (where the highlight combination changes)
        let segmentEnd = i + 1;
        while (segmentEnd < sourceText.length && 
               highlightMap[segmentEnd].length > 0 &&
               arraysEqual(highlightMap[i].map(h => h.id), highlightMap[segmentEnd].map(h => h.id))) {
          segmentEnd++;
        }

        // Render this segment with multiple highlights
        const segmentText = sourceText.substring(i, segmentEnd);
        const sortedHighlights = currentHighlights.sort((a, b) => {
          // Prioritize current user's highlights first
          if (currentUser) {
            if (a.userId === currentUser.uid && b.userId !== currentUser.uid) return -1;
            if (b.userId === currentUser.uid && a.userId !== currentUser.uid) return 1;
          }
          // Then sort by creation time
          return new Date(a.createdAt) - new Date(b.createdAt);
        });

        const primaryHighlight = sortedHighlights[0];
        const userColor = userProfiles[primaryHighlight.userId]?.color || '#e5e7eb';
        const isOwner = currentUser && primaryHighlight.userId === currentUser.uid;
        
        // Build tooltip showing all highlights
        const tooltipParts = sortedHighlights.map(h => {
          const user = userProfiles[h.userId]?.name || '...';
          const code = allCodes?.find(c => c.id === h.code)?.label || 'Unknown';
          return `${user}: ${code}`;
        });
        const tooltip = tooltipParts.join('\n');

        // Create blended background for multiple highlights
        let backgroundColor;
        let opacity = 1;
        
        if (currentHighlights.length === 1) {
          backgroundColor = userColor;
          opacity = 0.7; // Make single highlights slightly translucent
        } else {
          // Blend colors for multiple highlights with increased translucency
          const colors = sortedHighlights.slice(0, 3).map(h => 
            userProfiles[h.userId]?.color || '#e5e7eb'
          );
          
          // Create a more subtle blended effect
          if (colors.length === 2) {
            backgroundColor = `linear-gradient(45deg, ${colors[0]} 50%, ${colors[1]} 50%)`;
            opacity = 0.5;
          } else {
            backgroundColor = `linear-gradient(45deg, ${colors[0]} 33%, ${colors[1]} 33%, ${colors[1]} 67%, ${colors[2] || colors[1]} 67%)`;
            opacity = 0.4;
          }
        }

        elements.push(
          <mark
            key={`highlight-${i}-${segmentEnd}`}
            className={`highlight ${currentHighlights.length > 1 ? 'multiple-highlights' : ''}`}
            style={{ 
              background: backgroundColor,
              opacity: opacity,
              position: 'relative',
              border: currentHighlights.length > 1 ? '1px dotted rgba(0,0,0,0.2)' : 'none'
            }}
            title={tooltip}
          >
            {/* Small discrete indicator for multiple highlights */}
            {currentHighlights.length > 1 && (
              <span 
                className="multiple-indicator"
                style={{
                  position: 'absolute',
                  top: '-6px',
                  right: '-2px',
                  backgroundColor: 'rgba(0,0,0,0.8)',
                  color: 'white',
                  fontSize: '8px',
                  borderRadius: '6px',
                  padding: '1px 3px',
                  lineHeight: '1',
                  zIndex: 5,
                  fontWeight: 'bold'
                }}
              >
                {currentHighlights.length}
              </span>
            )}

            {/* Delete button for current user's highlight */}
            {isOwner && (
              <span
                className="delete-highlight"
                data-id={primaryHighlight.id}
                onClick={() => onDeleteHighlight(primaryHighlight.id)}
                title="Delete your highlight"
              >
                ×
              </span>
            )}
            {segmentText}
          </mark>
        );

        i = segmentEnd;
      }
    }

    return elements;
  };

  return (
    <div
      id="text-container"
      ref={textContainerRef}
      className="text-lg leading-relaxed bg-white p-8 rounded-lg shadow-sm prose max-w-none"
      onMouseUp={handleTextSelection}
    >
      {renderTextWithHighlights()}
    </div>
  );
};

export default HighlightedText;
