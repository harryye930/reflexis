import { collection, onSnapshot, addDoc, deleteDoc, doc, updateDoc, query, setDoc, getDoc } from 'firebase/firestore';
import { db } from '../../../lib/firebase.js';

export class CodeService {
  constructor(appId) {
    this.appId = appId;
  }

  // Listen to codes collection
  onCodesSnapshot(callback) {
    const codesCollection = collection(db, `artifacts/${this.appId}/public/data/codes`);
    
    return onSnapshot(codesCollection, (snapshot) => {
      const codes = snapshot.docs.map(doc => ({ 
        id: doc.data().id || doc.id, // Use the id from data first, fallback to docId
        docId: doc.id,
        ...doc.data() 
      }));
      callback(codes);
    });
  }

  // Add a new code
  async addCode(codeData, userId) {
    try {
      const codesCollection = collection(db, `artifacts/${this.appId}/public/data/codes`);
      await addDoc(codesCollection, {
        ...codeData,
        createdBy: userId,
        createdAt: new Date()
      });
      
      return { success: true };
    } catch (error) {
      console.error("Error adding code: ", error);
      return { success: false, error };
    }
  }

  // Update an existing code
  async updateCode(codeId, updateData, userId) {
    try {
      const codeDocRef = doc(db, `artifacts/${this.appId}/public/data/codes`, codeId);
      await updateDoc(codeDocRef, {
        ...updateData,
        updatedBy: userId,
        updatedAt: new Date()
      });
      
      return { success: true, updatedBy: userId };
    } catch (error) {
      console.error("Error updating code: ", error);
      return { success: false, error };
    }
  }

  // Delete a code
  async deleteCode(docId) {
    try {
      await deleteDoc(doc(db, `artifacts/${this.appId}/public/data/codes`, docId));
      return { success: true };
    } catch (error) {
      console.error("Error deleting code: ", error);
      return { success: false, error };
    }
  }

  // Get a single code by ID
  async getCode(codeId) {
    try {
      const codeDocRef = doc(db, `artifacts/${this.appId}/public/data/codes`, codeId);
      const codeSnap = await getDoc(codeDocRef);
      
      if (codeSnap.exists()) {
        return { success: true, data: { id: codeSnap.id, ...codeSnap.data() } };
      } else {
        return { success: false, error: 'Code not found' };
      }
    } catch (error) {
      console.error("Error getting code: ", error);
      return { success: false, error };
    }
  }
} 