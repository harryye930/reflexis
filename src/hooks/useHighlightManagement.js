import { useState, useEffect } from 'react';
import { getAbsoluteIndex, findTextWithContext } from '../lib/utils/selectionUtils.js';

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
    
    // Get the selected text using a robust approach that mimics browser copy behavior
    const rawSelectedText = range.toString();
    if (!rawSelectedText || rawSelectedText.trim() === '') return { success: false };
    
    // Create a temporary container to properly extract clean text without UI elements
    const tempDiv = document.createElement('div');
    tempDiv.appendChild(range.cloneContents());
    
    // Remove all UI elements (buttons, indicators, etc.)
    const uiElements = tempDiv.querySelectorAll('.delete-highlight, .multiple-indicator');
    uiElements.forEach(el => el.remove());
    
    // Get the cleaned text content
    let selectedTextClean = tempDiv.textContent || tempDiv.innerText || '';
    
    // Additional cleanup for any remaining artifacts
    selectedTextClean = selectedTextClean
      .replace(/[×]/g, '') // Remove any remaining delete symbols
      .replace(/\d+×/g, '') // Remove count indicators like "2×"
      .replace(/\s+/g, ' ') // Normalize whitespace
      .trim();
    
    // Fallback to basic cleaning if the above didn't work
    if (!selectedTextClean && rawSelectedText) {
      selectedTextClean = rawSelectedText
        .replace(/[×]/g, '')
        .replace(/\d+×/g, '')
        .replace(/\s+/g, ' ')
        .trim();
    }
    
    if (!selectedTextClean) return { success: false };
    
    // Use the active document's content as our source of truth
    const sourceText = activeDocument.content;
    
    // Get clean text content from container for context (also removing UI elements)
    const containerText = textContainer.textContent || '';
    const containerTextClean = containerText
      .replace(/[×]/g, '')
      .replace(/\d+×/g, '')
      .replace(/\s+/g, ' ');
    
    // Get DOM-based indices for fallback, but we'll primarily rely on text search
    const rawStartIndex = getAbsoluteIndex(textContainer, range.startContainer, range.startOffset);
    const rawEndIndex = getAbsoluteIndex(textContainer, range.endContainer, range.endOffset);
    const startIndex = Math.min(rawStartIndex, rawEndIndex);
    const endIndex = Math.max(rawStartIndex, rawEndIndex);

    // Build context for text search - use cleaned container text
    let contextBefore = '';
    let contextAfter = '';
    
    if (startIndex >= 0 && endIndex > startIndex) {
      const contextStart = Math.max(0, startIndex - 50);
      const contextEnd = Math.min(containerTextClean.length, endIndex + 50);
      contextBefore = containerTextClean.substring(contextStart, startIndex);
      contextAfter = containerTextClean.substring(endIndex, contextEnd);
    }
    
    // Try context-aware search first
    let sourceStartIndex = findTextWithContext(sourceText, selectedTextClean, contextBefore, contextAfter);
    let sourceEndIndex = sourceStartIndex !== -1 ? sourceStartIndex + selectedTextClean.length : -1;
    
    // If context search fails, try simpler approaches
    if (sourceStartIndex === -1) {
      // Simple indexOf search on normalized text
      const normalizedSource = sourceText.replace(/\s+/g, ' ');
      const normalizedTarget = selectedTextClean.replace(/\s+/g, ' ');
      
      sourceStartIndex = normalizedSource.indexOf(normalizedTarget);
      if (sourceStartIndex !== -1) {
        sourceEndIndex = sourceStartIndex + normalizedTarget.length;
      } else {
        return { success: false, error: 'Selected text not found in source document' };
      }
    }

    // Validate that our mapping is reasonable before creating the highlight
    const extractedText = sourceText.substring(sourceStartIndex, sourceEndIndex);
    const normalizedSelected = selectedTextClean.replace(/\s+/g, ' ').trim();
    const normalizedExtracted = extractedText.replace(/\s+/g, ' ').trim();
    
    if (normalizedSelected !== normalizedExtracted) {
      // Only reject if the mismatch is very significant
      const lengthRatio = normalizedExtracted.length / normalizedSelected.length;
      if (normalizedExtracted.length === 0 || lengthRatio > 5 || lengthRatio < 0.2) {
        return { success: false, error: 'Text selection mapping failed severely' };
      }
    }

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
        setCurrentSelection(null); // Clear selection when clicking outside
      }
    };

    if (showModal) {
      document.addEventListener('mousedown', handleClickOutside);
      return () => document.removeEventListener('mousedown', handleClickOutside);
    }
  }, [showModal]);

  // Listen for global selection changes to clear state when text is deselected
  useEffect(() => {
    const handleSelectionChange = () => {
      const selection = window.getSelection();
      if (selection.isCollapsed && currentSelection) {
        // Selection was cleared, update our state
        setCurrentSelection(null);
        setShowModal(false);
      }
    };

    document.addEventListener('selectionchange', handleSelectionChange);
    return () => document.removeEventListener('selectionchange', handleSelectionChange);
  }, [currentSelection]);

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
