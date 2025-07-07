import React, { useState, useRef, useEffect } from 'react';
import ReflexivePromptPanel from './ReflexivePromptPanel.js';

const ReflexiveModal = ({ 
  modalPosition, 
  selectedCode, 
  selectedText, 
  onComplete,
  onClose,
  currentUser,
  documentId,
  highlightId
}) => {
  const [currentStep, setCurrentStep] = useState('prompts'); // 'prompts' or 'completed'
  const [isSliding, setIsSliding] = useState(false);
  const modalRef = useRef(null);

  const handleComplete = (responses) => {
    setIsSliding(true);
    setTimeout(() => {
      setCurrentStep('completed');
      setIsSliding(false);
      onComplete(responses);
    }, 300);
  };

  const handleBack = () => {
    setIsSliding(true);
    setTimeout(() => {
      setCurrentStep('prompts');
      setIsSliding(false);
    }, 300);
  };

  // Disabled click-outside handling to prevent accidental closure during reflexive process
  // Users must use cancel button to close for better UX
  // useEffect(() => {
  //   const handleClickOutside = (event) => {
  //     if (modalRef.current && !modalRef.current.contains(event.target)) {
  //       onClose();
  //     }
  //   };

  //   document.addEventListener('mousedown', handleClickOutside);
  //   return () => document.removeEventListener('mousedown', handleClickOutside);
  // }, [onClose]);

  return (
    <div
      ref={modalRef}
      className="fixed z-[200] reflexive-modal"
      style={{ 
        left: modalPosition.x, 
        top: modalPosition.y,
        transform: 'translateX(-50%)'
      }}
    >
      <div className={`bg-white/95 backdrop-blur-sm rounded-xl shadow-2xl border border-gray-100/50 overflow-hidden transition-all duration-400 cubic-bezier(0.23, 1, 0.32, 1) ${isSliding ? 'transform scale-95 opacity-50' : 'transform scale-100 opacity-100'}`}>
        {currentStep === 'prompts' && (
          <ReflexivePromptPanel
            selectedCode={selectedCode}
            selectedText={selectedText}
            currentUser={currentUser}
            documentId={documentId}
            highlightId={highlightId}
            onComplete={handleComplete}
            onClose={onClose}
          />
        )}
        
        {currentStep === 'completed' && (
          <div className="p-6 text-center max-w-md">
            <div className="mb-4">
              <div className="w-16 h-16 mx-auto bg-green-100 rounded-full flex items-center justify-center mb-4 transition-all duration-300 hover:bg-green-200">
                <svg className="w-8 h-8 text-green-600" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M5 13l4 4L19 7" />
                </svg>
              </div>
              <h3 className="text-lg font-semibold text-gray-900 mb-2">
                Reflexive Process Complete
              </h3>
              <p className="text-sm text-gray-600">
                Your reflective insights have been captured and will inform deeper analysis.
              </p>
            </div>
            
            <div className="flex gap-3 justify-center">
              <button
                onClick={handleBack}
                className="px-4 py-2 text-sm text-gray-600 hover:text-gray-800 font-medium transition-all duration-200 hover:bg-gray-50 rounded-lg"
              >
                Review Responses
              </button>
              <button
                onClick={onClose}
                className="px-4 py-2 bg-blue-500 text-white text-sm font-medium rounded-lg hover:bg-blue-600 transition-all duration-200 transform hover:scale-105"
              >
                Continue Coding
              </button>
            </div>
          </div>
        )}
      </div>
      
      {/* Enhanced triangle pointer */}
      <div 
        className="absolute left-1/2 transform -translate-x-1/2"
        style={{ top: '-8px' }}
      >
        <div className="w-0 h-0 border-l-4 border-r-4 border-b-8 border-transparent border-b-white/95" />
      </div>
    </div>
  );
};

export default ReflexiveModal;
