import { useMemo } from 'react';

export const useTextSegmentation = (highlights, sourceText) => {
  const segments = useMemo(() => {
    // Early return for no highlights
    if (highlights.length === 0) {
      return [{ text: sourceText, startIndex: 0, endIndex: sourceText.length, highlights: [] }];
    }

    // Create segments based on highlight boundaries
    const boundaries = new Set([0, sourceText.length]);
    
    // Add all highlight start and end positions as boundaries
    highlights.forEach(h => {
      boundaries.add(h.startIndex);
      boundaries.add(h.endIndex);
    });
    
    const sortedBoundaries = Array.from(boundaries).sort((a, b) => a - b);
    
    // Create segments between boundaries
    const segments = [];
    for (let i = 0; i < sortedBoundaries.length - 1; i++) {
      const start = sortedBoundaries[i];
      const end = sortedBoundaries[i + 1];
      const text = sourceText.substring(start, end);
      
      // Find all highlights that cover this segment
      const segmentHighlights = highlights.filter(h => 
        h.startIndex <= start && h.endIndex >= end
      );
      
      segments.push({
        text,
        startIndex: start,
        endIndex: end,
        highlights: segmentHighlights
      });
    }
    
    return segments;
  }, [highlights, sourceText]);

  return segments;
}; 