import React, { useState, useRef, useEffect } from 'react';
import Draggable from 'react-draggable';
import ReflexivePromptPanel from './ReflexivePromptPanel.js';
import StrategySelector from '../common/StrategySelector.js';
import { REFLEXIVE_PROMPTS, PROMPT_SEQUENCE } from '../../constants/reflexivePrompts.js';

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
  const [currentStep, setCurrentStep] = useState('select'); // 'select' | 'prompts' | 'completed'
  const [isSliding, setIsSliding] = useState(false);
  const modalRef = useRef(null);
  const nodeRef = useRef(null);
  const [selectedPromptIds, setSelectedPromptIds] = useState(PROMPT_SEQUENCE.map(p => p.id));

  const strategyOptions = [
    {
      id: REFLEXIVE_PROMPTS.JUSTIFICATION.id,
      title: REFLEXIVE_PROMPTS.JUSTIFICATION.title,
      description: REFLEXIVE_PROMPTS.JUSTIFICATION.shortPrompt,
      codeChip: null
    },
    {
      id: REFLEXIVE_PROMPTS.POSITIONALITY.id,
      title: REFLEXIVE_PROMPTS.POSITIONALITY.title,
      description: REFLEXIVE_PROMPTS.POSITIONALITY.shortPrompt,
      codeChip: null
    },
    {
      id: REFLEXIVE_PROMPTS.ALTERNATIVE.id,
      title: REFLEXIVE_PROMPTS.ALTERNATIVE.title,
      description: REFLEXIVE_PROMPTS.ALTERNATIVE.shortPrompt,
      codeChip: null
    },
    {
      id: REFLEXIVE_PROMPTS.NOTE.id,
      title: REFLEXIVE_PROMPTS.NOTE.title,
      description: REFLEXIVE_PROMPTS.NOTE.shortPrompt,
      codeChip: null
    }
  ];

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
    <Draggable
      nodeRef={nodeRef}
      handle=".drag-handle"
      bounds="parent"
    >
      <div
        ref={nodeRef}
        className="absolute z-[200] reflexive-modal"
        style={{ 
          left: modalPosition.x,
          top: modalPosition.y
        }}
      >
        {/* Drag handle - visible area at the top with drag indicator */}
        <div className="drag-handle absolute top-2 left-1/2 transform -translate-x-1/2 w-8 h-1.5 bg-slate-300/60 rounded-full cursor-move z-10 hover:bg-slate-400/80 transition-colors duration-200" title="Drag to move modal" />
        
        <div 
          ref={modalRef}
          className={`bg-gradient-to-br from-slate-50/90 via-white/85 to-blue-50/90 backdrop-blur-md rounded-2xl shadow-[0_20px_60px_rgba(0,0,0,0.15)] border border-white/60 overflow-hidden ${isSliding ? 'transform scale-98 opacity-60 rotate-0.5' : 'transform scale-100 opacity-100 rotate-0'}`}
        >
        {currentStep === 'select' && (
          <div className="p-6 w-[520px]">
            <div className="flex items-center justify-between mb-2">
              <h3 className="text-lg font-light text-slate-800">Choose your reflection prompts</h3>
              <button
                onClick={onClose}
                className="text-slate-400 hover:text-slate-600 transition-all duration-300 hover:bg-slate-100/60 rounded-lg p-2 backdrop-blur-sm"
              >
                <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={1.5} d="M6 18L18 6M6 6l12 12" />
                </svg>
              </button>
            </div>
            <p className="text-sm text-slate-600 mb-4">Select one or more prompts. You can skip individual questions later.</p>
            <StrategySelector
              strategies={strategyOptions}
              multiSelect
              selectedStrategies={selectedPromptIds}
              onStrategiesChange={setSelectedPromptIds}
              title=""
              description=""
            />
            <div className="flex items-center justify-between mt-2">
              <button
                onClick={() => setSelectedPromptIds(strategyOptions.map(s => s.id))}
                className="px-3 py-2 text-sm text-slate-600 hover:text-slate-800 font-light transition-all duration-300 hover:bg-slate-50/80 rounded-xl backdrop-blur-sm border border-slate-200/50 hover:border-slate-300/60"
              >
                Select all
              </button>
              <div className="flex gap-2">
                <button
                  onClick={onClose}
                  className="px-4 py-2.5 text-sm text-slate-600 hover:text-slate-800 font-light transition-all duration-300 hover:bg-slate-50/80 rounded-xl backdrop-blur-sm border border-slate-200/50 hover:border-slate-300/60"
                >
                  Cancel
                </button>
                <button
                  onClick={() => setCurrentStep('prompts')}
                  disabled={selectedPromptIds.length === 0}
                  className="px-5 py-2.5 bg-gradient-to-r from-indigo-500/90 to-purple-500/90 text-white text-sm font-light rounded-xl disabled:opacity-50 disabled:cursor-not-allowed"
                >
                  Start
                </button>
              </div>
            </div>
          </div>
        )}

        {currentStep === 'prompts' && (
          <ReflexivePromptPanel
            selectedCode={selectedCode}
            selectedText={selectedText}
            currentUser={currentUser}
            documentId={documentId}
            highlightId={highlightId}
            onComplete={handleComplete}
            onClose={onClose}
            prompts={[...PROMPT_SEQUENCE, REFLEXIVE_PROMPTS.NOTE].filter(p => selectedPromptIds.includes(p.id))}
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
    </Draggable>
  );
};

export default ReflexiveModal;
