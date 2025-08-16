// Constants for research background and positionality sections

export const RESEARCH_BACKGROUND_SECTIONS = {
  QUALITATIVE_HISTORY: {
    id: 'qualitativeHistory',
    title: 'Brief History of Qualitative Data Analysis',
    shortLabel: 'History',
    label: 'Brief History of Qualitative Data Analysis',
    displayLabel: 'Brief History of Qualitative Data Analysis:',
    headerMarkdown: '## Brief History of Qualitative Data Analysis',
    placeholder: 'e.g., PhD in Psychology, 5 years experience with thematic analysis, familiar with grounded theory...',
    validationMessage: 'Please provide your background in qualitative data analysis',
    maxLength: 300,
    required: true
  },
  
  BACKGROUND_EXPERIENCE: {
    id: 'backgroundExperience',
    title: 'How Your Background May Affect Interpretation',
    shortLabel: 'Background Positionality',
    label: 'How Your Background May Affect Interpretation',
    displayLabel: 'Background Effects on Interpretation:',
    headerMarkdown: '## Background and Experience Effects on Interpretation',
    placeholder: 'e.g., My clinical background may bias me toward pathological interpretations, prefer quantitative methods...',
    validationMessage: 'Please describe how your background may affect interpretation',
    maxLength: 300,
    required: true
  },
  
  INITIAL_DATA_VIEW: {
    id: 'initialDataView',
    title: 'Your Initial View of the Data',
    shortLabel: 'Initial View',
    label: 'Your Initial View of the Data',
    displayLabel: 'Initial View of the Data:',
    headerMarkdown: '## Initial View of the Data',
    placeholder: 'e.g., Data seems to show patterns around emotional responses, notice themes of resilience...',
    validationMessage: 'Please share your initial view of the data',
    maxLength: 300,
    required: true
  }
};

// Section order for display and processing
export const RESEARCH_BACKGROUND_SECTION_ORDER = [
  RESEARCH_BACKGROUND_SECTIONS.QUALITATIVE_HISTORY,
  RESEARCH_BACKGROUND_SECTIONS.BACKGROUND_EXPERIENCE,
  RESEARCH_BACKGROUND_SECTIONS.INITIAL_DATA_VIEW
];

// Helper functions for working with research background data
export const formatResearchBackgroundForStorage = (qualitativeHistory, backgroundExperience, initialDataView) => {
  return [
    RESEARCH_BACKGROUND_SECTIONS.QUALITATIVE_HISTORY.headerMarkdown,
    qualitativeHistory.trim(),
    '',
    RESEARCH_BACKGROUND_SECTIONS.BACKGROUND_EXPERIENCE.headerMarkdown,
    backgroundExperience.trim(),
    '',
    RESEARCH_BACKGROUND_SECTIONS.INITIAL_DATA_VIEW.headerMarkdown,
    initialDataView.trim()
  ].join('\n');
};

export const parseResearchBackgroundFromStorage = (researchBackground) => {
  if (!researchBackground) {
    return { 
      qualitativeHistory: '', 
      backgroundExperience: '', 
      initialDataView: '' 
    };
  }

  // Create regex patterns using the constants
  const qualitativePattern = new RegExp(
    `${RESEARCH_BACKGROUND_SECTIONS.QUALITATIVE_HISTORY.headerMarkdown}\\s*\\n(.*?)(?=\\n\\s*##|$)`, 
    's'
  );
  const backgroundPattern = new RegExp(
    `${RESEARCH_BACKGROUND_SECTIONS.BACKGROUND_EXPERIENCE.headerMarkdown}\\s*\\n(.*?)(?=\\n\\s*##|$)`, 
    's'
  );
  const initialViewPattern = new RegExp(
    `${RESEARCH_BACKGROUND_SECTIONS.INITIAL_DATA_VIEW.headerMarkdown}\\s*\\n(.*?)(?=\\n\\s*##|$)`, 
    's'
  );

  const qualitativeMatch = researchBackground.match(qualitativePattern);
  const backgroundMatch = researchBackground.match(backgroundPattern);
  const initialViewMatch = researchBackground.match(initialViewPattern);

  return {
    qualitativeHistory: qualitativeMatch ? qualitativeMatch[1].trim() : researchBackground.trim(),
    backgroundExperience: backgroundMatch ? backgroundMatch[1].trim() : '',
    initialDataView: initialViewMatch ? initialViewMatch[1].trim() : ''
  };
};

export const validateResearchBackgroundSection = (sectionId, value) => {
  const section = RESEARCH_BACKGROUND_SECTIONS[sectionId.toUpperCase()];
  if (!section) return null;

  if (!value.trim()) {
    return section.validationMessage;
  }
  
  if (value.trim().length > section.maxLength) {
    return `This section must be less than ${section.maxLength} characters`;
  }
  
  return null;
};
