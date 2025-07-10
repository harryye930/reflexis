import { useState, useEffect } from 'react';
import { CodeService } from '../services/api/firebase/codeService.js';

export const useCodes = (appId, currentUser) => {
  const [allCodes, setAllCodes] = useState([]);
  const [codesLoaded, setCodesLoaded] = useState(false);
  const [codeService] = useState(() => new CodeService(appId));

  useEffect(() => {
    if (!currentUser) {
      // When no user, show empty array - codes will be loaded once user logs in
      setAllCodes([]);
      setCodesLoaded(true);
      return;
    }

    // Listen for all codes in the system - codes are initialized server-side during reset
    const unsubscribe = codeService.onCodesSnapshot((firebaseCodes) => {
      // All codes from Firebase are treated equally - no client-side initialization
      setAllCodes(firebaseCodes);
      setCodesLoaded(true);
    });

    return () => unsubscribe();
  }, [appId, currentUser, codeService]);

  const addCode = async ({ label, description, color, textColor }) => {
    if (!currentUser) return { success: false, error: 'User not authenticated' };

    // Generate a unique ID based on label
    const id = label.toLowerCase().replace(/[^a-z0-9]/g, '_');
    
    return await codeService.addCode({ id, label, description, color, textColor }, currentUser.uid);
  };

  const updateCode = async (codeId, { label, description, color, textColor }) => {
    if (!currentUser) return { success: false, error: 'User not authenticated' };

    // Do not pass createdBy here, only updatable fields
    return await codeService.updateCode(codeId, { 
      id: codeId, // Ensure the id stays the same
      label, 
      description, 
      color, 
      textColor 
    }, currentUser.uid);
  };

  const deleteCode = async (docId) => {
    if (!currentUser) return { success: false, error: 'User not authenticated' };

    return await codeService.deleteCode(docId);
  };

  const initializeDefaultCodes = async () => {
    if (!currentUser) return { success: false, error: 'User not authenticated' };

    return await codeService.initializeDefaultCodes(availableCodes, currentUser.uid);
  };

  const mergeCodes = async (mergeData) => {
    if (!currentUser) return { success: false, error: 'User not authenticated' };

    return await codeService.mergeCodes(mergeData, currentUser.uid);
  };

  return { 
    allCodes, 
    codesLoaded,
    addCode, 
    updateCode, 
    deleteCode,
    initializeDefaultCodes,
    mergeCodes
  };
};
