import React from 'react';
import {
  RESEARCH_BACKGROUND_SECTIONS,
  RESEARCH_BACKGROUND_SECTION_ORDER,
  parseResearchBackgroundFromStorage
} from '../../constants/researchBackground.js';

/**
 * ResearchBackgroundDisplay component
 * Props:
 * - researchBackground: string (markdown or plain text stored in profile)
 * - variant: 'block' | 'inline' (header style)
 * - size: 'sm' | 'xs' (text sizing)
 * - showHeaders: boolean (whether to show section headers)
 * - useShortHeaders: boolean (use shortLabel when available)
 * - className: string (wrapper class names)
 */
const ResearchBackgroundDisplay = ({
  researchBackground,
  variant = 'block',
  size = 'xs',
  showHeaders = true,
  useShortHeaders = false,
  className = ''
}) => {
  const parsed = parseResearchBackgroundFromStorage(researchBackground);

  const sectionValues = {
    [RESEARCH_BACKGROUND_SECTIONS.QUALITATIVE_HISTORY.id]: parsed.qualitativeHistory,
    [RESEARCH_BACKGROUND_SECTIONS.BACKGROUND_EXPERIENCE.id]: parsed.backgroundExperience,
    [RESEARCH_BACKGROUND_SECTIONS.INITIAL_DATA_VIEW.id]: parsed.initialDataView
  };

  const baseTextClass = size === 'sm' ? 'text-sm' : 'text-xs';

  const containerSpacing = variant === 'inline' ? 'space-y-1' : 'space-y-3';

  return (
    <div className={`${containerSpacing} ${className}`}>
      {RESEARCH_BACKGROUND_SECTION_ORDER.map((section) => {
        const value = (sectionValues[section.id] || '').trim();
        const hasContent = Boolean(value);
        const headerText = useShortHeaders && section.shortLabel ? section.shortLabel : section.title;

        if (variant === 'inline') {
          return (
            <p key={section.id} className={`${baseTextClass} text-gray-700 leading-relaxed`}>
              {showHeaders && (
                <span className="font-semibold text-gray-700">{headerText}:</span>
              )}
              {showHeaders ? ' ' : ''}
              {hasContent ? value : 'Not provided'}
            </p>
          );
        }

        // default 'block' variant
        return (
          <div key={section.id}>
            {showHeaders && (
              <div className={`text-[11px] ${size === 'sm' ? 'text-xs' : ''} font-medium text-gray-600 mb-1`}>{headerText}:</div>
            )}
            <div className={`${baseTextClass} text-gray-700 leading-relaxed bg-gray-50 p-2 rounded`}>{hasContent ? value : 'Not provided'}</div>
          </div>
        );
      })}
    </div>
  );
};

export default ResearchBackgroundDisplay;
