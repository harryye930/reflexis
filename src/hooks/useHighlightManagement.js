import { useState, useEffect } from 'react';
import { getAbsoluteIndex } from '../lib/utils/selectionUtils.js';

export const useHighlightManagement = (
  currentUser, 
  activeDocument, 
  activeDocumentId, 
  highlights, 
  addHighlight, 
  deleteHighlight, 
  allCodes
) => {
  const [currentSelection, setCurrentSelection] = useState(null);
  const [modalPosition, setModalPosition] = useState({ x: 0, y: 0 });
  const [showModal, setShowModal] = useState(false);

  const handleTextSelection = (selection, position, shouldShow) => {
    setCurrentSelection(selection);
    if (position) setModalPosition(position);
    setShowModal(shouldShow);
  };

  const handleAddHighlight = async (code) => {
    if (!currentSelection || !currentUser || !activeDocument) return { success: false };

    const textContainer = document.getElementById('text-container');
    if (!textContainer) return { success: false };

    const range = currentSelection.getRangeAt(0);
    
    // Get the selected text directly from the range
    const selectedText = range.toString();
    if (!selectedText || selectedText.trim() === '') return { success: false };
    
    // Get the full text content of the container
    const containerText = textContainer.textContent || '';
    
    // Use the active document's content
    const sourceText = activeDocument.content;
    
    // Find the start position by searching for the selected text in the source
    const startIndex = getAbsoluteIndex(textContainer, range.startContainer, range.startOffset);
    const endIndex = getAbsoluteIndex(textContainer, range.endContainer, range.endOffset);
    
    // Ensure we have valid indices
    if (startIndex === endIndex || startIndex < 0 || endIndex < 0) {
      console.warn('Invalid selection indices:', { startIndex, endIndex, selectedText });
      return { success: false };
    }

    // Map the container text indices to sourceText indices
    let sourceStartIndex = sourceText.indexOf(selectedText.trim());
    let sourceEndIndex = sourceStartIndex + selectedText.trim().length;
    
    // If direct search fails, try to find it by context
    if (sourceStartIndex === -1) {
      const contextBefore = containerText.substring(Math.max(0, startIndex - 20), startIndex);
      const contextAfter = containerText.substring(endIndex, Math.min(containerText.length, endIndex + 20));
      
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
      extractedText: sourceText.substring(sourceStartIndex, sourceEndIndex),
      documentId: activeDocumentId
    });

    const result = await addHighlight({
      code,
      startIndex: sourceStartIndex,
      endIndex: sourceEndIndex,
      text: sourceText.substring(sourceStartIndex, sourceEndIndex),
      documentId: activeDocumentId
    });

    if (result.success) {
      setShowModal(false);
      window.getSelection().removeAllRanges();
      setCurrentSelection(null);
    }

    return result;
  };

  const handleDeleteHighlight = async (id) => {
    if (!confirm("Are you sure you want to delete this highlight?")) return { success: false };
    return await deleteHighlight(id);
  };

  const checkCodeUsage = async (codeId) => {
    const codeHighlights = highlights.filter(highlight => 
      highlight.code === codeId && highlight.documentId === activeDocumentId
    );
    return {
      count: codeHighlights.length,
      highlights: codeHighlights
    };
  };

  const deleteHighlightsByCode = async (codeId) => {
    try {
      const codeHighlights = highlights.filter(highlight => 
        highlight.code === codeId && highlight.documentId === activeDocumentId
      );
      
      const deletePromises = codeHighlights.map(highlight => deleteHighlight(highlight.id));
      const results = await Promise.all(deletePromises);
      
      const allSuccessful = results.every(result => result.success);
      
      return { 
        success: allSuccessful, 
        deletedCount: allSuccessful ? codeHighlights.length : 0 
      };
    } catch (error) {
      console.error('Error deleting highlights by code:', error);
      return { success: false, error };
    }
  };

  const closeModal = () => {
    setShowModal(false);
    setCurrentSelection(null);
  };

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

  return {
    currentSelection,
    modalPosition,
    showModal,
    handleTextSelection,
    handleAddHighlight,
    handleDeleteHighlight,
    checkCodeUsage,
    deleteHighlightsByCode,
    closeModal,
    isSelectionActive: !!currentSelection
  };
};
