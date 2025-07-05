import { useState, useEffect } from 'react';
import { HighlightService } from '../services/api/firebase/highlightService.js';

export const useHighlights = (appId, currentUser, documentId) => {
  const [highlights, setHighlights] = useState([]);
  const [highlightService] = useState(() => new HighlightService(appId));

  useEffect(() => {
    if (!currentUser || !documentId) {
      setHighlights([]);
      return;
    }

    const unsubscribe = highlightService.onHighlightsSnapshot(documentId, (highlightsData) => {
      setHighlights(highlightsData);
    });

    return () => unsubscribe();
  }, [appId, currentUser, documentId, highlightService]);

  const addHighlight = async (highlightData) => {
    if (!currentUser || !highlightData.documentId) return { success: false, error: 'Missing user or document ID' };

    return await highlightService.addHighlight(highlightData, currentUser.uid);
  };

  const deleteHighlight = async (id) => {
    return await highlightService.deleteHighlight(id);
  };

  return { highlights, addHighlight, deleteHighlight };
};
