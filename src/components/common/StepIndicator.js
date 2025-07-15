import React from 'react';

const StepIndicator = ({ 
  currentStep, 
  totalSteps, 
  color = "orange" 
}) => {
  return (
    <div className="flex items-center justify-center mb-6">
      {Array.from({ length: totalSteps }, (_, index) => {
        const stepNum = index + 1;
        return (
          <div key={stepNum} className="flex items-center">
            <div 
              className={`w-8 h-8 rounded-full flex items-center justify-center text-sm font-medium ${
                currentStep >= stepNum 
                  ? `bg-${color}-600 text-white` 
                  : 'bg-gray-200 text-gray-600'
              }`}
            >
              {stepNum}
            </div>
            {stepNum < totalSteps && (
              <div 
                className={`w-8 h-1 mx-2 ${
                  currentStep > stepNum ? `bg-${color}-600` : 'bg-gray-200'
                }`}
              />
            )}
          </div>
        );
      })}
    </div>
  );
};

export default StepIndicator;
