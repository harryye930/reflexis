import { useState, useEffect } from 'react';

export const useHoverPreferences = (appId) => {
  const [showHoverTooltips, setShowHoverTooltips] = useState(true);
  const [showAuthor, setShowAuthor] = useState(true); // Show author info by default - true = show individual colors and names, false = unified color and no names
  const [disableHighlightManagement, setDisableHighlightManagement] = useState(false);
  const [disableCodeDriftDetection, setDisableCodeDriftDetection] = useState(false);
  const [showCodeDetails, setShowCodeDetails] = useState(true);
  // When true: hide highlights where all overlapping codings use the same code
  const [hideSameCodeHighlights, setHideSameCodeHighlights] = useState(false);

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
        setDisableCodeDriftDetection(prefs.disableCodeDriftDetection ?? false);
        setShowCodeDetails(prefs.showCodeDetails ?? true);
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
      disableHighlightManagement,
      disableCodeDriftDetection,
      showCodeDetails
    };
    localStorage.setItem(`hoverPrefs_${appId}`, JSON.stringify(prefs));
  }, [appId, showHoverTooltips, showAuthor, disableHighlightManagement, disableCodeDriftDetection, showCodeDetails, hideSameCodeHighlights]);

  const toggleHoverTooltips = () => {
    setShowHoverTooltips(prev => !prev);
  };

  const toggleAuthor = () => {
    setShowAuthor(prev => !prev);
  };

  const toggleDisableHighlightManagement = () => {
    setDisableHighlightManagement(prev => !prev);
  };

  const toggleDisableCodeDriftDetection = () => {
    setDisableCodeDriftDetection(prev => !prev);
  };

  const toggleShowCodeDetails = () => {
    setShowCodeDetails(prev => !prev);
  };

  const toggleHideSameCodeHighlights = () => {
    setHideSameCodeHighlights(prev => !prev);
  };

  return {
    showHoverTooltips,
    showAuthorInfo: showAuthor, // Export with correct logic
    toggleHoverTooltips,
    toggleAuthorInfo: toggleAuthor,
    disableHighlightManagement,
    toggleDisableHighlightManagement,
    disableCodeDriftDetection,
    toggleDisableCodeDriftDetection,
    showCodeDetails,
  toggleShowCodeDetails,
  hideSameCodeHighlights,
  toggleHideSameCodeHighlights
  };
};
