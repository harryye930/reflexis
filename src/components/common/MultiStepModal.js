import React from 'react';
import StepIndicator from './StepIndicator.js';

const MultiStepModal = ({ 
  title,
  isOpen,
  onClose,
  children,
  currentStep,
  totalSteps,
  onPreviousStep,
  onNextStep,
  onCancel,
  nextButtonText = "Next",
  previousButtonText = "Back",
  showPreviousButton = true,
  showNextButton = true,
  nextButtonDisabled = false,
  loading = false,
  customActions = null,
  stepIndicatorColor = "orange"
}) => {
  if (!isOpen) return null;

  return (
    <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50">
      <div className="bg-white rounded-lg p-6 w-full max-w-2xl max-h-[90vh] overflow-y-auto">
        {/* Header */}
        <div className="flex items-center justify-between mb-4">
          <h2 className="text-xl font-bold text-gray-900">{title}</h2>
          <button
            onClick={onClose}
            className="text-gray-400 hover:text-gray-600 transition-colors"
            disabled={loading}
          >
            <svg className="w-6 h-6" fill="none" stroke="currentColor" viewBox="0 0 24 24">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M6 18L18 6M6 6l12 12" />
            </svg>
          </button>
        </div>

        {/* Step Indicator */}
        <StepIndicator 
          currentStep={currentStep} 
          totalSteps={totalSteps} 
          color={stepIndicatorColor}
        />

        {/* Step Content */}
        <div className="mb-6">
          {children}
        </div>

        {/* Action Buttons */}
        <div className="flex justify-between pt-6 border-t">
          <div>
            {showPreviousButton && currentStep > 1 && (
              <button
                onClick={onPreviousStep}
                className="px-4 py-2 text-gray-600 hover:text-gray-800 transition-colors"
                disabled={loading}
              >
                {previousButtonText}
              </button>
            )}
          </div>
          
          <div className="flex gap-2">
            <button
              onClick={onCancel || onClose}
              className="px-4 py-2 text-gray-600 hover:text-gray-800 transition-colors"
              disabled={loading}
            >
              Cancel
            </button>
            
            {customActions || (
              showNextButton && (
                <button
                  onClick={onNextStep}
                  className={`px-4 py-2 bg-${stepIndicatorColor}-600 text-white rounded-md hover:bg-${stepIndicatorColor}-700 transition-colors flex items-center gap-2 disabled:opacity-50 disabled:cursor-not-allowed disabled:hover:bg-${stepIndicatorColor}-600`}
                  disabled={loading || nextButtonDisabled}
                >
                  {loading && (
                    <div className="animate-spin rounded-full h-4 w-4 border-b-2 border-white"></div>
                  )}
                  {nextButtonText}
                </button>
              )
            )}
          </div>
        </div>
      </div>
    </div>
  );
};

export default MultiStepModal;
