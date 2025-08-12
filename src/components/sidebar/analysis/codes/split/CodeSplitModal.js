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
        setAvailableCodes(allCodes.filter(c => c.id !== code.id));
        
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

  const handleNextHighlight = () => {
    if (currentHighlightIndex < highlights.length - 1) {
      setCurrentHighlightIndex(prev => prev + 1);
    } else {
      setStep(3);
    }
  };

  const handlePreviousHighlight = () => {
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
    } else {
      setStep(step - 1);
    }
  };

  const handleCompleteSplit = async () => {
    setLoading(true);
    try {
      const transferReflexive = Object.values(reassignments).some(assignment => assignment.transferReflexive);
      
      const result = await onSplitCode({
        type: 'executeSplit',
        sourceCode: selectedCode,
        reassignments,
        transferReflexive,
        forceDeleteSourceCode: deleteSourceCode
      });

      if (result.success) {
        const reassignedCount = Object.keys(reassignments).length;
        const transferredReflexiveCount = result.reflexiveResponsesTransferred || 0;
        
  let message = `Code split completed. ${reassignedCount} highlight${reassignedCount !== 1 ? 's' : ''} reassigned.`;
        
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
            onNextHighlight={handleNextHighlight}
            onPreviousHighlight={handlePreviousHighlight}
            currentUser={currentUser}
            userProfiles={userProfiles}
          />
        );
      case 3:
        return (
          <SplitStep3_ReviewSplit
            selectedCode={selectedCode}
            highlights={highlights}
            reassignments={reassignments}
            availableCodes={availableCodes}
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
        step === 2 && (
          highlightsLoading ||
          (highlights.length > 0 && Object.keys(reassignments).length < highlights.length)
        )
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
