import { useState, useEffect } from 'react';
import { ReflexiveService } from '../services/api/firebase/reflexiveService.js';
import { appId } from '../constants/appId.js';

/**
 * Hook to check if reflexive responses exist for a specific highlight and user
 * @param {string} highlightId - The highlight ID to check
 * @param {string} userId - The user ID to check
 * @returns {Object} - { hasReflexiveInput, loading, reflexiveResponses }
 */
export const useReflexiveCheck = (highlightId, userId) => {
  const [hasReflexiveInput, setHasReflexiveInput] = useState(false);
  const [loading, setLoading] = useState(true);
  const [reflexiveResponses, setReflexiveResponses] = useState([]);
  const [reflexiveService] = useState(() => new ReflexiveService(appId));

  useEffect(() => {
    if (!highlightId || !userId) {
      setLoading(false);
      setHasReflexiveInput(false);
      setReflexiveResponses([]);
      return;
    }

    setLoading(true);

    // Listen to reflexive responses for this highlight
    const unsubscribe = reflexiveService.onReflexiveResponsesSnapshot(
      highlightId,
      (responses) => {
        // Filter responses for the specific user
        const userResponses = responses.filter(response => response.userId === userId);
        setReflexiveResponses(userResponses);
        setHasReflexiveInput(userResponses.length > 0);
        setLoading(false);
      }
    );

    return () => {
      if (unsubscribe) {
        unsubscribe();
      }
    };
  }, [highlightId, userId, reflexiveService]);

  return {
    hasReflexiveInput,
    loading,
    reflexiveResponses
  };
};
