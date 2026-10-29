import React, { useState, useEffect } from 'react';
import { PROMPT_SEQUENCE } from '../../constants/reflexivePrompts.js';
import { ReflexiveService } from '../../services/api/firebase/reflexiveService.js';

const ReflexivePromptPanel = ({ 
  selectedCode, 
  selectedText, 
  currentUser,
  projectId,
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
  const [reflexiveService] = useState(() => new ReflexiveService(projectId));
  
  // Generate unique session ID for this reflection session
  const [reflexiveLensId] = useState(() => `reflexive-${Date.now()}-${Math.random().toString(36).substr(2, 9)}`);

  const currentPrompt = prompts[currentPromptIndex];
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
      response: currentResponse.trim(),
      reflexiveLensId: reflexiveLensId
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
        setCurrentPromptIndex(prev => prev + 1);
        setCurrentResponse('');
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

    setCurrentPromptIndex(prev => prev - 1);
  };

  const handleSkip = () => {
    if (isLastPrompt) {
      onComplete(responses);
    } else {
      setCurrentPromptIndex(prev => prev + 1);
      setCurrentResponse('');
    }
  };

  return (
    <div className="reflexive-prompt-panel">
      <header className="reflection-writing-header">
        <div className="reflection-writing-topline">
          <span className="reflection-title">Reflection</span>
          <span className="reflection-progress-label" aria-live="polite">Question {currentPromptIndex + 1} of {prompts.length}</span>
          <button type="button" onClick={onClose} className="reflection-close" aria-label="Close reflection">
            <svg viewBox="0 0 24 24" fill="none" aria-hidden="true"><path d="m6 6 12 12M6 18 18 6" stroke="currentColor" strokeWidth="1.4" strokeLinecap="round" /></svg>
          </button>
        </div>
        <div className="reflection-context">
          <span className="reflection-code"><span className={`reflection-code-dot ${selectedCode.color}`} aria-hidden="true" />{selectedCode.label}</span>
          <blockquote>{selectedText}</blockquote>
        </div>
      </header>

      <div className="reflection-writing-body">
        <h2 id="reflection-question" className="reflection-question">{currentPrompt.prompt(selectedCode.label, selectedText)}</h2>
        <label htmlFor="reflection-response" className="sr-only">Your reflection</label>
        <textarea
          id="reflection-response"
          aria-labelledby="reflection-question"
          value={currentResponse}
          onChange={(event) => setCurrentResponse(event.target.value)}
          placeholder="Write your thoughts here…"
          className="reflection-input"
          disabled={isSubmitting}
        />

        <footer className="reflection-actions">
          <div>
            {!isFirstPrompt && <button type="button" onClick={handlePrevious} className="reflection-button-quiet" disabled={isSubmitting}>← Previous</button>}
          </div>
          <div className="reflection-actions-end">
            <button type="button" onClick={handleSkip} className="reflection-button-quiet" disabled={isSubmitting}>Skip</button>
            <button type="button" onClick={handleNext} disabled={!currentResponse.trim() || isSubmitting} className="reflection-button-primary">
              {isSubmitting ? 'Saving…' : isLastPrompt ? 'Complete' : 'Next →'}
            </button>
          </div>
        </footer>
      </div>
    </div>
  );
};

export default ReflexivePromptPanel;
