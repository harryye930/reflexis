import React, { useState, useEffect } from 'react';
import MultiStepModal from '../../../../common/MultiStepModal.js';
import SplitStep1_SelectCode from './SplitStep1_SelectCode.js';
import SplitStep2_ReviewHighlights from './SplitStep2_ReviewHighlights.js';
import SplitStep3_ReviewSplit from './SplitStep3_ReviewSplit.js';
import SplitStep4_DeleteConfirmation from './SplitStep4_DeleteConfirmation.js';

const CodeSplitModal = ({ 
  allCodes,
  currentUser,
  userProfiles,
  onSplitCode,
  onClose,
  onMessage,
  isOpen
}) => {
  const [step, setStep] = useState(1);
  const [selectedCode, setSelectedCode] = useState(null);
  const [highlights, setHighlights] = useState([]);
  const [highlightsLoading, setHighlightsLoading] = useState(false);
  const [currentHighlightIndex, setCurrentHighlightIndex] = useState(0);
  const [reassignments, setReassignments] = useState({});
  const [loading, setLoading] = useState(false);
  const [availableCodes, setAvailableCodes] = useState([]);
  const [highlightReflexiveCounts, setHighlightReflexiveCounts] = useState({});
  const [deleteSourceCode, setDeleteSourceCode] = useState(false);
  const [newCodes, setNewCodes] = useState([]); // Track new codes to be created
  const [showCodeForm, setShowCodeForm] = useState(false);
  const [pendingCodeCreations, setPendingCodeCreations] = useState({}); // Map of temp IDs to code configs

  // Reset when modal opens
  useEffect(() => {
    if (isOpen) {
      setStep(1);
      setSelectedCode(null);
      setHighlights([]);
      setCurrentHighlightIndex(0);
      setReassignments({});
      setHighlightReflexiveCounts({});
      setDeleteSourceCode(false);
      setNewCodes([]);
      setShowCodeForm(false);
      setPendingCodeCreations({});
    }
  }, [isOpen]);

  const handleCodeSelection = async (code) => {
    setSelectedCode(code);
    setHighlightsLoading(true);
    
    try {
      const result = await onSplitCode({
        type: 'getHighlights',
        codeId: code.id
      });
      
      if (result.success) {
        setHighlights(result.highlights);
        // Initialize available codes with existing codes (excluding the selected one) plus any pending new codes
        const existingCodes = allCodes.filter(c => c.id !== code.id);
        const pendingCodes = Object.values(pendingCodeCreations);
        setAvailableCodes([...existingCodes, ...pendingCodes]);
        
        // Check reflexive count for each highlight
        const reflexiveCounts = {};
        for (const highlight of result.highlights) {
          try {
            const reflexiveResult = await onSplitCode({
              type: 'getReflexiveCount',
              highlightId: highlight.id,
              codeId: code.id
            });
            if (reflexiveResult.success) {
              reflexiveCounts[highlight.id] = reflexiveResult.count;
            }
          } catch (error) {
            console.warn(`Failed to get reflexive count for highlight ${highlight.id}:`, error);
            reflexiveCounts[highlight.id] = 0;
          }
        }
        setHighlightReflexiveCounts(reflexiveCounts);
        setStep(2);
      } else {
        onMessage('Failed to load highlights for this code', true);
      }
    } catch (error) {
      console.error('Error loading highlights:', error);
      onMessage('Failed to load highlights for this code', true);
    } finally {
      setHighlightsLoading(false);
    }
  };

  const handleHighlightReassignment = (highlightId, newCodeId, transferReflexiveForThisHighlight = false) => {
    setReassignments(prev => ({
      ...prev,
      [highlightId]: {
        newCodeId,
        transferReflexive: transferReflexiveForThisHighlight
      }
    }));
  };

  const handleCreateNewCode = async (formData) => {
    // Don't create the actual code yet - just store the configuration
    const tempId = `temp_${Date.now()}_${Math.random().toString(36).substr(2, 9)}`;
    const pendingCode = {
      id: tempId,
      label: formData.label,
      description: formData.description,
      color: formData.color,
      textColor: formData.textColor,
      userId: currentUser.uid,
      isPending: true // Mark as pending creation
    };

    // Add to pending creations
    setPendingCodeCreations(prev => ({
      ...prev,
      [tempId]: pendingCode
    }));

    // Add to available codes for UI
    setAvailableCodes(prev => [...prev, pendingCode]);
    
    // Automatically assign this new code to the current highlight
    const currentHighlight = highlights[currentHighlightIndex];
    if (currentHighlight) {
      setReassignments(prev => ({
        ...prev,
        [currentHighlight.id]: {
          newCodeId: tempId,
          transferReflexive: false
        }
      }));
    }
    
    setShowCodeForm(false);
    onMessage('New code will be created when split is completed');
    
    // Automatically proceed to next highlight if there are any more to review
    handleNextHighlight();
    
    return { success: true, code: pendingCode };
  };

  const handleSkipHighlight = (highlightId) => {
    setReassignments(prev => {
      const updated = { ...prev };
      delete updated[highlightId];
      return updated;
    });
  };

  const handleNextHighlight = () => {
    // Close code form when navigating to next highlight
    setShowCodeForm(false);
    
    if (currentHighlightIndex < highlights.length - 1) {
      setCurrentHighlightIndex(prev => prev + 1);
    } else {
      setStep(3);
    }
  };

  const handlePreviousHighlight = () => {
    // Close code form when navigating to previous highlight
    setShowCodeForm(false);
    
    if (currentHighlightIndex > 0) {
      setCurrentHighlightIndex(prev => prev - 1);
    }
  };

  const handleNextStep = () => {
    if (step === 1 && selectedCode && !highlightsLoading) {
      handleCodeSelection(selectedCode);
    } else {
      setStep(step + 1);
    }
  };

  const handlePreviousStep = () => {
    if (step === 3) {
      setStep(2);
      setCurrentHighlightIndex(highlights.length - 1);
      // Ensure available codes includes all pending codes when returning to step 2
      const existingCodes = allCodes.filter(c => c.id !== selectedCode?.id);
      const pendingCodes = Object.values(pendingCodeCreations);
      setAvailableCodes([...existingCodes, ...pendingCodes]);
    } else if (step === 2) {
      setStep(1);
    } else {
      setStep(step - 1);
    }
  };

  const handleCompleteSplit = async () => {
    setLoading(true);
    try {
      // First, create any pending codes
      const createdCodeMap = {}; // Maps temp IDs to real IDs
      
      for (const [tempId, codeConfig] of Object.entries(pendingCodeCreations)) {
        try {
          const result = await onSplitCode({
            type: 'createCode',
            codeData: {
              label: codeConfig.label,
              description: codeConfig.description,
              color: codeConfig.color,
              textColor: codeConfig.textColor,
              userId: currentUser.uid
            }
          });
          
          if (result.success) {
            createdCodeMap[tempId] = result.code.id;
          } else {
            onMessage(`Failed to create code "${codeConfig.label}"`, true);
            return;
          }
        } catch (error) {
          console.error(`Error creating code "${codeConfig.label}":`, error);
          onMessage(`Failed to create code "${codeConfig.label}"`, true);
          return;
        }
      }

      // Update reassignments to use real code IDs instead of temp IDs
      const updatedReassignments = { ...reassignments };
      const targetCodesInfo = []; // Collect target code information for history
      
      for (const [highlightId, assignment] of Object.entries(updatedReassignments)) {
        if (createdCodeMap[assignment.newCodeId]) {
          // This was a newly created code
          const originalTempId = assignment.newCodeId;
          const realCodeId = createdCodeMap[originalTempId];
          const codeConfig = pendingCodeCreations[originalTempId];
          
          updatedReassignments[highlightId] = {
            ...assignment,
            newCodeId: realCodeId
          };
          
          // Add to target codes info for history
          if (!targetCodesInfo.find(c => c.id === realCodeId)) {
            targetCodesInfo.push({
              id: realCodeId,
              label: codeConfig.label,
              description: codeConfig.description,
              color: codeConfig.color,
              textColor: codeConfig.textColor
            });
          }
        } else {
          // This is an existing code - get its info for history
          const existingCode = allCodes.find(c => c.id === assignment.newCodeId);
          if (existingCode && !targetCodesInfo.find(c => c.id === existingCode.id)) {
            targetCodesInfo.push({
              id: existingCode.id,
              label: existingCode.label,
              description: existingCode.description,
              color: existingCode.color,
              textColor: existingCode.textColor
            });
          }
        }
      }

      const transferReflexive = Object.values(updatedReassignments).some(assignment => assignment.transferReflexive);
      
      const result = await onSplitCode({
        type: 'executeSplit',
        sourceCode: selectedCode,
        reassignments: updatedReassignments,
        transferReflexive,
        forceDeleteSourceCode: deleteSourceCode,
        targetCodesInfo // Pass target code info for accurate history recording
      });

      if (result.success) {
        const reassignedCount = Object.keys(updatedReassignments).length;
        const transferredReflexiveCount = result.reflexiveResponsesTransferred || 0;
        const createdCodesCount = Object.keys(createdCodeMap).length;
        
        let message;
        if (reassignedCount === 0) {
          message = 'Code split completed. No highlights were reassigned.';
        } else {
          message = `Code split completed. ${reassignedCount} highlight${reassignedCount !== 1 ? 's' : ''} reassigned.`;
        }
        
        if (createdCodesCount > 0) {
          message += ` ${createdCodesCount} new code${createdCodesCount !== 1 ? 's' : ''} created.`;
        }
        
        if (transferredReflexiveCount > 0) {
          message += ` ${transferredReflexiveCount} reflexive response${transferredReflexiveCount !== 1 ? 's' : ''} transferred.`;
        }
        
        if (result.codeDeleted) {
          message += ' Original code was deleted.';
        } else if (deleteSourceCode && !result.codeDeleted) {
          message += ' Original code was kept due to remaining highlights.';
        } else {
          message += ' Original code was kept.';
        }
        
        onMessage(message);
        onClose();
      } else {
        onMessage('Failed to split code', true);
      }
    } catch (error) {
      console.error('Error splitting code:', error);
      onMessage('Failed to split code', true);
    } finally {
      setLoading(false);
    }
  };

  const renderStepContent = () => {
    switch (step) {
      case 1:
        return (
          <SplitStep1_SelectCode
            allCodes={allCodes}
            selectedCode={selectedCode}
            onCodeSelect={setSelectedCode}
            currentUser={currentUser}
            userProfiles={userProfiles}
          />
        );
      case 2:
        return (
          <SplitStep2_ReviewHighlights
            selectedCode={selectedCode}
            highlights={highlights}
            currentHighlightIndex={currentHighlightIndex}
            reassignments={reassignments}
            availableCodes={availableCodes}
            highlightReflexiveCounts={highlightReflexiveCounts}
            onHighlightReassignment={handleHighlightReassignment}
            onSkipHighlight={handleSkipHighlight}
            onCreateNewCode={() => setShowCodeForm(true)}
            showCodeForm={showCodeForm}
            onCreateCodeSubmit={handleCreateNewCode}
            onCreateCodeCancel={() => {
              setShowCodeForm(false);
              // If there's no assignment for current highlight, default to skip
              const currentHighlight = highlights[currentHighlightIndex];
              if (currentHighlight && !reassignments[currentHighlight.id]) {
                // This will automatically set it to skip (no assignment)
              }
            }}
            onMessage={onMessage}
            onNextHighlight={handleNextHighlight}
            onPreviousHighlight={handlePreviousHighlight}
            currentUser={currentUser}
            userProfiles={userProfiles}
            pendingCodeCreations={pendingCodeCreations}
          />
        );
      case 3:
        return (
          <SplitStep3_ReviewSplit
            selectedCode={selectedCode}
            highlights={highlights}
            reassignments={reassignments}
            availableCodes={availableCodes}
            pendingCodeCreations={pendingCodeCreations}
          />
        );
      case 4:
        return (
          <SplitStep4_DeleteConfirmation
            selectedCode={selectedCode}
            highlights={highlights}
            reassignments={reassignments}
            deleteSourceCode={deleteSourceCode}
            onDeleteChoice={setDeleteSourceCode}
            pendingCodeCreations={pendingCodeCreations}
          />
        );
      default:
        return null;
    }
  };

  const getCustomActions = () => {
    if (step === 1 && selectedCode && !highlightsLoading) {
      return (
        <button
          onClick={() => handleCodeSelection(selectedCode)}
          className="px-4 py-2 bg-orange-600 text-white rounded-md hover:bg-orange-700 transition-colors"
        >
          Continue
        </button>
      );
    }
    
    if (step === 3) {
      return (
        <button
          onClick={() => setStep(4)}
          className="px-4 py-2 bg-orange-600 text-white rounded-md hover:bg-orange-700 transition-colors"
          disabled={Object.keys(reassignments).length === 0}
        >
          Next
        </button>
      );
    }
    
    if (step === 4) {
      return (
        <button
          onClick={handleCompleteSplit}
          className="px-4 py-2 bg-orange-600 text-white rounded-md hover:bg-orange-700 transition-colors flex items-center gap-2"
          disabled={loading}
        >
          {loading && (
            <div className="animate-spin rounded-full h-4 w-4 border-b-2 border-white"></div>
          )}
          Complete Split
        </button>
      );
    }

    return null;
  };

  return (
    <MultiStepModal
      title="Split Code"
      isOpen={isOpen}
      onClose={onClose}
      currentStep={step}
      totalSteps={4}
      onPreviousStep={handlePreviousStep}
      onNextStep={handleNextStep}
      showNextButton={step === 2}
      nextButtonDisabled={
        step === 2 && highlightsLoading
      }
      showPreviousButton={step > 1}
      loading={loading}
      customActions={getCustomActions()}
      stepIndicatorColor="orange"
    >
      {renderStepContent()}
    </MultiStepModal>
  );
};

export default CodeSplitModal;
