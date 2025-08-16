import React, { useEffect, useRef, useState, useCallback } from 'react';
import CodeChip from '../common/CodeChip.js';
import { getUserDisplayColor, getUserDisplayName, shouldShowAuthorInfo } from '../../lib/utils/hoverUtils';
import DiscussionPromptPanel from './DiscussionPromptPanel.js';
import { useDiscussionPrompt } from '../../hooks/useDiscussionPrompt.js';
import { useReflexiveCheck } from '../../hooks/useReflexiveCheck.js';

// Individual highlight item component with reflexive check logic
const HighlightItem = ({ 
  highlight, 
  userProfiles, 
  allCodes, 
  currentUser, 
  showAuthorInfo, 
  onDeleteHighlight, 
  onReflexiveClick,
  activeDocument,
  onClose 
}) => {
  const user = userProfiles[highlight.userId];
  const code = allCodes?.find(c => c.id === highlight.code);
  
  // Check if this highlight is from the current user
  const isCurrentUserHighlight = currentUser && highlight.userId === currentUser.uid;
  
  // Use reflexive check hook only if it's the current user's highlight
  const { hasReflexiveInput, loading: reflexiveLoading } = useReflexiveCheck(
    isCurrentUserHighlight ? highlight.id : null, 
    isCurrentUserHighlight ? currentUser.uid : null
  );
  
  // Use hover utilities for user display
  const userColor = getUserDisplayColor(user, showAuthorInfo);
  const userName = getUserDisplayName(user, showAuthorInfo, currentUser, highlight.userId);
  const shouldShowAuthor = shouldShowAuthorInfo(showAuthorInfo);
  
  const handleDeleteClick = () => {
    const confirmText = `Delete "${highlight.text.substring(0, 80)}${highlight.text.length > 80 ? '...' : ''}"?`;
    if (confirm(confirmText)) {
      onDeleteHighlight(highlight.id);
      onClose();
    }
  };

  const handleReflexiveClick = () => {
    if (onReflexiveClick && !hasReflexiveInput) {
      // Close the management panel immediately for better UX
      onClose();
      // Then trigger the reflexive modal
      onReflexiveClick(highlight, code);
    }
  };

  return (
    <div 
      className={`code-palette-unified ${code?.color} rounded-xl border transition-all duration-200 border-gray-200`}
    >
      {/* Header with code and user info */}
      <div className="p-3 border-b border-gray-100">
        <div className="flex items-center justify-between">
          <div className="flex items-center gap-3">
            {/* Code chip */}
            <CodeChip 
              code={code}
              size="sm"
              variant="simple"
            />
          </div>
          
          {/* Action buttons */}
          <div className="flex items-center gap-2">
            {/* Reflexive button - only show for current user's highlights */}
            {isCurrentUserHighlight && onReflexiveClick && (
              <button
                onClick={handleReflexiveClick}
                disabled={hasReflexiveInput || reflexiveLoading}
                className={`text-xs px-2 py-1.5 rounded-md transition-colors font-medium ${
                  hasReflexiveInput 
                    ? 'bg-green-100 text-green-700 cursor-not-allowed opacity-75' 
                    : reflexiveLoading
                    ? 'bg-gray-100 text-gray-500 cursor-wait'
                    : 'bg-indigo-100 text-indigo-700 hover:bg-indigo-200 hover:text-indigo-800'
                }`}
                title={
                  reflexiveLoading ? 'Checking reflexive status...' :
                  hasReflexiveInput ? 'Reflexive responses completed' : 
                  'Add reflexive reflection'
                }
              >
                {reflexiveLoading ? (
                  <div className="flex items-center gap-1">
                    <div className="w-3 h-3 border border-gray-400 border-t-transparent rounded-full animate-spin"></div>
                    <span>...</span>
                  </div>
                ) : hasReflexiveInput ? (
                  <div className="flex items-center gap-1">
                    <svg className="w-3 h-3" fill="currentColor" viewBox="0 0 20 20">
                      <path fillRule="evenodd" d="M16.707 5.293a1 1 0 010 1.414l-8 8a1 1 0 01-1.414 0l-4-4a1 1 0 011.414-1.414L8 12.586l7.293-7.293a1 1 0 011.414 0z" clipRule="evenodd" />
                    </svg>
                    <span>Reflected</span>
                  </div>
                ) : (
                  <div className="flex items-center gap-1">
                    <svg className="w-3 h-3" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                      <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M8.228 9c.549-1.165 2.03-2 3.772-2 2.21 0 4 1.343 4 3 0 1.4-1.278 2.575-3.006 2.907-.542.104-.994.54-.994 1.093m0 3h.01M21 12a9 9 0 11-18 0 9 9 0 0118 0z" />
                    </svg>
                    <span>Reflect</span>
                  </div>
                )}
              </button>
            )}
            
            {/* Delete button - available to any authenticated user */}
            {currentUser && (
              <button
                onClick={handleDeleteClick}
                className={`hover:bg-red-100 rounded-md p-1.5 transition-colors hover:text-red-700`}
                title="Delete this highlight"
              >
                <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M19 7l-.867 12.142A2 2 0 0116.138 21H7.862a2 2 0 01-1.995-1.858L5 7m5 4v6m4-6v6m1-10V4a1 1 0 00-1-1h-4a1 1 0 00-1 1v3M4 7h16" />
                </svg>
              </button>
            )}
          </div>
        </div>
        
        {/* User info */}
        {shouldShowAuthor && userName && (
          <div className="flex items-center gap-2 mt-2">
            <span 
              className="w-2 h-2 rounded-full" 
              style={{ backgroundColor: userColor }}
            />
            <span className="text-xs font-medium text-gray-800 opacity-80">
              {userName}
            </span>
          </div>
        )}
        
        {/* Code description directly under code */}
        {code?.description && (
          <div className="mt-2 text-xs leading-relaxed text-gray-800 opacity-75">
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
};

const HighlightManagementPanel = ({ 
  highlights, 
  userProfiles, 
  allCodes, 
  currentUser,
  showAuthorInfo,
  position,
  visible,
  onClose,
  onDeleteHighlight,
  onReflexiveClick,
  activeDocument
}) => {
  const panelRef = useRef(null);
  const [autoPromptGenerated, setAutoPromptGenerated] = useState(false);
  
  const { 
    isGenerating, 
    discussionPrompt, 
    error: promptError, 
    generateDiscussionPrompt, 
    clearDiscussionPrompt 
  } = useDiscussionPrompt();

  // Check if we should show discussion prompt - different users with different codes
  const shouldShowDiscussionPromptOption = useCallback(() => {
    if (highlights.length < 2) return false;
    
    const uniqueUserCodes = new Map();
    highlights.forEach(highlight => {
      const userId = highlight.userId;
      const codeId = highlight.code;
      if (userId && codeId) {
        uniqueUserCodes.set(userId, codeId);
      }
    });
    
    // Need at least 2 different users
    if (uniqueUserCodes.size < 2) return false;
    
    // Check if they used different codes
    const uniqueCodes = new Set(uniqueUserCodes.values());
    return uniqueCodes.size > 1;
  }, [highlights]);

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

  // Auto-generate discussion prompt when conditions are met
  useEffect(() => {
    if (visible && shouldShowDiscussionPromptOption() && !autoPromptGenerated && !isGenerating) {
      setAutoPromptGenerated(true);
      generateDiscussionPrompt({
        highlights,
        userProfiles,
        allCodes,
        activeDocument
      });
    }
  }, [visible, highlights, userProfiles, allCodes, activeDocument, autoPromptGenerated, isGenerating, generateDiscussionPrompt, shouldShowDiscussionPromptOption]);

  // Reset auto-generation flag when panel closes or highlights change
  useEffect(() => {
    if (!visible) {
      setAutoPromptGenerated(false);
      clearDiscussionPrompt();
    }
  }, [visible, clearDiscussionPrompt]);

  if (!visible || !highlights || highlights.length === 0) {
    return null;
  }

  const handleCloseDiscussionPrompt = () => {
    clearDiscussionPrompt();
    setAutoPromptGenerated(false);
  };

  // Sort highlights by text length (longer first) and then by creation date
  const sortedHighlights = [...highlights].sort((a, b) => {
    const lengthDiff = (b.endIndex - b.startIndex) - (a.endIndex - a.startIndex);
    if (lengthDiff !== 0) return lengthDiff;
    return new Date(a.createdAt) - new Date(b.createdAt);
  });

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
      <div className="bg-white rounded-xl shadow-2xl border border-gray-100 p-5 max-w-md">
        <div className="mb-4">
          <h3 className="text-base font-semibold text-gray-900 mb-1">
            {highlights.length > 1 ? 'Multiple Highlights' : 'Highlight Details'}
          </h3>
          <p className="text-sm text-gray-500">
            {highlights.length} highlight{highlights.length > 1 ? 's' : ''} on this text
          </p>
        </div>

        {/* Auto-generated Discussion Prompt - Shows when different users use different codes */}
        {(discussionPrompt || isGenerating) && (
          <div className="mb-4">
            {isGenerating ? (
              <div className="bg-gradient-to-br from-amber-50 to-orange-50 border border-amber-200 rounded-xl p-4 mb-4 shadow-sm">
                <div className="flex items-center gap-3">
                  <div className="animate-spin rounded-full h-4 w-4 border-b-2 border-amber-600"></div>
                  <div>
                    <h4 className="text-sm font-semibold text-amber-900">Generating Insight Opportunity...</h4>
                    <p className="text-xs text-amber-700">Analyzing coding differences to create a discussion prompt</p>
                  </div>
                </div>
              </div>
            ) : (
              <DiscussionPromptPanel
                discussionPrompt={discussionPrompt}
                onClose={handleCloseDiscussionPrompt}
                userProfiles={userProfiles}
                allCodes={allCodes}
              />
            )}
            {promptError && (
              <div className="mb-4 p-3 bg-red-50 border border-red-200 rounded-lg">
                <p className="text-xs text-red-600">{promptError}</p>
              </div>
            )}
          </div>
        )}
        
        <div className="space-y-3 max-h-72 overflow-y-auto">
          {sortedHighlights.map((highlight, index) => (
            <HighlightItem
              key={highlight.id}
              highlight={highlight}
              userProfiles={userProfiles}
              allCodes={allCodes}
              currentUser={currentUser}
              showAuthorInfo={showAuthorInfo}
              onDeleteHighlight={onDeleteHighlight}
              onReflexiveClick={onReflexiveClick}
              activeDocument={activeDocument}
              onClose={onClose}
            />
          ))}
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
