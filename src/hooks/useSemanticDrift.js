import { useState } from 'react';

export const useSemanticDrift = (services, currentUser) => {
  const [isDetecting, setIsDetecting] = useState(false);
  const [driftData, setDriftData] = useState(null);
  const [showDriftModal, setShowDriftModal] = useState(false);
  const [pendingHighlight, setPendingHighlight] = useState(null);

  /**
   * Detect semantic drift for a potential highlight
   * @param {Object} highlightData - The highlight data to check
   * @param {string} highlightData.codeId - Code ID to check against
   * @param {string} highlightData.text - The new text passage
   * @param {string} highlightData.documentId - Current document ID
   * @returns {Object} Detection result
   */
  const detectDrift = async (highlightData) => {
    if (!currentUser || !highlightData || !services) {
      return { success: false, error: 'Missing required data for drift detection' };
    }

    setIsDetecting(true);
    try {
      const result = await services.semanticDrift.detectSemanticDrift({
        codeId: highlightData.codeId,
        newPassage: highlightData.text,
        documentId: highlightData.documentId
      });

      if (result.success) {
        if (result.data.drift_detected) {
          // Store the pending highlight and show drift modal
          setPendingHighlight(highlightData);
          setDriftData(result.data);
          setShowDriftModal(true);
          return { success: true, driftDetected: true, data: result.data };
        } else {
          // No drift detected, can proceed with highlight
          return { success: true, driftDetected: false, data: result.data };
        }
      } else {
        console.error('Semantic drift detection failed:', result.error);
        // On failure, allow highlight to proceed (graceful degradation)
        return { success: true, driftDetected: false, error: result.error };
      }
    } catch (error) {
      console.error('Error detecting semantic drift:', error);
      // On error, allow highlight to proceed (graceful degradation)
      return { success: true, driftDetected: false, error: error.message };
    } finally {
      setIsDetecting(false);
    }
  };

  /**
   * Handle refining the code definition
   */
  const handleRefineDefinition = async (newDefinition) => {
    if (!pendingHighlight || !currentUser || !services) {
      return { success: false, error: 'Missing required data' };
    }

    try {
      // Update the code definition
      const codeResult = await services.codes.getCode(pendingHighlight.codeId);
      if (!codeResult.success) {
        return { success: false, error: 'Code not found' };
      }

      const code = codeResult.data;
      const updateResult = await services.codes.updateCode(
        code.docId,
        {
          ...code,
          description: newDefinition
        },
        currentUser.uid
      );

      if (updateResult.success) {
        // Clear drift state but keep pending highlight for application
        setDriftData(null);
        setShowDriftModal(false);
        return { success: true, applyPendingHighlight: true };
      } else {
        return updateResult;
      }
    } catch (error) {
      console.error('Error refining definition:', error);
      return { success: false, error: error.message };
    }
  };

  /**
   * Handle creating a new code (split scenario)
   */
  const handleSplitCode = async (newCodeData) => {
    if (!currentUser || !services) {
      return { success: false, error: 'Missing required data' };
    }

    try {
      // Generate a unique ID for the new code
      const codeId = `code_${Date.now()}_${Math.random().toString(36).substr(2, 9)}`;
      
      const result = await services.codes.addCode(
        {
          id: codeId,
          ...newCodeData
        },
        currentUser.uid
      );

      if (result.success) {
        // Create the updated highlight data
        const updatedHighlight = pendingHighlight ? {
          ...pendingHighlight,
          codeId: codeId,
          code: codeId
        } : null;
        
        if (updatedHighlight) {
          setPendingHighlight(updatedHighlight);
        }
        
        // Clear drift state but keep pending highlight for application
        setDriftData(null);
        setShowDriftModal(false);
        return { 
          success: true, 
          newCodeId: codeId, 
          applyPendingHighlight: true,
          updatedHighlight: updatedHighlight // Pass the updated highlight directly
        };
      } else {
        return result;
      }
    } catch (error) {
      console.error('Error creating new code:', error);
      return { success: false, error: error.message };
    }
  };

  /**
   * Handle applying highlight anyway (ignore drift)
   */
  const handleApplyAnyway = async () => {
    // Clear drift state but keep pending highlight for application
    setDriftData(null);
    setShowDriftModal(false);
    return { success: true, applyPendingHighlight: true };
  };

  /**
   * Close the drift modal and cancel the highlight
   */
  const closeDriftModal = () => {
    setDriftData(null);
    setShowDriftModal(false);
    setPendingHighlight(null);
  };

  /**
   * Get the current pending highlight data (useful for applying after drift resolution)
   */
  const getPendingHighlight = () => {
    return pendingHighlight;
  };

  /**
   * Clear all drift-related state
   */
  const clearDriftState = () => {
    setDriftData(null);
    setShowDriftModal(false);
    setPendingHighlight(null);
    setIsDetecting(false);
  };

  return {
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
  };
};
