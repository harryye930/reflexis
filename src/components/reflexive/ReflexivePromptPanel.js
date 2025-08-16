import React, { useState, useEffect } from 'react';
import { PROMPT_SEQUENCE } from '../../constants/reflexivePrompts.js';
import { Search, Person, Autorenew, NoteAlt } from '@mui/icons-material';
import { ReflexiveService } from '../../services/api/firebase/reflexiveService.js';
import { appId } from '../../constants/appId.js';

const ReflexivePromptPanel = ({ 
  selectedCode, 
  selectedText, 
  currentUser,
  documentId,
  highlightId,
  onComplete,
  onClose,
  prompts = PROMPT_SEQUENCE
}) => {
  const [currentPromptIndex, setCurrentPromptIndex] = useState(0);
  const [responses, setResponses] = useState({});
  const [currentResponse, setCurrentResponse] = useState('');
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [reflexiveService] = useState(() => new ReflexiveService(appId));
  const [isSliding, setIsSliding] = useState(false);

  const currentPrompt = prompts[currentPromptIndex];
  const renderPromptIcon = (type) => {
    switch (type) {
      case 'justification':
        return <Search sx={{ fontSize: 20 }} />;
      case 'positionality':
        return <Person sx={{ fontSize: 20 }} />;
      case 'alternative':
        return <Autorenew sx={{ fontSize: 20 }} />;
      case 'note':
        return <NoteAlt sx={{ fontSize: 20 }} />;
      default:
        return <Search sx={{ fontSize: 20 }} />;
    }
  };
  const isLastPrompt = currentPromptIndex === prompts.length - 1;
  const isFirstPrompt = currentPromptIndex === 0;

  // Load existing response for current prompt
  useEffect(() => {
    const existingResponse = responses[currentPrompt.id];
    setCurrentResponse(existingResponse || '');
  }, [currentPromptIndex, responses, currentPrompt.id]);

  const handleNext = async () => {
    if (!currentResponse.trim()) return;

    setIsSubmitting(true);
    
    // Save current response
    const responseData = {
      highlightId,
      documentId,
      codeId: selectedCode.id,
      codeLabel: selectedCode.label,
      sourceText: selectedText,
      promptType: currentPrompt.type,
      prompt: currentPrompt.prompt(selectedCode.label, selectedText), 
      response: currentResponse.trim()
    };

    const result = await reflexiveService.addReflexiveResponse(responseData, currentUser.uid);
    
    if (result.success) {
      // Update local responses
      const newResponses = {
        ...responses,
        [currentPrompt.id]: currentResponse.trim()
      };
      setResponses(newResponses);

      if (isLastPrompt) {
        // Complete the process
        onComplete(newResponses);
      } else {
        // Move to next prompt with sliding animation
        setIsSliding(true);
        setTimeout(() => {
          setCurrentPromptIndex(prev => prev + 1);
          setCurrentResponse('');
          setIsSliding(false);
        }, 200);
      }
    }
    
    setIsSubmitting(false);
  };

  const handlePrevious = () => {
    if (isFirstPrompt) return;
    
    // Save current response locally (without submitting to Firebase)
    setResponses(prev => ({
      ...prev,
      [currentPrompt.id]: currentResponse.trim()
    }));

    setIsSliding(true);
    setTimeout(() => {
      setCurrentPromptIndex(prev => prev - 1);
      setIsSliding(false);
    }, 200);
  };

  const handleSkip = () => {
    if (isLastPrompt) {
      onComplete(responses);
    } else {
      setIsSliding(true);
      setTimeout(() => {
        setCurrentPromptIndex(prev => prev + 1);
        setCurrentResponse('');
        setIsSliding(false);
      }, 200);
    }
  };

  return (
    <div className="reflexive-prompt-panel max-w-lg animate-contemplative-entrance">
      {/* Header */}
      <div className="bg-gradient-to-r from-indigo-50/80 via-purple-50/70 to-blue-50/80 p-6 border-b border-slate-200/50 backdrop-blur-sm">
        <div className="flex items-center justify-between mb-3">
          <div className="flex items-center gap-3">
            <span className="text-2xl transition-transform duration-500 hover:scale-110 animate-gentle-float">{renderPromptIcon(currentPrompt.type)}</span>
            <h3 className="font-light text-slate-800 text-lg tracking-wide">Reflexive <span className="font-medium text-indigo-700">Lens</span></h3>
          </div>
          <button
            onClick={onClose}
            className="text-slate-400 hover:text-slate-600 transition-all duration-300 hover:bg-slate-100/60 rounded-lg p-2 backdrop-blur-sm"
          >
            <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={1.5} d="M6 18L18 6M6 6l12 12" />
            </svg>
          </button>
        </div>
        
        {/* Progress indicator with contemplative styling */}
        <div className="flex gap-2 mb-4">
          {prompts.map((_, index) => (
            <div
              key={index}
              className={`h-1.5 flex-1 rounded-full transition-all duration-700 ease-out ${
                index <= currentPromptIndex 
                  ? 'bg-gradient-to-r from-indigo-400 to-purple-500 scale-y-125 shadow-sm' 
                  : 'bg-slate-200/60'
              }`}
            />
          ))}
        </div>
        
        {/* Code context with contemplative styling */}
        <div className="flex items-center gap-3 text-sm">
          <span className={`px-3 py-1.5 rounded-full text-xs font-light transition-all duration-300 hover:scale-105 backdrop-blur-sm border border-white/40 shadow-sm ${selectedCode.color} ${selectedCode.textColor}`}>
            {selectedCode.label}
          </span>
          <span className="text-slate-600 font-light italic">
            &ldquo;{selectedText.length > 50 ? selectedText.substring(0, 50) + '...' : selectedText}&rdquo;
          </span>
        </div>
      </div>

      {/* Content with enhanced contemplative sliding animation */}
      <div className={`p-7 transition-all duration-600 ease-[cubic-bezier(0.16,1,0.3,1)] ${isSliding ? 'transform translate-x-6 opacity-40 scale-98 blur-sm' : 'transform translate-x-0 opacity-100 scale-100 blur-0'}`}>
        {/* Current prompt */}
        <div className="mb-7">
          <h4 className="font-light text-slate-900 mb-3 flex items-center gap-3 text-lg">
            <span className="text-2xl transition-transform duration-500 hover:scale-110 animate-gentle-float">{renderPromptIcon(currentPrompt.type)}</span>
            <span className="tracking-wide">{currentPrompt.title}</span>
          </h4>
          <p className="text-sm text-slate-700 mb-5 leading-relaxed font-light bg-gradient-to-r from-slate-50/60 to-blue-50/40 p-4 rounded-xl border border-slate-200/50 backdrop-blur-sm">
            {currentPrompt.prompt(selectedCode.label, selectedText)}
          </p>
          
          <textarea
            value={currentResponse}
            onChange={(e) => setCurrentResponse(e.target.value)}
            placeholder={currentPrompt.placeholder}
            className="w-full h-36 p-4 border border-slate-200/70 rounded-xl text-sm resize-none focus:outline-none focus:ring-2 focus:ring-indigo-300/50 focus:border-indigo-300/70 transition-all duration-300 hover:border-slate-300/80 bg-gradient-to-br from-white/90 to-slate-50/60 backdrop-blur-sm font-light placeholder-slate-400 shadow-sm focus:shadow-md"
            disabled={isSubmitting}
          />
        </div>

        {/* Actions with contemplative styling */}
        <div className="flex items-center justify-between">
          <div className="flex gap-3">
            {!isFirstPrompt && (
              <button
                onClick={handlePrevious}
                className="px-4 py-2.5 text-sm text-slate-600 hover:text-slate-800 font-light transition-all duration-300 hover:bg-slate-50/80 rounded-xl backdrop-blur-sm border border-slate-200/50 hover:border-slate-300/60 hover:shadow-sm"
                disabled={isSubmitting}
              >
                ← Previous
              </button>
            )}
          </div>
          
          <div className="flex gap-3">
            <button
              onClick={handleSkip}
              className="px-4 py-2.5 text-sm text-slate-500 hover:text-slate-700 font-light transition-all duration-300 hover:bg-slate-50/60 rounded-xl backdrop-blur-sm"
              disabled={isSubmitting}
            >
              Skip
            </button>
            <button
              onClick={handleNext}
              disabled={!currentResponse.trim() || isSubmitting}
              className="px-5 py-2.5 bg-gradient-to-r from-indigo-500/90 to-purple-500/90 text-white text-sm font-light rounded-xl hover:from-indigo-600/95 hover:to-purple-600/95 disabled:opacity-50 disabled:cursor-not-allowed transition-all duration-300 transform hover:scale-102 disabled:hover:scale-100 backdrop-blur-sm border border-white/20 shadow-lg hover:shadow-xl"
            >
              {isSubmitting ? (
                <div className="flex items-center gap-2">
                  <div className="w-4 h-4 border-2 border-white/60 border-t-white rounded-full animate-spin"></div>
                  <span>Saving...</span>
                </div>
              ) : isLastPrompt ? (
                'Complete'
              ) : (
                'Next →'
              )}
            </button>
          </div>
        </div>
      </div>
    </div>
  );
};

export default ReflexivePromptPanel;
