import { useState, useEffect, useMemo } from 'react';
import { ReflexiveService } from '../services/api/firebase/reflexiveService.js';
import { appId } from '../constants/appId.js';

// Helper function to group responses by reflexive lens ID (session)
export const groupResponsesByReflexiveLensId = (responses) => {
  const groups = {};
  
  responses.forEach(response => {
    // Only use reflexiveLensId - skip responses without it
    if (!response.reflexiveLensId) {
      console.warn('Response missing reflexiveLensId:', response.id);
      return;
    }
    
    const key = response.reflexiveLensId;
    
    if (!groups[key]) {
      groups[key] = {
        reflexiveLensId: response.reflexiveLensId,
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

/**
 * Hook to get all reflexive responses for a specific highlight
 * @param {string} highlightId - The highlight ID to get responses for
 * @returns {Object} - { allReflexiveResponses, groupedReflexiveResponses, loading }
 */
export const useReflexiveResponses = (highlightId) => {
  const [allReflexiveResponses, setAllReflexiveResponses] = useState([]);
  const [loading, setLoading] = useState(true);
  const [reflexiveService] = useState(() => new ReflexiveService(appId));

  // Group responses by reflexive lens ID
  const groupedReflexiveResponses = useMemo(() => {
    return groupResponsesByReflexiveLensId(allReflexiveResponses);
  }, [allReflexiveResponses]);

  useEffect(() => {
    if (!highlightId) {
      setLoading(false);
      setAllReflexiveResponses([]);
      return;
    }

    setLoading(true);

    // Listen to all reflexive responses for this highlight
    const unsubscribe = reflexiveService.onReflexiveResponsesSnapshot(
      highlightId,
      (responses) => {
        setAllReflexiveResponses(responses);
        setLoading(false);
      }
    );

    return () => {
      if (unsubscribe) {
        unsubscribe();
      }
    };
  }, [highlightId, reflexiveService]);

  return {
    allReflexiveResponses,
    groupedReflexiveResponses,
    loading
  };
};
