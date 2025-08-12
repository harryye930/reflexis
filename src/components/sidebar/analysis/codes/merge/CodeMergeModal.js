import React, { useState, useEffect } from 'react';
import MultiStepModal from '../../../../common/MultiStepModal.js';
import MergeStep1_SelectCodes from './MergeStep1_SelectCodes.js';
import MergeStep2_ChooseStrategy from './MergeStep2_ChooseStrategy.js';
import MergeStep3_ConfigureResult from './MergeStep3_ConfigureResult.js';
import MergeStep4_ReviewMerge from './MergeStep4_ReviewMerge.js';
import MergeStep5_DeleteConfirmation from './MergeStep5_DeleteConfirmation.js';

const CodeMergeModal = ({ 
  allCodes,
  currentUser,
  userProfiles,
  onMergeCodes,
  onClose,
  onMessage,
  isOpen
}) => {
  const [step, setStep] = useState(1);
  const [selectedCodes, setSelectedCodes] = useState([]);
  const [mergeStrategy, setMergeStrategy] = useState('');
  const [resultConfig, setResultConfig] = useState({
    label: '',
    description: '',
    color: 'bg-gray-200',
    textColor: 'text-gray-800'
  });
  const [deleteSourceCodes, setDeleteSourceCodes] = useState(false);
  const [loading, setLoading] = useState(false);

  // Reset when modal opens
  useEffect(() => {
    if (isOpen) {
      setStep(1);
      setSelectedCodes([]);
      setMergeStrategy('');
      setResultConfig({
        label: '',
        description: '',
        color: 'bg-gray-200',
        textColor: 'text-gray-800'
      });
      setDeleteSourceCodes(false);
    }
  }, [isOpen]);

  const handleStrategySelect = (strategy) => {
    setMergeStrategy(strategy);
    
    // Auto-populate result config based on strategy
    if (strategy.startsWith('merge_into_')) {
      const targetCodeId = strategy.replace('merge_into_', '');
      // Target can be any active code, not only selected
      const targetCode = allCodes.find(c => c.id === targetCodeId);
      if (targetCode) {
        setResultConfig({
          label: targetCode.label,
          description: targetCode.description,
          color: targetCode.color,
          textColor: targetCode.textColor
        });
      }
    } else if (strategy === 'create_new') {
      const combinedLabel = selectedCodes.map(c => c.label).join(' + ');
      const combinedDescription = `Merged from: ${selectedCodes.map(c => c.label).join(', ')}. ${selectedCodes.map(c => c.description).join(' ')}`;
      
      setResultConfig({
        label: combinedLabel.length > 20 ? combinedLabel.substring(0, 17) + '...' : combinedLabel,
        description: combinedDescription.length > 200 ? combinedDescription.substring(0, 197) + '...' : combinedDescription,
        color: selectedCodes[0].color,
        textColor: selectedCodes[0].textColor
      });
    }
  };

  const handleNextStep = () => {
    if (step === 1 && selectedCodes.length < 2) {
      onMessage('Please select at least 2 codes to merge', true);
      return;
    }
    if (step === 2 && !mergeStrategy) {
      onMessage('Please select a merge strategy', true);
      return;
    }
    setStep(step + 1);
  };

  const handleMerge = async () => {
    if (!resultConfig.label.trim() || !resultConfig.description.trim()) {
      onMessage('Both label and description are required', true);
      return;
    }

    setLoading(true);
    try {
      const result = await onMergeCodes({
        selectedCodes,
        strategy: mergeStrategy,
        resultConfig,
        deleteSourceCodes,
        userId: currentUser.uid
      });

      if (result.success) {
        const highlightCount = result.highlightsMoved || 0;
        const reflexiveCount = result.reflexiveResponsesMoved || 0;
        let message = 'Codes merged successfully!';
        
        if (highlightCount > 0 || reflexiveCount > 0) {
          const details = [];
          if (highlightCount > 0) {
            details.push(`${highlightCount} highlight${highlightCount !== 1 ? 's' : ''}`);
          }
          if (reflexiveCount > 0) {
            details.push(`${reflexiveCount} reflexive response${reflexiveCount !== 1 ? 's' : ''}`);
          }
          message += ` Transferred: ${details.join(' and ')}.`;
        }
        
        onMessage(message);
        onClose();
      } else {
        onMessage('Failed to merge codes', true);
      }
    } catch (error) {
      console.error('Error merging codes:', error);
      onMessage('Failed to merge codes', true);
    } finally {
      setLoading(false);
    }
  };

  const renderStepContent = () => {
    switch (step) {
      case 1:
        return (
          <MergeStep1_SelectCodes
            allCodes={allCodes}
            selectedCodes={selectedCodes}
            onCodeSelect={setSelectedCodes}
            currentUser={currentUser}
            userProfiles={userProfiles}
          />
        );
      case 2:
        return (
          <MergeStep2_ChooseStrategy
            selectedCodes={selectedCodes}
            allCodes={allCodes}
            mergeStrategy={mergeStrategy}
            onStrategySelect={handleStrategySelect}
          />
        );
      case 3:
        return (
          <MergeStep3_ConfigureResult
            selectedCodes={selectedCodes}
            allCodes={allCodes}
            mergeStrategy={mergeStrategy}
            resultConfig={resultConfig}
            onResultConfigChange={setResultConfig}
          />
        );
      case 4:
        return (
          <MergeStep4_ReviewMerge
            selectedCodes={selectedCodes}
            allCodes={allCodes}
            mergeStrategy={mergeStrategy}
            resultConfig={resultConfig}
          />
        );
      case 5:
        return (
          <MergeStep5_DeleteConfirmation
            selectedCodes={selectedCodes}
            allCodes={allCodes}
            mergeStrategy={mergeStrategy}
            resultConfig={resultConfig}
            deleteSourceCodes={deleteSourceCodes}
            onDeleteChoice={setDeleteSourceCodes}
          />
        );
      default:
        return null;
    }
  };

  const getCustomActions = () => {
    if (step < 5) {
      return (
        <button
          onClick={handleNextStep}
          className="px-4 py-2 bg-blue-600 text-white rounded-md hover:bg-blue-700 transition-colors disabled:opacity-50 disabled:cursor-not-allowed"
          disabled={loading || (step === 1 && selectedCodes.length < 2) || (step === 2 && !mergeStrategy) || (step === 3 && (!resultConfig.label.trim() || !resultConfig.description.trim()))}
        >
          Next
        </button>
      );
    } else {
      return (
        <button
          onClick={handleMerge}
          className="px-4 py-2 bg-green-600 text-white rounded-md hover:bg-green-700 transition-colors flex items-center gap-2 disabled:opacity-50 disabled:cursor-not-allowed"
          disabled={loading}
        >
          {loading && (
            <div className="animate-spin rounded-full h-4 w-4 border-b-2 border-white"></div>
          )}
          Merge Codes
        </button>
      );
    }
  };

  return (
    <MultiStepModal
      title="Merge Codes"
      isOpen={isOpen}
      onClose={onClose}
      currentStep={step}
      totalSteps={5}
      onPreviousStep={() => setStep(step - 1)}
      showPreviousButton={step > 1}
      showNextButton={false} // We handle this with custom actions
      loading={loading}
      customActions={getCustomActions()}
      stepIndicatorColor="blue"
    >
      {renderStepContent()}
    </MultiStepModal>
  );
};

export default CodeMergeModal;
