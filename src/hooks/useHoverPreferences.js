import { useState, useEffect } from 'react';

export const useHoverPreferences = (appId) => {
  const [showHoverTooltips, setShowHoverTooltips] = useState(true);
  const [showAuthorInfo, setShowAuthorInfo] = useState(true);

  // Load preferences from localStorage on mount
  useEffect(() => {
    const savedPrefs = localStorage.getItem(`hoverPrefs_${appId}`);
    if (savedPrefs) {
      try {
        const prefs = JSON.parse(savedPrefs);
        setShowHoverTooltips(prefs.showHoverTooltips ?? true);
        setShowAuthorInfo(prefs.showAuthorInfo ?? true);
      } catch (error) {
        console.warn('Error loading hover preferences:', error);
      }
    }
  }, [appId]);

  // Save preferences to localStorage when they change
  useEffect(() => {
    const prefs = {
      showHoverTooltips,
      showAuthorInfo
    };
    localStorage.setItem(`hoverPrefs_${appId}`, JSON.stringify(prefs));
  }, [appId, showHoverTooltips, showAuthorInfo]);

  const toggleHoverTooltips = () => {
    setShowHoverTooltips(prev => !prev);
  };

  const toggleAuthorInfo = () => {
    setShowAuthorInfo(prev => !prev);
  };

  return {
    showHoverTooltips,
    showAuthorInfo,
    toggleHoverTooltips,
    toggleAuthorInfo
  };
};
