import { useState, useEffect, useMemo } from 'react';
import { HighlightService } from '../services/api/firebase/highlightService.js';

export const useHighlights = (projectId, currentUser, documentId) => {
  const [highlights, setHighlights] = useState([]);
  const highlightService = useMemo(() => (
    projectId ? new HighlightService(projectId) : null
  ), [projectId]);

  useEffect(() => {
    if (!currentUser || !projectId || !documentId || !highlightService) {
      setHighlights([]);
      return;
    }

    const unsubscribe = highlightService.onHighlightsSnapshot(documentId, (highlightsData) => {
      setHighlights(highlightsData);
    });

    return () => unsubscribe();
  }, [projectId, currentUser, documentId, highlightService]);

  const addHighlight = async (highlightData) => {
    if (!currentUser || !highlightData.documentId) return { success: false, error: 'Missing user or document ID' };
    if (!highlightService) return { success: false, error: 'No project selected' };

    return await highlightService.addHighlight(highlightData, currentUser.uid);
  };

  const deleteHighlight = async (id) => {
    if (!highlightService) return { success: false, error: 'No project selected' };
    return await highlightService.deleteHighlight(id);
  };

  return { highlights, addHighlight, deleteHighlight };
};
