import React, { useState } from 'react';
import MultiStepModal from '../common/MultiStepModal.js';
import CodeForm from '../sidebar/analysis/codes/CodeForm.js';
import CodeChip from '../common/CodeChip.js';

const CodeDriftModal = ({ 
  isOpen,
  onClose,
  driftData,
  pendingHighlight,
  onRefineDefinition,
  onSplitCode,
  onApplyAnyway,
  onMessage,
  allCodes,
  currentUser,
  onApplyPendingHighlight,
  onUpdateCode
}) => {
  const [step, setStep] = useState(1);
  const [selectedAction, setSelectedAction] = useState(null);
  const [loading, setLoading] = useState(false);

  // Reset state when modal opens
  React.useEffect(() => {
    if (isOpen && driftData) {
      setStep(1);
      setSelectedAction(null);
      setLoading(false);
    }
  }, [isOpen, driftData]);

  if (!driftData) return null;

  // Get the current code being modified
  const getCurrentCode = () => {
    if (!pendingHighlight?.codeId || !allCodes) return null;
    return allCodes.find(code => code.id === pendingHighlight.codeId);
  };

  const currentCode = getCurrentCode();

  const handleActionSelect = (action) => {
    setSelectedAction(action);
    // Don't automatically advance steps - let user click Continue
  };

  const handleNextStep = () => {
    if (step === 1 && selectedAction) {
      if (selectedAction === 'apply_anyway') {
        // Execute apply anyway immediately
        handleApplyAnyway();
        return;  
      }
      setStep(2);
    }
  };

  const handlePreviousStep = () => {
    if (step > 1) {
      setStep(step - 1);
    }
  };

  const getTotalSteps = () => {
    if (!selectedAction) return 2; // Default
    if (selectedAction === 'apply_anyway') return 1; // Single step
    return 2; // refine_definition and create_new_code both have 2 steps
  };

  const handleApplyAnyway = async () => {
    setLoading(true);
    try {
      const result = await onApplyAnyway();
      if (result.success) {
        onMessage('Highlight applied despite conceptual drift');

        // Apply pending highlight if requested
        if (result.applyPendingHighlight && onApplyPendingHighlight) {
          try {
            const applyResult = await onApplyPendingHighlight();
            onMessage(applyResult.success 
              ? 'Highlight applied successfully!' 
              : 'Failed to apply highlight', !applyResult.success);
          } catch (applyError) {
            onMessage('Failed to apply highlight', true);
          }
        }
        
        onClose();
      } else {
        onMessage('Failed to apply highlight', true);
      }
    } catch (error) {
      console.error('Error applying highlight:', error);
      onMessage('Failed to apply highlight', true);
    } finally {
      setLoading(false);
    }
  };

  const renderStepContent = () => {
    switch (step) {
      case 1:
        return (
          <div className="space-y-6">
            {/* Context Section - Show attempted coded text and applied code */}
            <div className="bg-gray-50 border border-gray-200 rounded-lg p-4">
              <div className="space-y-3">
                <h4 className="font-medium text-gray-800 text-sm">Attempted Coding Context</h4>
                
                {/* Selected Text */}
                <div>
                  <p className="text-xs text-gray-600 mb-1 font-medium">Selected Text:</p>
                  <div className="bg-white border border-gray-200 rounded p-3 text-sm text-gray-900 leading-relaxed">
                    &ldquo;{pendingHighlight?.text || 'No text selected'}&rdquo;
                  </div>
                </div>

                {/* Applied Code */}
                <div>
                  <p className="text-xs text-gray-600 mb-2 font-medium">Attempted to Apply Code:</p>
                  <div className="flex items-center gap-2">
                    {currentCode ? (
                      <CodeChip 
                        code={currentCode} 
                        size="sm" 
                        variant="unified"
                        showTooltip={true}
                      />
                    ) : (
                      <span className="text-sm text-gray-500 italic">Code not found</span>
                    )}
                  </div>
                  {currentCode?.description && (
                    <p className="text-xs text-gray-600 mt-1 italic">
                      &ldquo;{currentCode.description}&rdquo;
                    </p>
                  )}
                </div>
              </div>
            </div>

            {/* Drift Detection Alert */}
            <div className="bg-amber-50 border border-amber-200 rounded-lg p-4">
              <div className="flex items-center gap-2 mb-2">
                <svg className="w-5 h-5 text-amber-600" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 9v2m0 4h.01m-6.938 4h13.856c1.54 0 2.502-1.667 1.732-2.5L13.732 4c-.77-.833-1.964-.833-2.732 0L3.732 16.5c-.77.833.192 2.5 1.732 2.5z" />
                </svg>
                <h3 className="font-semibold text-amber-800">Conceptual Drift Detected While Coding</h3>
              </div>
              <p className="text-sm text-amber-700 mb-3" style={{ whiteSpace: 'pre-line' }}>
                {driftData.explanation}
              </p>
            </div>

            {/* Action Options */}
            <div className="space-y-3">
              <h4 className="font-medium text-gray-800">How would you like to proceed?</h4>
              
              <div className="space-y-2">
                <div
                  onClick={() => handleActionSelect('refine_definition')}
                  className={`w-full p-4 rounded-lg border-2 cursor-pointer transition-all ${
                    selectedAction === 'refine_definition' 
                      ? 'border-blue-500 bg-blue-50' 
                      : 'border-gray-200 hover:border-gray-300 hover:bg-gray-50'
                  }`}
                >
                  <div className="flex items-center gap-3">
                    <div 
                      className={`w-4 h-4 rounded-full border-2 ${
                        selectedAction === 'refine_definition'
                          ? 'border-blue-500 bg-blue-500'
                          : 'border-gray-300'
                      }`}
                    >
                      {selectedAction === 'refine_definition' && (
                        <div className="w-2 h-2 bg-white rounded-full m-0.5"></div>
                      )}
                    </div>
                    <div className="w-10 h-10 bg-blue-100 rounded-full flex items-center justify-center">
                      <svg className="w-5 h-5 text-blue-600" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                        <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M11 5H6a2 2 0 00-2 2v11a2 2 0 002 2h11a2 2 0 002-2v-5m-1.414-9.414a2 2 0 112.828 2.828L11.828 15H9v-2.828l8.586-8.586z" />
                      </svg>
                    </div>
                    <div>
                      <h5 className="font-medium text-gray-900">Refine Definition</h5>
                      <p className="text-sm text-gray-600">Update the existing code definition to be more inclusive</p>
                    </div>
                  </div>
                </div>

                <div
                  onClick={() => handleActionSelect('create_new_code')}
                  className={`w-full p-4 rounded-lg border-2 cursor-pointer transition-all ${
                    selectedAction === 'create_new_code' 
                      ? 'border-green-500 bg-green-50' 
                      : 'border-gray-200 hover:border-gray-300 hover:bg-gray-50'
                  }`}
                >
                  <div className="flex items-center gap-3">
                    <div 
                      className={`w-4 h-4 rounded-full border-2 ${
                        selectedAction === 'create_new_code'
                          ? 'border-green-500 bg-green-500'
                          : 'border-gray-300'
                      }`}
                    >
                      {selectedAction === 'create_new_code' && (
                        <div className="w-2 h-2 bg-white rounded-full m-0.5"></div>
                      )}
                    </div>
                    <div className="w-10 h-10 bg-green-100 rounded-full flex items-center justify-center">
                      <svg className="w-5 h-5 text-green-600" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                        <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 6v6m0 0v6m0-6h6m-6 0H6" />
                      </svg>
                    </div>
                    <div>
                      <h5 className="font-medium text-gray-900">Create New Code</h5>
                      <p className="text-sm text-gray-600">Split into a new, separate code for this concept</p>
                    </div>
                  </div>
                </div>

                <div
                  onClick={() => handleActionSelect('apply_anyway')}
                  className={`w-full p-4 rounded-lg border-2 cursor-pointer transition-all ${
                    selectedAction === 'apply_anyway' 
                      ? 'border-orange-500 bg-orange-50' 
                      : 'border-gray-200 hover:border-gray-300 hover:bg-gray-50'
                  }`}
                >
                  <div className="flex items-center gap-3">
                    <div 
                      className={`w-4 h-4 rounded-full border-2 ${
                        selectedAction === 'apply_anyway'
                          ? 'border-orange-500 bg-orange-500'
                          : 'border-gray-300'
                      }`}
                    >
                      {selectedAction === 'apply_anyway' && (
                        <div className="w-2 h-2 bg-white rounded-full m-0.5"></div>
                      )}
                    </div>
                    <div className="w-10 h-10 bg-orange-100 rounded-full flex items-center justify-center">
                      <svg className="w-5 h-5 text-orange-600" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                        <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M13 10V3L4 14h7v7l9-11h-7z" />
                      </svg>
                    </div>
                    <div>
                      <h5 className="font-medium text-gray-900">Apply Anyway</h5>
                      <p className="text-sm text-gray-600">Proceed with the original code despite the drift</p>
                    </div>
                  </div>
                </div>
              </div>
            </div>
          </div>
        );

      case 2:
        if (selectedAction === 'refine_definition') {
          return (
            <div className="space-y-4">
              <h4 className="font-medium text-gray-800">Refine Code Definition</h4>
              
              {/* Show AI suggestion */}
              <div className="bg-blue-50 border border-blue-200 rounded-lg p-4">
                <div className="flex items-start gap-2">
                  <svg className="w-5 h-5 text-blue-600 mt-0.5 flex-shrink-0" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9.663 17h4.673M12 3v1m6.364 1.636l-.707.707M21 12h-1M4 12H3m3.343-5.657l-.707-.707m2.828 9.9a5 5 0 117.072 0l-.548.547A3.374 3.374 0 0014 18.469V19a2 2 0 11-4 0v-.531c0-.895-.356-1.754-.988-2.386l-.548-.547z" />
                  </svg>
                  <div>
                    <h5 className="font-medium text-blue-800 mb-1">AI Suggestion</h5>
                    <p className="text-sm text-blue-700">
                      {driftData.suggested_definition}
                    </p>
                  </div>
                </div>
              </div>

              <CodeForm
                editingCode={currentCode}
                onSubmit={async (formData) => {
                  setLoading(true);
                  try {
                    // Always update the full code data (label, description, color, etc.)
                    const result = await onUpdateCode(currentCode.docId, formData);
                    if (result.success) {
                      onMessage('Code updated successfully!');
                      
                      // Apply pending highlight after successful code update
                      if (onApplyPendingHighlight) {
                        try {
                          const applyResult = await onApplyPendingHighlight();
                          onMessage(applyResult.success 
                            ? 'Code updated and highlight applied successfully!' 
                            : 'Code updated, but failed to apply highlight', !applyResult.success);
                        } catch (applyError) {
                          onMessage('Code updated, but failed to apply highlight', true);
                        }
                      }
                      
                      onClose();
                    }
                    return result;
                  } catch (error) {
                    console.error('Error updating code:', error);
                    return { success: false, error: error.message };
                  } finally {
                    setLoading(false);
                  }
                }}
                onCancel={() => {
                  // Don't close the modal, just reset to step 1
                  setStep(1);
                  setSelectedAction(null);
                }}
                onMessage={onMessage}
              />
            </div>
          );
        }

        if (selectedAction === 'create_new_code') {
          return (
            <div className="space-y-4">
              <h4 className="font-medium text-gray-800">Create New Code</h4>
              <CodeForm
                editingCode={null}
                onSubmit={async (formData) => {
                  setLoading(true);
                  try {
                    const result = await onSplitCode(formData);
                    if (result.success) {
                      onMessage('New code created successfully!');
                      
                      // Apply pending highlight if requested
                      if (result.applyPendingHighlight && onApplyPendingHighlight) {
                        try {
                          const applyResult = await onApplyPendingHighlight(result.updatedHighlight);
                          onMessage(applyResult.success 
                            ? 'New code created and highlight applied successfully!' 
                            : 'New code created, but failed to apply highlight', !applyResult.success);
                        } catch (applyError) {
                          onMessage('New code created, but failed to apply highlight', true);
                        }
                      }
                      
                      onClose();
                    }
                    return result;
                  } catch (error) {
                    console.error('Error creating new code:', error);
                    return { success: false, error: error.message };
                  } finally {
                    setLoading(false);
                  }
                }}
                onCancel={() => {
                  // Don't close the modal, just reset to step 1
                  setStep(1);
                  setSelectedAction(null);
                }}
                onMessage={onMessage}
              />
            </div>
          );
        }

        return null;

      default:
        return null;
    }
  };

  const getCustomActions = () => {
    if (step === 1) {
      return (
        <button
          onClick={handleNextStep}
          className="px-4 py-2 bg-amber-600 text-white rounded-md hover:bg-amber-700 transition-colors"
          disabled={!selectedAction || loading}
        >
          {selectedAction === 'apply_anyway' ? 'Apply Anyway' : 'Continue'}
        </button>
      );
    }

    // For step 2, both refine_definition and create_new_code use CodeForm which handles its own buttons
    return null;
  };

  return (
    <MultiStepModal
      title="Code Drift Detected"
      isOpen={isOpen}
      onClose={onClose}
      currentStep={step}
      totalSteps={getTotalSteps()}
      onPreviousStep={handlePreviousStep}
      onNextStep={handleNextStep}
      showPreviousButton={step > 1}
      showNextButton={false} // We handle this with custom actions
      loading={loading}
      customActions={getCustomActions()}
      stepIndicatorColor="amber"
    >
      {renderStepContent()}
    </MultiStepModal>
  );
};

export default CodeDriftModal;
