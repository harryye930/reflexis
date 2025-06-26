import React, { useState, useEffect } from 'react';
import { sourceText, appId } from '../constants/index.js';
import { getAbsoluteIndex } from '../lib/utils/selectionUtils.js';
import { useAuth } from '../hooks/useAuth.js';
import { useHighlights } from '../hooks/useHighlights.js';
import { useUserProfiles } from '../hooks/useUserProfiles.js';
import { useUserActivity } from '../hooks/useUserActivity.js';
import HighlightedText from './collaboration/HighlightedText.js';
import HighlightingModal from './collaboration/HighlightingModal.js';
import MessageBox from './collaboration/MessageBox.js';
import Sidebar from './layout/Sidebar.js';

export default function CollaborativeText() {
  const [currentSelection, setCurrentSelection] = useState(null);
  const [modalPosition, setModalPosition] = useState({ x: 0, y: 0 });
  const [showModal, setShowModal] = useState(false);
  const [message, setMessage] = useState({ text: '', isError: false, show: false });
  
  // Custom hooks
  const { currentUser, loading } = useAuth(appId);
  const { highlights, addHighlight, deleteHighlight } = useHighlights(appId, currentUser);
  const { userProfiles, userProfilesLoaded } = useUserProfiles(appId, currentUser);
  useUserActivity(appId, currentUser);

  // Handle clicking outside to close modal
  useEffect(() => {
    const handleClickOutside = (e) => {
      if (!e.target.closest('#text-container') && 
          !e.target.closest('#coding-modal')) {
        setShowModal(false);
      }
    };

    if (showModal) {
      document.addEventListener('mousedown', handleClickOutside);
      return () => document.removeEventListener('mousedown', handleClickOutside);
    }
  }, [showModal]);

  const showMessage = (text, isError = false) => {
    setMessage({ text, isError, show: true });
    setTimeout(() => {
      setMessage(prev => ({ ...prev, show: false }));
    }, isError ? 8000 : 3000);
  };

  const handleTextSelection = (selection, position, shouldShow) => {
    setCurrentSelection(selection);
    if (position) setModalPosition(position);
    setShowModal(shouldShow);
  };

  const handleAddHighlight = async (code) => {
    if (!currentSelection || !currentUser) return;

    const textContainer = document.getElementById('text-container');
    if (!textContainer) return;

    const range = currentSelection.getRangeAt(0);
    
    // Get the selected text directly from the range
    const selectedText = range.toString();
    if (!selectedText || selectedText.trim() === '') return;
    
    // Get the full text content of the container
    const containerText = textContainer.textContent || '';
    
    // Find the start position by searching for the selected text in the source
    // We'll use the container's text content to map back to sourceText indices
    const startIndex = getAbsoluteIndex(textContainer, range.startContainer, range.startOffset);
    const endIndex = getAbsoluteIndex(textContainer, range.endContainer, range.endOffset);
    
    // Ensure we have valid indices
    if (startIndex === endIndex || startIndex < 0 || endIndex < 0) {
      console.warn('Invalid selection indices:', { startIndex, endIndex, selectedText });
      return;
    }

    // Map the container text indices to sourceText indices
    // The container text should match sourceText exactly (just with added markup)
    const cleanContainerText = containerText.replace(/\s+/g, ' ').trim();
    const cleanSourceText = sourceText.replace(/\s+/g, ' ').trim();
    
    // Find the actual position in sourceText by comparing the selected text
    let sourceStartIndex = sourceText.indexOf(selectedText.trim());
    let sourceEndIndex = sourceStartIndex + selectedText.trim().length;
    
    // If direct search fails, try to find it by context
    if (sourceStartIndex === -1) {
      // Get some context around the selection
      const contextBefore = containerText.substring(Math.max(0, startIndex - 20), startIndex);
      const contextAfter = containerText.substring(endIndex, Math.min(containerText.length, endIndex + 20));
      
      // Try to find the selection within sourceText using context
      const contextBeforeClean = contextBefore.replace(/\s+/g, ' ').trim();
      const contextAfterClean = contextAfter.replace(/\s+/g, ' ').trim();
      const selectedTextClean = selectedText.replace(/\s+/g, ' ').trim();
      
      const beforeIndex = sourceText.indexOf(contextBeforeClean);
      if (beforeIndex !== -1) {
        const searchStart = beforeIndex + contextBeforeClean.length;
        sourceStartIndex = sourceText.indexOf(selectedTextClean, searchStart);
        if (sourceStartIndex !== -1) {
          sourceEndIndex = sourceStartIndex + selectedTextClean.length;
        }
      }
    }
    
    // Fallback: use the calculated indices if we still can't find the text
    if (sourceStartIndex === -1) {
      console.warn('Could not map selection to source text, using calculated indices');
      sourceStartIndex = Math.min(startIndex, endIndex);
      sourceEndIndex = Math.max(startIndex, endIndex);
      
      // Ensure indices are within bounds
      sourceStartIndex = Math.max(0, Math.min(sourceStartIndex, sourceText.length));
      sourceEndIndex = Math.max(sourceStartIndex, Math.min(sourceEndIndex, sourceText.length));
    }

    console.log('Highlight indices:', { 
      selectedText: selectedText.trim(), 
      sourceStartIndex, 
      sourceEndIndex,
      extractedText: sourceText.substring(sourceStartIndex, sourceEndIndex)
    });

    const result = await addHighlight({
      code,
      startIndex: sourceStartIndex,
      endIndex: sourceEndIndex,
      text: sourceText.substring(sourceStartIndex, sourceEndIndex)
    });

    if (result.success) {
      showMessage('Highlight added!');
    } else {
      showMessage('Failed to add highlight.', true);
    }

    setShowModal(false);
    window.getSelection().removeAllRanges();
    setCurrentSelection(null);
  };

  const handleDeleteHighlight = async (id) => {
    if (!confirm("Are you sure you want to delete this highlight?")) return;

    const result = await deleteHighlight(id);
    if (result.success) {
      showMessage('Highlight deleted.');
    } else {
      showMessage('Failed to delete highlight.', true);
    }
  };

  const currentUserProfile = currentUser && userProfiles[currentUser.uid];

  return (
    <div className="flex flex-col md:flex-row h-screen">
      {/* Main Content Area */}
      <main className="w-full md:w-2/3 lg:w-3/4 p-6 md:p-8 overflow-y-auto">
        <div className="max-w-4xl mx-auto">
          <h1 className="text-3xl font-bold text-gray-900 mb-2">Research Document</h1>
          <p className="text-gray-500 mb-6">Select text with your mouse to apply a code.</p>

          {loading && (
            <div id="loading-text" className="text-center p-8">
              <p className="text-gray-500">Connecting to the collaborative session...</p>
            </div>
          )}

          <HighlightedText
            highlights={highlights}
            userProfiles={userProfiles}
            currentUser={currentUser}
            onTextSelection={handleTextSelection}
            onDeleteHighlight={handleDeleteHighlight}
          />
        </div>
      </main>

      <Sidebar
        currentUser={currentUser}
        currentUserProfile={currentUserProfile}
        userProfiles={userProfiles}
        userProfilesLoaded={userProfilesLoaded}
        onCodeSelect={handleAddHighlight}
        onMessage={showMessage}
        isSelectionActive={!!currentSelection}
      />

      {/* Coding Modal */}
      {showModal && (
        <HighlightingModal
          modalPosition={modalPosition}
          onCodeSelect={handleAddHighlight}
          onClose={() => setShowModal(false)}
        />
      )}

      <MessageBox message={message} />
    </div>
  );
}
