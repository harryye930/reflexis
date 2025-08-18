import { useState, useEffect } from 'react';
import { ReflexiveService } from '../services/api/firebase/reflexiveService.js';
import { appId } from '../constants/appId.js';

/**
 * Hook to get all reflexive responses for a specific highlight
 * @param {string} highlightId - The highlight ID to get responses for
 * @returns {Object} - { allReflexiveResponses, loading }
 */
export const useReflexiveResponses = (highlightId) => {
  const [allReflexiveResponses, setAllReflexiveResponses] = useState([]);
  const [loading, setLoading] = useState(true);
  const [reflexiveService] = useState(() => new ReflexiveService(appId));

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
    loading
  };
};
