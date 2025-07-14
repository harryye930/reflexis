// Reflexive prompts for different stages of the reflexive process
export const REFLEXIVE_PROMPTS = {
  // Initial prompt - fostering justification
  JUSTIFICATION: {
    id: 'justification',
    title: 'Justification',
    prompt: (codeLabel, selectedText) => 
      `What specific language in this passage led you to code it as '${codeLabel}'?`,
    shortPrompt: 'Coding Justification',
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
    shortPrompt: 'Personal/Professional Perspective',
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
    shortPrompt: 'Alternative Interpretations',
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

// Get short prompt text for sidebar display
export const getShortPromptText = (promptType) => {
  const prompt = Object.values(REFLEXIVE_PROMPTS).find(p => p.type === promptType);
  return prompt?.shortPrompt || promptType;
};

// Get prompt details by type
export const getPromptByType = (promptType) => {
  return Object.values(REFLEXIVE_PROMPTS).find(p => p.type === promptType);
};

// Helper function to group responses by user and highlight
export const groupResponsesByUserAndHighlight = (responses) => {
  const groups = {};
  
  responses.forEach(response => {
    const key = `${response.userId}-${response.highlightId}`;
    if (!groups[key]) {
      groups[key] = {
        userId: response.userId,
        highlightId: response.highlightId,
        documentId: response.documentId,
        codeId: response.codeId,
        codeLabel: response.codeLabel,
        sourceText: response.sourceText,
        createdAt: response.createdAt,
        responses: {}
      };
    }
    
    groups[key].responses[response.promptType] = {
      id: response.id,
      response: response.response,
      prompt: response.prompt,
      createdAt: response.createdAt
    };
    
    // Update group timestamp to the latest response
    if (new Date(response.createdAt) > new Date(groups[key].createdAt)) {
      groups[key].createdAt = response.createdAt;
    }
  });
  
  return Object.values(groups);
};
