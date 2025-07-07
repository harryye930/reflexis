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
      className="fixed z-[200] reflexive-modal animate-reflexive-entrance"
      style={{ 
        left: modalPosition.x, 
        top: modalPosition.y,
        transform: 'translateX(-50%)'
      }}
    >
      <div className={`bg-gradient-to-br from-slate-50/90 via-white/85 to-blue-50/90 backdrop-blur-md rounded-2xl shadow-[0_20px_60px_rgba(0,0,0,0.15)] border border-white/60 overflow-hidden transition-all duration-700 ease-[cubic-bezier(0.19,1,0.22,1)] ${isSliding ? 'transform scale-98 opacity-60 rotate-0.5' : 'transform scale-100 opacity-100 rotate-0'}`}>
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
          <div className="p-8 text-center max-w-md bg-gradient-to-br from-emerald-50/80 via-white/90 to-teal-50/80">
            <div className="mb-6">
              <div className="w-20 h-20 mx-auto bg-gradient-to-br from-emerald-100/80 to-teal-100/80 rounded-full flex items-center justify-center mb-6 transition-all duration-500 hover:shadow-lg hover:scale-105 animate-gentle-pulse backdrop-blur-sm border border-emerald-200/40">
                <svg className="w-9 h-9 text-emerald-600" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={1.5} d="M5 13l4 4L19 7" />
                </svg>
              </div>
              <h3 className="text-xl font-light text-slate-800 mb-3 tracking-wide">
                Reflexive Journey <span className="font-medium text-emerald-700">Complete</span>
              </h3>
              <p className="text-sm text-slate-600 leading-relaxed font-light">
                Your contemplative insights have been woven into the analytical tapestry, <br/>
                enriching the depth of understanding.
              </p>
            </div>
            
            <div className="flex gap-4 justify-center">
              <button
                onClick={handleBack}
                className="px-5 py-2.5 text-sm text-slate-600 hover:text-slate-800 font-light transition-all duration-300 hover:bg-slate-50/80 rounded-xl backdrop-blur-sm border border-slate-200/50 hover:border-slate-300/60 hover:shadow-sm"
              >
                Revisit Reflections
              </button>
              <button
                onClick={onClose}
                className="px-6 py-2.5 bg-gradient-to-r from-emerald-500/90 to-teal-500/90 text-white text-sm font-light rounded-xl hover:from-emerald-600/95 hover:to-teal-600/95 transition-all duration-300 transform hover:scale-102 backdrop-blur-sm border border-white/20 shadow-lg hover:shadow-xl"
              >
                Return to Analysis
              </button>
            </div>
          </div>
        )}
      </div>
      
      {/* Contemplative triangle pointer with subtle glow */}
      <div 
        className="absolute left-1/2 transform -translate-x-1/2"
        style={{ top: '-10px' }}
      >
        <div className="w-0 h-0 border-l-5 border-r-5 border-b-10 border-transparent border-b-slate-50/90 filter drop-shadow-sm" />
        <div className="absolute top-1 left-1/2 transform -translate-x-1/2 w-0 h-0 border-l-3 border-r-3 border-b-6 border-transparent border-b-white/80" />
      </div>
    </div>
  );
};

export default ReflexiveModal;
