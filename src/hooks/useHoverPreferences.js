import { doc, onSnapshot, updateDoc } from 'firebase/firestore';
import { useState, useEffect } from 'react';
import { db } from '../lib/firebase.js';

const DEFAULT_PREFERENCES = {
  showHoverTooltips: true,
  showAuthorInfo: true,
  disableHighlightManagement: false,
  disableCodeDriftDetection: false,
  disableLlm: false,
  showCodeDetails: true,
  hideSameCodeHighlights: false,
  showOnlyOwnCodes: false,
  hiddenUserIds: []
};

const sanitizeHiddenUserIds = (value) => {
  if (!Array.isArray(value)) return [];
  const seen = new Set();
  const result = [];
  for (const id of value) {
    if (typeof id === 'string' && id && !seen.has(id)) {
      seen.add(id);
      result.push(id);
    }
  }
  return result;
};

const normalizePreferenceValue = (preferences = {}) => ({
  ...DEFAULT_PREFERENCES,
  showHoverTooltips: preferences.showHoverTooltips ?? DEFAULT_PREFERENCES.showHoverTooltips,
  showAuthorInfo: preferences.showAuthorInfo ?? DEFAULT_PREFERENCES.showAuthorInfo,
  disableHighlightManagement: preferences.disableHighlightManagement ?? DEFAULT_PREFERENCES.disableHighlightManagement,
  disableCodeDriftDetection: preferences.disableCodeDriftDetection ?? DEFAULT_PREFERENCES.disableCodeDriftDetection,
  disableLlm: preferences.disableLlm ?? DEFAULT_PREFERENCES.disableLlm,
  showCodeDetails: preferences.showCodeDetails ?? DEFAULT_PREFERENCES.showCodeDetails,
  hideSameCodeHighlights: preferences.hideSameCodeHighlights ?? DEFAULT_PREFERENCES.hideSameCodeHighlights,
  showOnlyOwnCodes: preferences.showOnlyOwnCodes ?? DEFAULT_PREFERENCES.showOnlyOwnCodes,
  hiddenUserIds: sanitizeHiddenUserIds(preferences.hiddenUserIds)
});

const getStoredPreferences = (appId) => {
  if (!appId) return null;

  try {
    const savedPrefs = localStorage.getItem(`hoverPrefs_${appId}`);
    if (!savedPrefs) return null;

    const prefs = JSON.parse(savedPrefs);
    return normalizePreferenceValue({
      showHoverTooltips: prefs.showHoverTooltips,
      // Legacy localStorage stored this with inverted meaning.
      showAuthorInfo: prefs.preferencesVersion >= 2
        ? prefs.showAuthorInfo
        : !(prefs.showAuthorInfo ?? false),
      disableHighlightManagement: prefs.disableHighlightManagement,
      disableCodeDriftDetection: prefs.disableCodeDriftDetection,
      disableLlm: prefs.disableLlm,
      showCodeDetails: prefs.showCodeDetails,
      hideSameCodeHighlights: prefs.hideSameCodeHighlights,
      showOnlyOwnCodes: prefs.showOnlyOwnCodes,
      hiddenUserIds: prefs.hiddenUserIds
    });
  } catch (error) {
    console.warn('Error reading stored preferences:', error);
    return null;
  }
};

export const useHoverPreferences = (appId, currentUser = null) => {
  const [showHoverTooltips, setShowHoverTooltips] = useState(true);
  const [showAuthor, setShowAuthor] = useState(true); // Show author info by default - true = show individual colors and names, false = unified color and no names
  const [disableHighlightManagement, setDisableHighlightManagement] = useState(false);
  const [disableCodeDriftDetection, setDisableCodeDriftDetection] = useState(false);
  const [disableLlm, setDisableLlm] = useState(false);
  const [showCodeDetails, setShowCodeDetails] = useState(true);
  // When true: hide highlights where all overlapping codings use the same code
  const [hideSameCodeHighlights, setHideSameCodeHighlights] = useState(false);
  // When true: hide codes in the codebook authored by other collaborators
  const [showOnlyOwnCodes, setShowOnlyOwnCodes] = useState(false);
  // List of collaborator user IDs whose highlights are currently hidden
  const [hiddenUserIds, setHiddenUserIds] = useState([]);

  const currentPreferences = {
    showHoverTooltips,
    showAuthorInfo: showAuthor,
    disableHighlightManagement,
    disableCodeDriftDetection,
    disableLlm,
    showCodeDetails,
    hideSameCodeHighlights,
    showOnlyOwnCodes,
    hiddenUserIds
  };

  const applyPreferences = (preferences) => {
    const normalized = normalizePreferenceValue(preferences);
    setShowHoverTooltips(normalized.showHoverTooltips);
    setShowAuthor(normalized.showAuthorInfo);
    setDisableHighlightManagement(normalized.disableHighlightManagement);
    setDisableCodeDriftDetection(normalized.disableCodeDriftDetection);
    setDisableLlm(normalized.disableLlm);
    setShowCodeDetails(normalized.showCodeDetails);
    setHideSameCodeHighlights(normalized.hideSameCodeHighlights);
    setShowOnlyOwnCodes(normalized.showOnlyOwnCodes);
    setHiddenUserIds(normalized.hiddenUserIds);
  };

  // Load preferences from localStorage on mount
  useEffect(() => {
    const storedPreferences = getStoredPreferences(appId);
    if (storedPreferences) {
      applyPreferences(storedPreferences);
    }
  }, [appId]);

  // Keep project-user preferences synced to this user's member profile in Firebase.
  useEffect(() => {
    if (!appId || !currentUser?.uid) return undefined;

    const memberRef = doc(db, 'projects', appId, 'members', currentUser.uid);
    return onSnapshot(
      memberRef,
      (snapshot) => {
        if (!snapshot.exists()) return;

        const memberData = snapshot.data();
        if (memberData.preferences) {
          applyPreferences(normalizePreferenceValue({
            ...memberData.preferences,
            disableLlm: memberData.preferences.disableLlm ?? memberData.disableLlm
          }));
          return;
        }

        const migratedPreferences = normalizePreferenceValue({
          ...(getStoredPreferences(appId) || {}),
          disableLlm: memberData.disableLlm ?? getStoredPreferences(appId)?.disableLlm
        });

        applyPreferences(migratedPreferences);
        updateDoc(memberRef, {
          preferences: migratedPreferences,
          disableLlm: migratedPreferences.disableLlm,
          preferencesUpdatedAt: new Date()
        }).catch((error) => {
          console.warn('Error migrating project preferences:', error);
        });
      },
      (error) => {
        console.warn('Error loading project preferences:', error);
      }
    );
  }, [appId, currentUser?.uid]);

  // Save preferences to localStorage when they change
  useEffect(() => {
    const prefs = {
      showHoverTooltips,
      showAuthorInfo: showAuthor,
      disableHighlightManagement,
      disableCodeDriftDetection,
      disableLlm,
      showCodeDetails,
      hideSameCodeHighlights,
      showOnlyOwnCodes,
      hiddenUserIds,
      preferencesVersion: 2
    };
    localStorage.setItem(`hoverPrefs_${appId}`, JSON.stringify(prefs));
  }, [appId, showHoverTooltips, showAuthor, disableHighlightManagement, disableCodeDriftDetection, disableLlm, showCodeDetails, hideSameCodeHighlights, showOnlyOwnCodes, hiddenUserIds]);

  const savePreferences = (updates) => {
    const previousPreferences = currentPreferences;
    const nextPreferences = normalizePreferenceValue({
      ...currentPreferences,
      ...updates
    });

    applyPreferences(nextPreferences);

    if (!appId || !currentUser?.uid) return;

    const memberRef = doc(db, 'projects', appId, 'members', currentUser.uid);
    updateDoc(memberRef, {
      preferences: nextPreferences,
      disableLlm: nextPreferences.disableLlm,
      preferencesUpdatedAt: new Date()
    }).catch((error) => {
      console.warn('Error saving project preferences:', error);
      applyPreferences(previousPreferences);
    });
  };

  const toggleHoverTooltips = () => {
    savePreferences({ showHoverTooltips: !showHoverTooltips });
  };

  const toggleAuthor = () => {
    savePreferences({ showAuthorInfo: !showAuthor });
  };

  const toggleDisableHighlightManagement = () => {
    savePreferences({ disableHighlightManagement: !disableHighlightManagement });
  };

  const toggleDisableCodeDriftDetection = () => {
    savePreferences({ disableCodeDriftDetection: !disableCodeDriftDetection });
  };

  const toggleDisableLlm = () => {
    savePreferences({ disableLlm: !disableLlm });
  };

  const toggleShowCodeDetails = () => {
    savePreferences({ showCodeDetails: !showCodeDetails });
  };

  const toggleHideSameCodeHighlights = () => {
    savePreferences({ hideSameCodeHighlights: !hideSameCodeHighlights });
  };

  const toggleShowOnlyOwnCodes = () => {
    savePreferences({ showOnlyOwnCodes: !showOnlyOwnCodes });
  };

  const toggleHiddenUser = (userId) => {
    if (!userId) return;
    const isHidden = hiddenUserIds.includes(userId);
    const next = isHidden
      ? hiddenUserIds.filter((id) => id !== userId)
      : [...hiddenUserIds, userId];
    savePreferences({ hiddenUserIds: next });
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
    disableLlm,
    toggleDisableLlm,
    showCodeDetails,
  toggleShowCodeDetails,
  hideSameCodeHighlights,
  toggleHideSameCodeHighlights,
  showOnlyOwnCodes,
  toggleShowOnlyOwnCodes,
  hiddenUserIds,
  toggleHiddenUser
  };
};
