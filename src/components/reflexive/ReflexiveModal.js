import React, { useState, useRef, useEffect } from 'react';
import Draggable from 'react-draggable';
import ReflexivePromptPanel from './ReflexivePromptPanel.js';
import { REFLEXIVE_PROMPTS, PROMPT_SEQUENCE } from '../../constants/reflexivePrompts.js';

const strategyOptions = [
  { ...REFLEXIVE_PROMPTS.JUSTIFICATION, description: 'What informed your coding decision' },
  { ...REFLEXIVE_PROMPTS.POSITIONALITY, description: 'How your experience shapes what you see' },
  { ...REFLEXIVE_PROMPTS.ALTERNATIVE, description: 'Other ways of reading this passage' },
  { ...REFLEXIVE_PROMPTS.NOTE, description: 'Anything else you want to remember' }
];

const ReflexiveModal = ({
  selectedCode, selectedText, onComplete, onClose,
  currentUser, projectId, documentId, highlightId
}) => {
  const [currentStep, setCurrentStep] = useState('select');
  const [selectedPromptIds, setSelectedPromptIds] = useState(PROMPT_SEQUENCE.map(prompt => prompt.id));
  const nodeRef = useRef(null);
  const onCloseRef = useRef(onClose);
  onCloseRef.current = onClose;

  useEffect(() => {
    const previousFocus = document.activeElement;
    const dialog = nodeRef.current;
    dialog?.focus({ preventScroll: true });

    const handleKeyDown = (event) => {
      if (event.key === 'Escape') {
        event.preventDefault();
        onCloseRef.current();
        return;
      }
      if (event.key !== 'Tab' || !dialog) return;
      const controls = dialog.querySelectorAll('button:not([disabled]), input:not([disabled]), textarea:not([disabled])');
      const first = controls[0];
      const last = controls[controls.length - 1];
      if (!dialog.contains(document.activeElement)) {
        event.preventDefault();
        (event.shiftKey ? last : first)?.focus();
        return;
      }
      if (event.shiftKey && (document.activeElement === first || document.activeElement === dialog)) {
        event.preventDefault();
        last?.focus();
      } else if (!event.shiftKey && document.activeElement === last) {
        event.preventDefault();
        first?.focus();
      }
    };
    document.addEventListener('keydown', handleKeyDown);
    return () => {
      document.removeEventListener('keydown', handleKeyDown);
      if (previousFocus?.isConnected) previousFocus.focus({ preventScroll: true });
    };
  }, []);

  const togglePrompt = (id) => setSelectedPromptIds(current => (
    current.includes(id) ? current.filter(item => item !== id) : [...current, id]
  ));

  return (
    <div className="reflection-overlay">
      <Draggable nodeRef={nodeRef} handle=".reflection-drag-handle" bounds="parent">
        <section ref={nodeRef} className="reflexive-modal" role="dialog" aria-modal="true" aria-label="Reflection" tabIndex={-1}>
          <div className="reflection-drag-handle" title="Drag to move reflection" aria-hidden="true"><span /></div>
          {currentStep === 'select' ? (
            <div className="reflection-selection">
              <header className="reflection-intro">
                <button type="button" onClick={onClose} className="reflection-close" aria-label="Close reflection">
                  <svg viewBox="0 0 24 24" fill="none" aria-hidden="true"><path d="m6 6 12 12M6 18 18 6" stroke="currentColor" strokeWidth="1.4" strokeLinecap="round" /></svg>
                </button>
                <h2>Reflection</h2>
                <p>Choose the questions you&rsquo;d like to explore.</p>
              </header>

              <fieldset className="reflection-options">
                <legend className="sr-only">Choose your reflection prompts</legend>
                {strategyOptions.map(option => (
                  <label key={option.id} className={`reflection-option ${selectedPromptIds.includes(option.id) ? 'is-selected' : ''}`}>
                    <input type="checkbox" checked={selectedPromptIds.includes(option.id)} onChange={() => togglePrompt(option.id)} />
                    <span><span className="reflection-option-title">{option.title}</span><span className="reflection-option-description">{option.description}</span></span>
                  </label>
                ))}
              </fieldset>

              <footer className="reflection-actions">
                <button type="button" onClick={() => setSelectedPromptIds(strategyOptions.map(option => option.id))} className="reflection-button-quiet">Select all</button>
                <div className="reflection-actions-end">
                  <button type="button" onClick={onClose} className="reflection-button-quiet">Cancel</button>
                  <button type="button" onClick={() => setCurrentStep('prompts')} disabled={selectedPromptIds.length === 0} className="reflection-button-primary">Start</button>
                </div>
              </footer>
            </div>
          ) : (
            <ReflexivePromptPanel
              selectedCode={selectedCode} selectedText={selectedText}
              currentUser={currentUser} projectId={projectId} documentId={documentId}
              highlightId={highlightId} onComplete={onComplete} onClose={onClose}
              prompts={[...PROMPT_SEQUENCE, REFLEXIVE_PROMPTS.NOTE].filter(prompt => selectedPromptIds.includes(prompt.id))}
            />
          )}
        </section>
      </Draggable>
    </div>
  );
};

export default ReflexiveModal;
