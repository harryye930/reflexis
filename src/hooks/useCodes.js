import { useState, useEffect, useMemo } from 'react';
import { defaultCodes } from '../constants/defaultCodes.js';
import { CodeService } from '../services/api/firebase/codeService.js';

export const useCodes = (projectId, currentUser) => {
  const [allCodes, setAllCodes] = useState([]);
  const [deletedCodes, setDeletedCodes] = useState([]);
  const [codesLoaded, setCodesLoaded] = useState(false);
  const codeService = useMemo(() => (
    projectId ? new CodeService(projectId) : null
  ), [projectId]);

  useEffect(() => {
    if (!currentUser || !projectId || !codeService) {
      // When no user, show empty array - codes will be loaded once user logs in
      setAllCodes([]);
      setDeletedCodes([]);
      setCodesLoaded(true);
      return;
    }

    let seedingDefaultCodes = false;

    const unsubscribeAllCodes = codeService.onCodesSnapshot(async (firebaseCodes) => {
      if (firebaseCodes.length === 0 && !seedingDefaultCodes) {
        seedingDefaultCodes = true;
        const seedResult = await codeService.ensureDefaultCodes(defaultCodes, currentUser.uid);
        seedingDefaultCodes = false;

        if (seedResult.success && seedResult.createdCount > 0) {
          return;
        }
      }

      // Filter active codes (not deleted)
      const activeCodes = firebaseCodes.filter(code => !code.isDeleted);
      // Filter deleted codes
      const deletedCodesData = firebaseCodes.filter(code => code.isDeleted);
      
      setAllCodes(activeCodes);
      setDeletedCodes(deletedCodesData);
      setCodesLoaded(true);
    });

    return () => {
      unsubscribeAllCodes();
    };
  }, [projectId, currentUser, codeService]);

  const addCode = async ({ label, description, color, textColor }) => {
    if (!currentUser) return { success: false, error: 'User not authenticated' };
    if (!codeService) return { success: false, error: 'No project selected' };

    // Generate a unique ID based on label
    const id = label.toLowerCase().replace(/[^a-z0-9]/g, '_');
    
    return await codeService.addCode({ id, label, description, color, textColor }, currentUser.uid);
  };

  const updateCode = async (docId, { label, description, color, textColor }) => {
    if (!currentUser) return { success: false, error: 'User not authenticated' };
    if (!codeService) return { success: false, error: 'No project selected' };

    // Find the logical ID for this document ID
    const codeToUpdate = allCodes.find(c => c.docId === docId || c.id === docId);
    if (!codeToUpdate) {
      return { success: false, error: 'Code not found' };
    }

    return await codeService.updateCode(docId, { 
      id: codeToUpdate.id, // Use the logical ID 
      label, 
      description, 
      color, 
      textColor 
    }, currentUser.uid);
  };

  const deleteCode = async (docId) => {
    if (!currentUser) return { success: false, error: 'User not authenticated' };
    if (!codeService) return { success: false, error: 'No project selected' };

    return await codeService.deleteCode(docId, currentUser.uid, 'User deleted');
  };

  const mergeCodes = async (mergeData) => {
    if (!currentUser) return { success: false, error: 'User not authenticated' };
    if (!codeService) return { success: false, error: 'No project selected' };

    return await codeService.mergeCodes(mergeData, currentUser.uid);
  };

  const splitCode = async (splitData) => {
    if (!currentUser) return { success: false, error: 'User not authenticated' };
    if (!currentUser.uid) return { success: false, error: 'User ID not available' };
    if (!codeService) return { success: false, error: 'No project selected' };

    const { type, ...data } = splitData;
    return await codeService.splitCode(type, data, currentUser.uid);
  };

  return { 
    allCodes, 
    deletedCodes,
    codesLoaded, 
    codeService,
    addCode, 
    updateCode, 
    deleteCode, 
    mergeCodes,
    splitCode
  };
};
