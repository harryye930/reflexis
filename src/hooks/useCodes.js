import { useState, useEffect } from 'react';
import { CodeService } from '../services/api/firebase/codeService.js';
import { availableCodes } from '../constants/index.js';

export const useCodes = (appId, currentUser) => {
  const [customCodes, setCustomCodes] = useState([]);
  const [allCodes, setAllCodes] = useState([]);
  const [codeService] = useState(() => new CodeService(appId));

  useEffect(() => {
    if (!currentUser) {
      // When no user, just show default codes
      setAllCodes(availableCodes.map(code => ({ ...code, isCustom: false })));
      return;
    }

    // Listen for all codes in the system (not just user's codes)
    const unsubscribe = codeService.onCodesSnapshot((userCodes) => {
      setCustomCodes(userCodes);
      
      // Start with default codes
      let combinedCodes = availableCodes.map(code => ({ 
        ...code, 
        isCustom: false,
        isDefault: true,
        canEdit: true,
        canDelete: false // Default codes can't be deleted, only edited
      }));
      
      // Check if any user codes replace default codes
      const defaultReplacements = userCodes.filter(code => code.isDefaultReplacement);
      
      // Replace default codes with custom versions where they exist
      defaultReplacements.forEach(replacement => {
        const index = combinedCodes.findIndex(code => code.id === replacement.id);
        if (index !== -1) {
          combinedCodes[index] = {
            ...replacement,
            isCustom: true,
            isDefault: false,
            canEdit: true,
            canDelete: true,
            replacedDefault: true
          };
        }
      });
      
      // Add purely custom codes (not replacements)
      const pureCustomCodes = userCodes.filter(code => !code.isDefaultReplacement);
      const customCodesFormatted = pureCustomCodes.map(code => ({
        ...code,
        canEdit: true,
        canDelete: true,
        isDefault: false
      }));
      
      combinedCodes = [...combinedCodes, ...customCodesFormatted];
      
      setAllCodes(combinedCodes);
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

    // Check if this is a default code that needs to be converted to a custom code
    const isDefaultCode = availableCodes.some(code => code.id === codeId);
    
    if (isDefaultCode) {
      // For default codes, create a new custom version that replaces the default
      return await codeService.createDefaultReplacement(codeId, { 
        label, 
        description, 
        color, 
        textColor 
      }, currentUser.uid);
    } else {
      // For custom codes, update the existing document
      return await codeService.updateCode(codeId, { 
        label, 
        description, 
        color, 
        textColor 
      }, currentUser.uid);
    }
  };

  const deleteCode = async (docId) => {
    if (!currentUser) return { success: false, error: 'User not authenticated' };

    return await codeService.deleteCode(docId);
  };

  return { 
    customCodes, 
    allCodes, 
    addCode, 
    updateCode, 
    deleteCode 
  };
};
