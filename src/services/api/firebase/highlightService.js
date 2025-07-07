import { collection, onSnapshot, addDoc, deleteDoc, doc, query, where, setDoc } from 'firebase/firestore';
import { db } from '../../../lib/firebase.js';

export class HighlightService {
  constructor(appId) {
    this.appId = appId;
  }

  // Listen to highlights for a specific document
  onHighlightsSnapshot(documentId, callback) {
    const highlightsCollection = collection(db, `artifacts/${this.appId}/public/data/highlights`);
    const highlightsQuery = query(highlightsCollection, where('documentId', '==', documentId));
    
    return onSnapshot(highlightsQuery, (snapshot) => {
      const highlightsData = snapshot.docs.map(doc => ({ id: doc.id, ...doc.data() }));
      callback(highlightsData);
    });
  }

  // Add a new highlight
  async addHighlight(highlightData, userId) {
    try {
      const highlightsCollection = collection(db, `artifacts/${this.appId}/public/data/highlights`);
      const docRef = await addDoc(highlightsCollection, {
        ...highlightData,
        userId,
        createdAt: new Date()
      });
      return { success: true, highlightId: docRef.id };
    } catch (error) {
      console.error("Error adding highlight: ", error);
      return { success: false, error };
    }
  }

  // Delete a highlight
  async deleteHighlight(highlightId) {
    try {
      await deleteDoc(doc(db, `artifacts/${this.appId}/public/data/highlights`, highlightId));
      return { success: true };
    } catch (error) {
      console.error("Error deleting highlight: ", error);
      return { success: false, error };
    }
  }

  // Get highlights for a specific document
  async getHighlights(documentId) {
    try {
      const highlightsCollection = collection(db, `artifacts/${this.appId}/public/data/highlights`);
      const highlightsQuery = query(highlightsCollection, where('documentId', '==', documentId));
      
      const snapshot = await new Promise((resolve) => {
        const unsubscribe = onSnapshot(highlightsQuery, resolve, { includeMetadataChanges: true });
        setTimeout(() => unsubscribe(), 1000); // Timeout after 1 second
      });
      
      const highlightsData = snapshot.docs.map(doc => ({ id: doc.id, ...doc.data() }));
      return { success: true, data: highlightsData };
    } catch (error) {
      console.error("Error getting highlights: ", error);
      return { success: false, error };
    }
  }

  // Update a highlight
  async updateHighlight(highlightId, updateData) {
    try {
      const highlightDocRef = doc(db, `artifacts/${this.appId}/public/data/highlights`, highlightId);
      await setDoc(highlightDocRef, {
        ...updateData,
        updatedAt: new Date()
      }, { merge: true });
      
      return { success: true };
    } catch (error) {
      console.error("Error updating highlight: ", error);
      return { success: false, error };
    }
  }
} 