import { useState, useEffect } from 'react';
import { collection, onSnapshot, addDoc, deleteDoc, doc, query, where } from 'firebase/firestore';
import { db } from '../lib/firebase.js';

export const useHighlights = (appId, currentUser, documentId) => {
  const [highlights, setHighlights] = useState([]);

  useEffect(() => {
    if (!currentUser || !documentId) {
      setHighlights([]);
      return;
    }

    const highlightsCollection = collection(db, `artifacts/${appId}/public/data/highlights`);
    // Filter highlights by document ID
    const highlightsQuery = query(highlightsCollection, where('documentId', '==', documentId));
    
    const unsubscribe = onSnapshot(highlightsQuery, (snapshot) => {
      const highlightsData = snapshot.docs.map(doc => ({ id: doc.id, ...doc.data() }));
      setHighlights(highlightsData);
    });

    return () => unsubscribe();
  }, [appId, currentUser, documentId]);

  const addHighlight = async (highlightData) => {
    if (!currentUser || !highlightData.documentId) return { success: false, error: 'Missing user or document ID' };

    try {
      const highlightsCollection = collection(db, `artifacts/${appId}/public/data/highlights`);
      await addDoc(highlightsCollection, {
        ...highlightData,
        userId: currentUser.uid,
        createdAt: new Date()
      });
      return { success: true };
    } catch (error) {
      console.error("Error adding highlight: ", error);
      return { success: false, error };
    }
  };

  const deleteHighlight = async (id) => {
    try {
      await deleteDoc(doc(db, `artifacts/${appId}/public/data/highlights`, id));
      return { success: true };
    } catch (error) {
      console.error("Error deleting highlight: ", error);
      return { success: false, error };
    }
  };

  return { highlights, addHighlight, deleteHighlight };
};
