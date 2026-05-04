import React, { useEffect, useState } from 'react';
import {
  RESEARCH_BACKGROUND_SECTIONS,
  RESEARCH_BACKGROUND_SECTION_ORDER,
  parseResearchBackgroundFromStorage
} from '../../constants/researchBackground.js';
import { authFetch } from '../../lib/authFetch.js';

/**
 * ResearchBackgroundDisplay component
 * Props:
 * - researchBackground: string (markdown or plain text stored in profile)
 * - variant: 'block' | 'inline' (header style)
 * - size: 'sm' | 'xs' (text sizing)
 * - showHeaders: boolean (whether to show section headers)
 * - useShortHeaders: boolean (use shortLabel when available)
 * - className: string (wrapper class names)
 * - userName?: string (optional, passed to the summary endpoint for context)
 * - reducedResearchBackground?: string (pre-computed summary keywords for inline variant)
 */
const ResearchBackgroundDisplay = ({
  researchBackground,
  variant = 'block',
  size = 'xs',
  showHeaders = true,
  useShortHeaders = false,
  className = '',
  userName,
  reducedResearchBackground
}) => {
  const [summaryKeywords, setSummaryKeywords] = useState('');
  const [isLoadingSummary, setIsLoadingSummary] = useState(false);
  const [summaryError, setSummaryError] = useState(null);

  const parsed = parseResearchBackgroundFromStorage(researchBackground);

  const sectionValues = {
    [RESEARCH_BACKGROUND_SECTIONS.QUALITATIVE_HISTORY.id]: parsed.qualitativeHistory,
    [RESEARCH_BACKGROUND_SECTIONS.BACKGROUND_EXPERIENCE.id]: parsed.backgroundExperience,
    [RESEARCH_BACKGROUND_SECTIONS.INITIAL_DATA_VIEW.id]: parsed.initialDataView
  };

  const baseTextClass = size === 'sm' ? 'text-sm' : 'text-xs';

  const containerSpacing = variant === 'inline' ? 'space-y-1' : 'space-y-3';

  // Fetch summarized keywords when showing inline variant and reducedResearchBackground not provided
  useEffect(() => {
    let aborted = false;
    async function fetchSummary() {
      if (variant !== 'inline') return;
      if (reducedResearchBackground) return; // Use provided summary instead of fetching
      if (!researchBackground || !researchBackground.trim()) return;
      try {
        setIsLoadingSummary(true);
        setSummaryError(null);
        const res = await authFetch('/api/research-background/summary', {
          method: 'POST',
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify({ researchBackground, userName }),
        });
        if (!res.ok) {
          throw new Error(`HTTP ${res.status}`);
        }
        const data = await res.json();
        if (!aborted) setSummaryKeywords(data.keywords || '');
      } catch (e) {
        if (!aborted) setSummaryError(e);
      } finally {
        if (!aborted) setIsLoadingSummary(false);
      }
    }
    fetchSummary();
    return () => {
      aborted = true;
    };
  }, [variant, researchBackground, userName, reducedResearchBackground]);

  return (
    <div className={`${containerSpacing} ${className}`}>
      {variant === 'inline' ? (
        // Render a single-line summary of the research background using the LLM endpoint
        <p className={`${baseTextClass} text-gray-700 leading-relaxed`}>
          {showHeaders && (
            <span className="font-semibold text-gray-700">
              {useShortHeaders ? 'Research Background (reduced)' : 'Research Background'}:
            </span>
          )}
          {showHeaders ? ' ' : ''}
          {reducedResearchBackground
            ? reducedResearchBackground
            : isLoadingSummary
              ? 'Summarizing…'
              : summaryKeywords
                ? summaryKeywords
                : // Fallback to simple concatenation if summary unavailable
                  [
                    sectionValues[RESEARCH_BACKGROUND_SECTIONS.QUALITATIVE_HISTORY.id],
                    sectionValues[RESEARCH_BACKGROUND_SECTIONS.BACKGROUND_EXPERIENCE.id],
                    sectionValues[RESEARCH_BACKGROUND_SECTIONS.INITIAL_DATA_VIEW.id]
                  ]
                    .filter(Boolean)
                    .join(' ')
                    .trim() || 'Not provided'}
        </p>
      ) : (
        RESEARCH_BACKGROUND_SECTION_ORDER.map((section) => {
        const value = (sectionValues[section.id] || '').trim();
        const hasContent = Boolean(value);
        const headerText = useShortHeaders && section.shortLabel ? section.shortLabel : section.title;
          // default 'block' variant per-section rendering
          return (
            <div key={section.id}>
              {showHeaders && (
                <div className={`text-[11px] ${size === 'sm' ? 'text-xs' : ''} font-medium text-gray-600 mb-1`}>{headerText}:</div>
              )}
              <div className={`${baseTextClass} text-gray-700 leading-relaxed bg-gray-50 p-2 rounded`}>{hasContent ? value : 'Not provided'}</div>
            </div>
          );
        })
      )}
    </div>
  );
};

export default ResearchBackgroundDisplay;
