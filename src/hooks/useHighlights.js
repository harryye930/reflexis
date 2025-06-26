import { useState, useEffect } from 'react';
import { collection, onSnapshot, addDoc, deleteDoc, doc } from 'firebase/firestore';
import { db } from '../lib/firebase.js';

export const useHighlights = (appId, currentUser) => {
  const [highlights, setHighlights] = useState([]);

  useEffect(() => {
    if (!currentUser) return;

    const highlightsCollection = collection(db, `artifacts/${appId}/public/data/highlights`);
    const unsubscribe = onSnapshot(highlightsCollection, (snapshot) => {
      const highlightsData = snapshot.docs.map(doc => ({ id: doc.id, ...doc.data() }));
      setHighlights(highlightsData);
    });

    return () => unsubscribe();
  }, [appId, currentUser]);

  const addHighlight = async (highlightData) => {
    if (!currentUser) return;

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
