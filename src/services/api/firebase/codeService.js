import { collection, onSnapshot, addDoc, deleteDoc, doc, updateDoc, query, setDoc, getDoc, where, getDocs, writeBatch } from 'firebase/firestore';
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
  async addCode(codeData, userId, skipHistory = false) {
    try {
      const codesCollection = collection(db, `artifacts/${this.appId}/public/data/codes`);
      const docRef = await addDoc(codesCollection, {
        ...codeData,
        createdBy: userId,
        createdAt: new Date()
      });
      
      // Record code creation in history (unless skipped for merge operations)
      if (!skipHistory) {
        await this.historyService.recordCodeCreation(codeData.id, codeData, userId);
      }
      
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

  // Merge multiple codes
  async mergeCodes(mergeData, userId) {
    const { selectedCodes, strategy, resultConfig } = mergeData;
    
    try {
      let targetCodeId;
      let targetDocId;
      
      // Step 1: Handle target code creation or selection
      if (strategy === 'create_new') {
        // Create new code (skip automatic history recording for merge operations)
        const newCodeId = resultConfig.label.toLowerCase().replace(/[^a-z0-9]/g, '_');
        const addResult = await this.addCode({
          id: newCodeId,
          label: resultConfig.label,
          description: resultConfig.description,
          color: resultConfig.color,
          textColor: resultConfig.textColor
        }, userId, true); // Skip history - we'll record merge history instead
        
        if (!addResult.success) {
          return { success: false, error: 'Failed to create new merged code' };
        }
        
        targetCodeId = newCodeId;
        targetDocId = addResult.docId;
      } else {
        // Use existing code as target - handle new strategy format
        let targetCode;
        if (strategy.startsWith('merge_into_')) {
          const targetCodeId = strategy.replace('merge_into_', '');
          targetCode = selectedCodes.find(c => c.id === targetCodeId);
        } else {
          // Fallback for old format
          targetCode = strategy === 'merge_into_first' ? selectedCodes[0] : selectedCodes[1];
        }
        
        if (!targetCode) {
          return { success: false, error: 'Target code not found' };
        }
        
        targetCodeId = targetCode.id;
        targetDocId = targetCode.docId;
        
        // Update target code with new config
        const updateResult = await this.updateCode(targetDocId, {
          id: targetCodeId,
          label: resultConfig.label,
          description: resultConfig.description,
          color: resultConfig.color,
          textColor: resultConfig.textColor
        }, userId);
        
        if (!updateResult.success) {
          return { success: false, error: 'Failed to update target code' };
        }
      }
      
      // Step 2: Transfer highlights from source codes to target code
      let totalHighlightsMoved = 0;
      
      try {
        // Get all highlights for source codes
        const highlightsCollection = collection(db, `artifacts/${this.appId}/public/data/highlights`);
        
        for (const sourceCode of selectedCodes) {
          if (sourceCode.id === targetCodeId) continue; // Skip target code
          
          const highlightsQuery = query(
            highlightsCollection,
            where('code', '==', sourceCode.id)
          );
          
          const snapshot = await getDocs(highlightsQuery);
          
          // Update each highlight to use the target code
          const batch = writeBatch(db);
          let codeHighlightCount = 0;
          
          snapshot.docs.forEach(doc => {
            batch.update(doc.ref, { code: targetCodeId });
            codeHighlightCount++;
          });
          
          if (codeHighlightCount > 0) {
            await batch.commit();
            totalHighlightsMoved += codeHighlightCount;
          }
        }
      } catch (error) {
        console.error("Error transferring highlights: ", error);
        return { success: false, error: 'Failed to transfer highlights' };
      }
      
      // Step 3: Delete source codes (except target if merging into existing)
      try {
        for (const sourceCode of selectedCodes) {
          if (strategy !== 'create_new' && sourceCode.id === targetCodeId) {
            continue; // Skip target code in merge into existing strategies
          }
          
          const deleteResult = await this.deleteCode(sourceCode.docId || sourceCode.id);
          if (!deleteResult.success) {
            console.warn(`Failed to delete source code ${sourceCode.id}:`, deleteResult.error);
          }
        }
      } catch (error) {
        console.error("Error deleting source codes: ", error);
        // Don't fail the entire operation if deletion fails
      }
      
      // Step 4: Record merge history
      try {
        const historyResult = await this.historyService.recordCodeMerge({
          selectedCodes,
          strategy,
          resultConfig,
          targetCodeId,
          highlightTransferCount: totalHighlightsMoved
        }, userId);
        
        // No need to update merge history separately since we're passing the count directly
      } catch (error) {
        console.error("Error recording merge history: ", error);
        // Don't fail the operation if history recording fails
      }
      
      return { 
        success: true, 
        targetCodeId,
        highlightsMoved: totalHighlightsMoved
      };
      
    } catch (error) {
      console.error("Error merging codes: ", error);
      return { success: false, error: error.message };
    }
  }
}