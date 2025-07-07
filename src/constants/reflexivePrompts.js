// Reflexive prompts for different stages of the reflexive process
export const REFLEXIVE_PROMPTS = {
  // Initial prompt - fostering justification
  JUSTIFICATION: {
    id: 'justification',
    title: 'Justification',
    prompt: (codeLabel, selectedText) => 
      `What specific language in this passage led you to code it as '${codeLabel}'?`,
    placeholder: 'Describe the specific words, phrases, or concepts that informed your coding decision...',
    icon: '🔍',
    type: 'justification'
  },

  // Deeper prompt - probing positionality  
  POSITIONALITY: {
    id: 'positionality',
    title: 'Positionality',
    prompt: (codeLabel, selectedText) => 
      `What personal or professional experiences make '${codeLabel}' a salient concept for you here?`,
    placeholder: 'Reflect on your background, experiences, and perspectives that influence this interpretation...',
    icon: '👤',
    type: 'positionality'
  },

  // Alternative framing prompt
  ALTERNATIVE: {
    id: 'alternative',
    title: 'Alternative Framing',
    prompt: (codeLabel, selectedText) => 
      `Could this behavior be interpreted differently from another perspective? What evidence would support or refute alternative interpretations?`,
    placeholder: 'Consider other possible interpretations and what evidence might support them...',
    icon: '🔄',
    type: 'alternative'
  }
};

// Sequential order of prompts
export const PROMPT_SEQUENCE = [
  REFLEXIVE_PROMPTS.JUSTIFICATION,
  REFLEXIVE_PROMPTS.POSITIONALITY,
  REFLEXIVE_PROMPTS.ALTERNATIVE
];

// Helper function to get next prompt
export const getNextPrompt = (currentPromptId) => {
  const currentIndex = PROMPT_SEQUENCE.findIndex(p => p.id === currentPromptId);
  if (currentIndex >= 0 && currentIndex < PROMPT_SEQUENCE.length - 1) {
    return PROMPT_SEQUENCE[currentIndex + 1];
  }
  return null;
};

// Helper function to get previous prompt
export const getPreviousPrompt = (currentPromptId) => {
  const currentIndex = PROMPT_SEQUENCE.findIndex(p => p.id === currentPromptId);
  if (currentIndex > 0) {
    return PROMPT_SEQUENCE[currentIndex - 1];
  }
  return null;
};

// Check if all prompts are completed
export const areAllPromptsCompleted = (responses) => {
  const completedPrompts = new Set(responses.map(r => r.promptType));
  return PROMPT_SEQUENCE.every(prompt => completedPrompts.has(prompt.type));
};
