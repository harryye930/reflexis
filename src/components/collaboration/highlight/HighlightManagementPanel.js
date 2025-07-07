import React, { useEffect, useRef } from 'react';
import { getUserDisplayColor, getUserDisplayName, shouldShowAuthorInfo } from '../../../lib/utils/hoverUtils';

const HighlightManagementPanel = ({ 
  highlights, 
  userProfiles, 
  allCodes, 
  currentUser,
  showAuthorInfo,
  position,
  visible,
  onClose,
  onDeleteHighlight
}) => {
  const panelRef = useRef(null);

  // click-outside handling for management panel
  useEffect(() => {
    const handleClickOutside = (event) => {
      if (panelRef.current && !panelRef.current.contains(event.target)) {
        onClose();
      }
    };

    if (visible) {
      document.addEventListener('mousedown', handleClickOutside);
      return () => document.removeEventListener('mousedown', handleClickOutside);
    }
  }, [visible, onClose]);

  if (!visible || !highlights || highlights.length === 0) {
    return null;
  }

  // Sort highlights by text length (longer first) and then by creation date
  const sortedHighlights = [...highlights].sort((a, b) => {
    const lengthDiff = (b.endIndex - b.startIndex) - (a.endIndex - a.startIndex);
    if (lengthDiff !== 0) return lengthDiff;
    return new Date(a.createdAt) - new Date(b.createdAt);
  });

  const handleDeleteClick = (highlight) => {
    const confirmText = `Delete "${highlight.text.substring(0, 80)}${highlight.text.length > 80 ? '...' : ''}"?`;
    if (confirm(confirmText)) {
      onDeleteHighlight(highlight.id);
      onClose();
    }
  };

  return (
    <div
      ref={panelRef}
      className="fixed z-[150] highlight-management-panel"
      style={{
        left: position.x,
        top: position.y,
        transform: 'translateX(-50%)'
      }}
    >
      <div className="bg-white rounded-xl shadow-2xl border border-gray-100 p-5 max-w-sm">
        <div className="mb-4">
          <h3 className="text-base font-semibold text-gray-900 mb-1">
            {highlights.length > 1 ? 'Multiple Highlights' : 'Highlight Details'}
          </h3>
          <p className="text-sm text-gray-500">
            {highlights.length} highlight{highlights.length > 1 ? 's' : ''} on this text
          </p>
        </div>
        
        <div className="space-y-3 max-h-72 overflow-y-auto">
          {sortedHighlights.map((highlight, index) => {
            const user = userProfiles[highlight.userId];
            const code = allCodes?.find(c => c.id === highlight.code);
            const isOwner = currentUser && highlight.userId === currentUser.uid;
            
            // Use hover utilities for user display
            const userColor = getUserDisplayColor(user, showAuthorInfo);
            const userName = getUserDisplayName(user, showAuthorInfo, currentUser, highlight.userId);
            const shouldShowAuthor = shouldShowAuthorInfo(showAuthorInfo);
            
            return (
              <div 
                key={highlight.id} 
                className={`code-palette-unified ${code?.color || 'bg-gray-200'} rounded-xl border transition-all duration-200 ${
                  isOwner 
                    ? 'border-blue-200' 
                    : 'border-gray-200'
                }`}
              >
                {/* Header with code and user info */}
                <div className="p-3 border-b border-gray-100">
                  <div className="flex items-center justify-between">
                    <div className="flex items-center gap-3">
                      {/* Code label with matching text color */}
                      <span className={`font-semibold text-sm ${code?.textColor || 'text-gray-800'}`}>
                        {code?.label || 'Unknown Code'}
                      </span>
                    </div>
                    
                    {/* Delete button - only for owner */}
                    {isOwner && (
                      <button
                        onClick={() => handleDeleteClick(highlight)}
                        className={`hover:bg-red-100 rounded-md p-1.5 transition-colors hover:text-red-700`}
                        title="Delete this highlight"
                      >
                        <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                          <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M19 7l-.867 12.142A2 2 0 0116.138 21H7.862a2 2 0 01-1.995-1.858L5 7m5 4v6m4-6v6m1-10V4a1 1 0 00-1-1h-4a1 1 0 00-1 1v3M4 7h16" />
                        </svg>
                      </button>
                    )}
                  </div>
                  
                  {/* User info */}
                  {shouldShowAuthor && userName && (
                    <div className="flex items-center gap-2 mt-2">
                      <span 
                        className="w-2 h-2 rounded-full" 
                        style={{ backgroundColor: userColor }}
                      />
                      <span className={`text-xs font-medium ${code?.textColor || 'text-gray-800'} opacity-80`}>
                        {userName}
                      </span>
                    </div>
                  )}
                  
                  {/* Code description directly under code */}
                  {code?.description && (
                    <div className={`mt-2 text-xs leading-relaxed ${code?.textColor || 'text-gray-800'} opacity-75`}>
                      {code.description}
                    </div>
                  )}
                </div>
                
                {/* Highlight text preview with darker text */}
                <div className="p-3">
                  <div className="text-sm text-gray-900 leading-relaxed font-medium bg-white rounded px-3 py-2 border border-gray-200 shadow-sm">
                    &ldquo;{highlight.text.length > 120 ? `${highlight.text.substring(0, 120)}...` : highlight.text}&rdquo;
                  </div>
                </div>
              </div>
            );
          })}
        </div>
        
        {/* Footer */}
        <div className="mt-4 pt-3 border-t border-gray-100 flex justify-end">
          <button
            onClick={onClose}
            className="text-gray-500 hover:text-gray-700 text-sm font-medium px-3 py-1 rounded-md hover:bg-gray-100 transition-colors"
          >
            Close
          </button>
        </div>
      </div>
      
      {/* Triangle pointer */}
      <div 
        className="absolute left-1/2 transform -translate-x-1/2"
        style={{ top: '-8px' }}
      >
        <div 
          className="w-0 h-0 border-l-4 border-r-4 border-b-8 border-transparent border-b-white"
        />
      </div>
    </div>
  );
};

export default HighlightManagementPanel;
