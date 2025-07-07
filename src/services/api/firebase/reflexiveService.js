import { collection, onSnapshot, addDoc, deleteDoc, doc, query, where, orderBy, updateDoc } from 'firebase/firestore';
import { db } from '../../../lib/firebase.js';

export class ReflexiveService {
  constructor(appId) {
    this.appId = appId;
  }

  // Listen to reflexive responses for a specific highlight
  onReflexiveResponsesSnapshot(highlightId, callback) {
    const responsesCollection = collection(db, `artifacts/${this.appId}/public/data/reflexive_responses`);
    const responsesQuery = query(
      responsesCollection, 
      where('highlightId', '==', highlightId),
      orderBy('createdAt', 'asc')
    );
    
    return onSnapshot(responsesQuery, (snapshot) => {
      const responsesData = snapshot.docs.map(doc => ({ id: doc.id, ...doc.data() }));
      callback(responsesData);
    });
  }

  // Add a new reflexive response
  async addReflexiveResponse(responseData, userId) {
    try {
      const responsesCollection = collection(db, `artifacts/${this.appId}/public/data/reflexive_responses`);
      await addDoc(responsesCollection, {
        ...responseData,
        userId,
        createdAt: new Date(),
        updatedAt: new Date()
      });
      return { success: true };
    } catch (error) {
      console.error("Error adding reflexive response: ", error);
      return { success: false, error };
    }
  }

  // Update an existing reflexive response
  async updateReflexiveResponse(responseId, updates, userId) {
    try {
      const responseRef = doc(db, `artifacts/${this.appId}/public/data/reflexive_responses`, responseId);
      await updateDoc(responseRef, {
        ...updates,
        updatedAt: new Date()
      });
      return { success: true };
    } catch (error) {
      console.error("Error updating reflexive response: ", error);
      return { success: false, error };
    }
  }

  // Delete a reflexive response
  async deleteReflexiveResponse(responseId) {
    try {
      await deleteDoc(doc(db, `artifacts/${this.appId}/public/data/reflexive_responses`, responseId));
      return { success: true };
    } catch (error) {
      console.error("Error deleting reflexive response: ", error);
      return { success: false, error };
    }
  }

  // Get all reflexive responses for a document (for analysis)
  async getDocumentReflexiveResponses(documentId) {
    try {
      const responsesCollection = collection(db, `artifacts/${this.appId}/public/data/reflexive_responses`);
      const responsesQuery = query(
        responsesCollection, 
        where('documentId', '==', documentId),
        orderBy('createdAt', 'desc')
      );
      
      return onSnapshot(responsesQuery, (snapshot) => {
        const responsesData = snapshot.docs.map(doc => ({ id: doc.id, ...doc.data() }));
        return responsesData;
      });
    } catch (error) {
      console.error("Error getting document reflexive responses: ", error);
      return { success: false, error };
    }
  }

  // Get reflexive responses by user (for personal reflection)
  async getUserReflexiveResponses(userId) {
    try {
      const responsesCollection = collection(db, `artifacts/${this.appId}/public/data/reflexive_responses`);
      const responsesQuery = query(
        responsesCollection, 
        where('userId', '==', userId),
        orderBy('createdAt', 'desc')
      );
      
      return onSnapshot(responsesQuery, (snapshot) => {
        const responsesData = snapshot.docs.map(doc => ({ id: doc.id, ...doc.data() }));
        return responsesData;
      });
    } catch (error) {
      console.error("Error getting user reflexive responses: ", error);
      return { success: false, error };
    }
  }
}
