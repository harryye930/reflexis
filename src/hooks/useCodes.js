import { useState, useEffect } from 'react';
import { collection, onSnapshot, addDoc, deleteDoc, doc, updateDoc, query, where } from 'firebase/firestore';
import { db } from '../lib/firebase.js';
import { availableCodes } from '../constants/index.js';

export const useCodes = (appId, currentUser) => {
  const [customCodes, setCustomCodes] = useState([]);
  const [allCodes, setAllCodes] = useState([]);

  useEffect(() => {
    if (!currentUser) {
      // When no user, just show default codes
      setAllCodes(availableCodes.map(code => ({ ...code, isCustom: false })));
      return;
    }

    // Listen for all codes in the system (not just user's codes)
    const codesCollection = collection(db, `artifacts/${appId}/public/data/codes`);
    
    const unsubscribe = onSnapshot(codesCollection, (snapshot) => {
      const userCodes = snapshot.docs.map(doc => ({ 
        id: doc.id, 
        docId: doc.id, // Keep track of Firebase document ID
        isCustom: true,
        ...doc.data() 
      }));
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
  }, [appId, currentUser]);

  const addCode = async ({ label, description, color, textColor }) => {
    if (!currentUser) return { success: false, error: 'User not authenticated' };

    try {
      // Generate a unique ID based on label
      const id = label.toLowerCase().replace(/[^a-z0-9]/g, '_');
      
      const codesCollection = collection(db, `artifacts/${appId}/public/data/codes`);
      await addDoc(codesCollection, {
        id,
        label,
        description,
        color,
        textColor,
        createdBy: currentUser.uid,
        createdAt: new Date()
      });
      
      return { success: true };
    } catch (error) {
      console.error("Error adding code: ", error);
      return { success: false, error };
    }
  };

  const updateCode = async (codeId, { label, description, color, textColor }) => {
    if (!currentUser) return { success: false, error: 'User not authenticated' };

    try {
      // Check if this is a default code that needs to be converted to a custom code
      const isDefaultCode = availableCodes.some(code => code.id === codeId);
      
      if (isDefaultCode) {
        // For default codes, create a new custom version that replaces the default
        const codesCollection = collection(db, `artifacts/${appId}/public/data/codes`);
        await addDoc(codesCollection, {
          id: codeId, // Use the same ID to replace the default
          label,
          description,
          color,
          textColor,
          createdBy: currentUser.uid,
          isDefaultReplacement: true, // Mark as a replacement for default
          createdAt: new Date()
        });
      } else {
        // For custom codes, update the existing document
        const codeDocRef = doc(db, `artifacts/${appId}/public/data/codes`, codeId);
        await updateDoc(codeDocRef, {
          label,
          description,
          color,
          textColor,
          updatedBy: currentUser.uid,
          updatedAt: new Date()
        });
      }
      
      return { success: true };
    } catch (error) {
      console.error("Error updating code: ", error);
      return { success: false, error };
    }
  };

  const deleteCode = async (docId) => {
    if (!currentUser) return { success: false, error: 'User not authenticated' };

    try {
      await deleteDoc(doc(db, `artifacts/${appId}/public/data/codes`, docId));
      return { success: true };
    } catch (error) {
      console.error("Error deleting code: ", error);
      return { success: false, error };
    }
  };

  return { 
    customCodes, 
    allCodes, 
    addCode, 
    updateCode, 
    deleteCode 
  };
};
