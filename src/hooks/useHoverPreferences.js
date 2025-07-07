import { useState, useEffect } from 'react';

export const useHoverPreferences = (appId) => {
  const [showHoverTooltips, setShowHoverTooltips] = useState(true);
  const [showAuthor, setShowAuthor] = useState(true); // Show author info by default - true = show individual colors and names, false = unified color and no names
  const [disableHighlightManagement, setDisableHighlightManagement] = useState(false);

  // Load preferences from localStorage on mount
  useEffect(() => {
    const savedPrefs = localStorage.getItem(`hoverPrefs_${appId}`);
    if (savedPrefs) {
      try {
        const prefs = JSON.parse(savedPrefs);
        setShowHoverTooltips(prefs.showHoverTooltips ?? true);
        // Handle legacy storage key: showAuthorInfo was inverted logic (codes only)
        setShowAuthor(!(prefs.showAuthorInfo ?? false)); // Invert legacy value
        setDisableHighlightManagement(prefs.disableHighlightManagement ?? false);
      } catch (error) {
        console.warn('Error loading hover preferences:', error);
      }
    }
  }, [appId]);

  // Save preferences to localStorage when they change
  useEffect(() => {
    const prefs = {
      showHoverTooltips,
      showAuthorInfo: !showAuthor, // Keep legacy key but invert for backwards compatibility
      disableHighlightManagement
    };
    localStorage.setItem(`hoverPrefs_${appId}`, JSON.stringify(prefs));
  }, [appId, showHoverTooltips, showAuthor, disableHighlightManagement]);

  const toggleHoverTooltips = () => {
    setShowHoverTooltips(prev => !prev);
  };

  const toggleAuthor = () => {
    setShowAuthor(prev => !prev);
  };

  const toggleDisableHighlightManagement = () => {
    setDisableHighlightManagement(prev => !prev);
  };

  return {
    showHoverTooltips,
    showAuthorInfo: showAuthor, // Export with correct logic
    toggleHoverTooltips,
    toggleAuthorInfo: toggleAuthor,
    disableHighlightManagement,
    toggleDisableHighlightManagement
  };
};
