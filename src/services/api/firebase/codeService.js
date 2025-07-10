import { collection, onSnapshot, addDoc, deleteDoc, doc, updateDoc, query, setDoc, getDoc } from 'firebase/firestore';
import { db } from '../../../lib/firebase.js';
import { CodeHistoryService } from './codeHistoryService.js';

export class CodeService {
  constructor(appId) {
    this.appId = appId;
    this.historyService = new CodeHistoryService(appId);
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
      const docRef = await addDoc(codesCollection, {
        ...codeData,
        createdBy: userId,
        createdAt: new Date()
      });
      
      // Record code creation in history
      await this.historyService.recordCodeCreation(codeData.id, codeData, userId);
      
      return { success: true, docId: docRef.id };
    } catch (error) {
      console.error("Error adding code: ", error);
      return { success: false, error };
    }
  }

  // Update an existing code
  async updateCode(codeId, updateData, userId) {
    try {
      // Get old data for history tracking
      const oldResult = await this.getCode(codeId);
      if (!oldResult.success) {
        return { success: false, error: 'Code not found for update' };
      }
      
      const codeDocRef = doc(db, `artifacts/${this.appId}/public/data/codes`, codeId);
      await updateDoc(codeDocRef, {
        ...updateData,
        updatedBy: userId,
        updatedAt: new Date()
      });
      
      // Record code update in history
      await this.historyService.recordCodeUpdate(updateData.id, oldResult.data, updateData, userId);
      
      return { success: true, updatedBy: userId };
    } catch (error) {
      console.error("Error updating code: ", error);
      return { success: false, error };
    }
  }

  // Delete a code
  async deleteCode(docId) {
    try {
      // Get code data for history tracking
      const codeDocRef = doc(db, `artifacts/${this.appId}/public/data/codes`, docId);
      const codeSnap = await getDoc(codeDocRef);
      
      if (codeSnap.exists()) {
        const codeData = codeSnap.data();
        
        // Record code deletion in history
        await this.historyService.recordCodeDeletion(codeData.id, codeData, 'system');
        
        // Delete the code
        await deleteDoc(codeDocRef);
        
        return { success: true };
      } else {
        return { success: false, error: 'Code not found for deletion' };
      }
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

  // Record code application (when used in highlights)
  async recordCodeApplication(codeId, codeLabel, documentId, documentTitle, userId) {
    try {
      await this.historyService.recordCodeApplication(codeId, codeLabel, documentId, documentTitle, userId);
      
      // Check for usage milestones - make this optional in case indexes are not ready
      try {
        const usageStats = await this.historyService.getCodeUsageStats(codeId);
        if (usageStats.success) {
          await this.historyService.recordUsageMilestone(
            codeId, 
            codeLabel, 
            usageStats.data.totalApplications, 
            usageStats.data.uniqueDocuments
          );
        }
      } catch (statsError) {
        console.warn('Usage stats check failed (indexes may still be building):', statsError);
        // Continue without milestone tracking for now
      }
      
      return { success: true };
    } catch (error) {
      console.error("Error recording code application: ", error);
      return { success: false, error };
    }
  }

  // Get code history
  async getCodeHistory(codeId) {
    return await this.historyService.getCodeHistory(codeId);
  }

  // Get code usage statistics
  async getCodeUsageStats(codeId) {
    return await this.historyService.getCodeUsageStats(codeId);
  }

  // Listen to code history
  onCodeHistorySnapshot(codeId, callback) {
    return this.historyService.onCodeHistorySnapshot(codeId, callback);
  }
}