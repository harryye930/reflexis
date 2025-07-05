import { useState, useEffect } from 'react';

export const useHoverPreferences = (appId) => {
  const [showHoverTooltips, setShowHoverTooltips] = useState(true);
  const [showCodesOnly, setShowCodesOnly] = useState(false); // Show codes without author info

  // Load preferences from localStorage on mount
  useEffect(() => {
    const savedPrefs = localStorage.getItem(`hoverPrefs_${appId}`);
    if (savedPrefs) {
      try {
        const prefs = JSON.parse(savedPrefs);
        setShowHoverTooltips(prefs.showHoverTooltips ?? true);
        setShowCodesOnly(prefs.showAuthorInfo ?? false); // Default to false for new semantic
      } catch (error) {
        console.warn('Error loading hover preferences:', error);
      }
    }
  }, [appId]);

  // Save preferences to localStorage when they change
  useEffect(() => {
    const prefs = {
      showHoverTooltips,
      showAuthorInfo: showCodesOnly // Keep the same key for backwards compatibility
    };
    localStorage.setItem(`hoverPrefs_${appId}`, JSON.stringify(prefs));
  }, [appId, showHoverTooltips, showCodesOnly]);

  const toggleHoverTooltips = () => {
    setShowHoverTooltips(prev => !prev);
  };

  const toggleCodesOnly = () => {
    setShowCodesOnly(prev => !prev);
  };

  return {
    showHoverTooltips,
    showAuthorInfo: showCodesOnly, // Export with old name for compatibility
    toggleHoverTooltips,
    toggleAuthorInfo: toggleCodesOnly // Export with old name for compatibility
  };
};
