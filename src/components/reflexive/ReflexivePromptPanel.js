import React, { useState, useEffect } from 'react';
import { PROMPT_SEQUENCE } from '../../constants/reflexivePrompts.js';
import { ReflexiveService } from '../../services/api/firebase/reflexiveService.js';
import { appId } from '../../constants/index.js';

const ReflexivePromptPanel = ({ 
  selectedCode, 
  selectedText, 
  currentUser,
  documentId,
  highlightId,
  onComplete,
  onClose
}) => {
  const [currentPromptIndex, setCurrentPromptIndex] = useState(0);
  const [responses, setResponses] = useState({});
  const [currentResponse, setCurrentResponse] = useState('');
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [reflexiveService] = useState(() => new ReflexiveService(appId));
  const [isSliding, setIsSliding] = useState(false);

  const currentPrompt = PROMPT_SEQUENCE[currentPromptIndex];
  const isLastPrompt = currentPromptIndex === PROMPT_SEQUENCE.length - 1;
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
      code: selectedCode.id,
      codeLabel: selectedCode.label,
      selectedText,
      promptType: currentPrompt.type,
      promptQuestion: currentPrompt.prompt(selectedCode.label, selectedText),
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
    <div className="reflexive-prompt-panel max-w-lg">
      {/* Header */}
      <div className="bg-gradient-to-r from-blue-50 to-indigo-50 p-4 border-b border-gray-100">
        <div className="flex items-center justify-between mb-2">
          <div className="flex items-center gap-2">
            <span className="text-lg transition-transform duration-300 hover:scale-110">{currentPrompt.icon}</span>
            <h3 className="font-semibold text-gray-800">Reflexive Lens</h3>
          </div>
          <button
            onClick={onClose}
            className="text-gray-400 hover:text-gray-600 transition-all duration-200 hover:bg-gray-100 rounded-md p-1"
          >
            <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M6 18L18 6M6 6l12 12" />
            </svg>
          </button>
        </div>
        
        {/* Progress indicator */}
        <div className="flex gap-1 mb-3">
          {PROMPT_SEQUENCE.map((_, index) => (
            <div
              key={index}
              className={`h-1 flex-1 rounded-full transition-all duration-500 ease-out ${
                index <= currentPromptIndex ? 'bg-blue-500 scale-y-150' : 'bg-gray-200'
              }`}
            />
          ))}
        </div>
        
        {/* Code context */}
        <div className="flex items-center gap-2 text-sm">
          <span className={`px-2 py-1 rounded-full text-xs font-medium transition-all duration-200 hover:scale-105 ${selectedCode.color} ${selectedCode.textColor}`}>
            {selectedCode.label}
          </span>
          <span className="text-gray-600">
            &ldquo;{selectedText.length > 50 ? selectedText.substring(0, 50) + '...' : selectedText}&rdquo;
          </span>
        </div>
      </div>

      {/* Content with enhanced sliding animation */}
      <div className={`p-6 transition-all duration-400 cubic-bezier(0.23, 1, 0.32, 1) ${isSliding ? 'transform translate-x-4 opacity-50 scale-95' : 'transform translate-x-0 opacity-100 scale-100'}`}>
        {/* Current prompt */}
        <div className="mb-6">
          <h4 className="font-medium text-gray-900 mb-2 flex items-center gap-2">
            <span className="text-lg transition-transform duration-300 hover:scale-110">{currentPrompt.icon}</span>
            {currentPrompt.title}
          </h4>
          <p className="text-sm text-gray-700 mb-4 leading-relaxed">
            {currentPrompt.prompt(selectedCode.label, selectedText)}
          </p>
          
          <textarea
            value={currentResponse}
            onChange={(e) => setCurrentResponse(e.target.value)}
            placeholder={currentPrompt.placeholder}
            className="w-full h-32 p-3 border border-gray-200 rounded-lg text-sm resize-none focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-transparent transition-all duration-200 hover:border-gray-300"
            disabled={isSubmitting}
          />
        </div>

        {/* Actions */}
        <div className="flex items-center justify-between">
          <div className="flex gap-2">
            {!isFirstPrompt && (
              <button
                onClick={handlePrevious}
                className="px-3 py-2 text-sm text-gray-600 hover:text-gray-800 font-medium transition-all duration-200 hover:bg-gray-50 rounded-lg"
                disabled={isSubmitting}
              >
                ← Previous
              </button>
            )}
          </div>
          
          <div className="flex gap-2">
            <button
              onClick={handleSkip}
              className="px-3 py-2 text-sm text-gray-500 hover:text-gray-700 font-medium transition-all duration-200 hover:bg-gray-50 rounded-lg"
              disabled={isSubmitting}
            >
              Skip
            </button>
            <button
              onClick={handleNext}
              disabled={!currentResponse.trim() || isSubmitting}
              className="px-4 py-2 bg-blue-500 text-white text-sm font-medium rounded-lg hover:bg-blue-600 disabled:opacity-50 disabled:cursor-not-allowed transition-all duration-200 transform hover:scale-105 disabled:hover:scale-100"
            >
              {isSubmitting ? (
                <div className="flex items-center gap-2">
                  <div className="w-4 h-4 border-2 border-white border-t-transparent rounded-full animate-spin"></div>
                  Saving...
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
