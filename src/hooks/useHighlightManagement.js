import { useState, useEffect } from 'react';
import { getAbsoluteIndex, findTextWithContext } from '../lib/utils/selectionUtils.js';
import { useSemanticDrift } from './useSemanticDrift.js';
import { FirebaseServiceFactory } from '../services/api/firebase/index.js';

export const useHighlightManagement = (
  currentUser, 
  activeDocument, 
  activeDocumentId, 
  highlights, 
  addHighlight, 
  deleteHighlight,
  appId = 'default' // Add appId parameter for semantic drift service
) => {
  const [currentSelection, setCurrentSelection] = useState(null);
  const [modalPosition, setModalPosition] = useState({ x: 0, y: 0 });
  const [showModal, setShowModal] = useState(false);
  const [selectedText, setSelectedText] = useState('');

  // Create service factory for semantic drift
  const [services] = useState(() => new FirebaseServiceFactory(appId));

  // Initialize semantic drift detection
  const {
    isDetecting,
    driftData,
    showDriftModal,
    pendingHighlight,
    detectDrift,
    handleRefineDefinition,
    handleSplitCode,
    handleApplyAnyway,
    closeDriftModal,
    getPendingHighlight,
    clearDriftState
  } = useSemanticDrift(services, currentUser);

  const handleTextSelection = (selection, position, shouldShow) => {
    setCurrentSelection(selection);
    if (position) setModalPosition(position);
    setShowModal(shouldShow);
    
    // Extract and store selected text
    if (selection && !selection.isCollapsed) {
      const range = selection.getRangeAt(0);
      const rawText = range.toString();
      const cleanText = rawText.replace(/\s+/g, ' ').trim();
      setSelectedText(cleanText);
    } else {
      setSelectedText('');
    }
  };

  const handleAddHighlight = async (code) => {
    if (!currentSelection || !currentUser || !activeDocument) {
      const error = `Missing: selection=${!!currentSelection}, user=${!!currentUser}, document=${!!activeDocument}`;
      return { success: false, error };
    }

    const textContainer = document.getElementById('text-container');
    if (!textContainer) {
      return { success: false, error: 'Text container not found' };
    }

    const range = currentSelection.getRangeAt(0);
    
    // Get the selected text using a robust approach that mimics browser copy behavior
    const rawSelectedText = range.toString();
    
    if (!rawSelectedText || rawSelectedText.trim() === '') {
      return { success: false, error: 'No text selected' };
    }
    
    // Get the selected text directly from the range
    let selectedTextClean = rawSelectedText
      .replace(/\s+/g, ' ') // Normalize whitespace
      .trim();
    
    if (!selectedTextClean) {
      return { success: false, error: 'Selected text is empty after cleaning' };
    }
    
    // Use the active document's content as our source of truth
    const sourceText = activeDocument.content;
    
    // Get container text for context building
    const containerText = textContainer.textContent || '';
    
    // Get DOM-based indices for fallback, but we'll primarily rely on text search
    const rawStartIndex = getAbsoluteIndex(textContainer, range.startContainer, range.startOffset);
    const rawEndIndex = getAbsoluteIndex(textContainer, range.endContainer, range.endOffset);
    const startIndex = Math.min(rawStartIndex, rawEndIndex);
    const endIndex = Math.max(rawStartIndex, rawEndIndex);

    // Build context for text search
    let contextBefore = '';
    let contextAfter = '';
    
    if (startIndex >= 0 && endIndex > startIndex) {
      const contextStart = Math.max(0, startIndex - 50);
      const contextEnd = Math.min(containerText.length, endIndex + 50);
      contextBefore = containerText.substring(contextStart, startIndex);
      contextAfter = containerText.substring(endIndex, contextEnd);
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

    // Validate that our mapping is correct
    const extractedText = sourceText.substring(sourceStartIndex, sourceEndIndex);
    const normalizedSelected = selectedTextClean.replace(/\s+/g, ' ').trim();
    const normalizedExtracted = extractedText.replace(/\s+/g, ' ').trim();
    
    if (normalizedSelected !== normalizedExtracted) {
      return { success: false, error: 'Text selection mapping failed' };
    }

    // Prepare highlight data
    const highlightData = {
      code: code,
      codeId: code,
      startIndex: sourceStartIndex,
      endIndex: sourceEndIndex,
      text: sourceText.substring(sourceStartIndex, sourceEndIndex),
      documentId: activeDocumentId,
      documentTitle: activeDocument.title
    };

    // Perform semantic drift detection before applying highlight
    const driftResult = await detectDrift(highlightData);
    
    if (driftResult.success && driftResult.driftDetected) {
      // Drift detected - modal will be shown by the hook
      // Don't apply highlight yet, wait for user decision
      return { success: true, driftDetected: true, pendingHighlight: true };
    }

    // No drift detected or drift detection failed gracefully - proceed with highlight
    const result = await addHighlight(highlightData);

    // Only close modal and clear selection for direct highlight creation
    // Don't close if this is part of a reflexive process (we'll handle that separately)
    if (result.success) {
      // Don't automatically close the modal - let the calling component decide
      // This allows reflexive process to continue with the modal open
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
    setSelectedText('');
  };

  // Function to apply pending highlight after drift resolution
  const applyPendingHighlight = async (specificHighlightData = null) => {
    const pending = specificHighlightData || getPendingHighlight();
    if (!pending) {
      return { success: false, error: 'No pending highlight to apply' };
    }
    
    const result = await addHighlight(pending);
    
    if (result.success) {
      // Clear selection and close modal
      window.getSelection().removeAllRanges();
      setCurrentSelection(null);
      clearDriftState();
    }

    return result;
  };


  // Listen for global selection changes to clear state when text is deselected
  // But ignore changes when reflexive modal or other modals are active
  useEffect(() => {
    const handleSelectionChange = () => {
      // Don't close modal if reflexive modal is open or other modal elements are present
      if (document.querySelector('.reflexive-modal') || 
          document.querySelector('.highlight-management-panel') ||
          document.querySelector('#coding-modal')) {
        return;
      }
      
      const selection = window.getSelection();
      if (selection.isCollapsed && currentSelection) {
        // Selection was cleared in main document, update our state
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
    selectedText,
    handleTextSelection,
    handleAddHighlight,
    handleDeleteHighlight,
    checkCodeUsage,
    deleteHighlightsByCode,
    closeModal,
    isSelectionActive: !!currentSelection,
    // Semantic drift related
    isDetecting,
    driftData,
    showDriftModal,
    pendingHighlight,
    handleRefineDefinition,
    handleSplitCode,
    handleApplyAnyway,
    closeDriftModal,
    getPendingHighlight,
    clearDriftState,
    applyPendingHighlight
  };
};
