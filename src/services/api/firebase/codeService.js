import { collection, onSnapshot, addDoc, deleteDoc, doc, updateDoc, query, setDoc, getDoc, where, getDocs, writeBatch, serverTimestamp } from 'firebase/firestore';
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
  async updateCode(docId, updateData, userId, skipHistory = false) {
    try {
      // Get old data for history tracking using the logical code ID
      const oldResult = await this.getCode(updateData.id);
      if (!oldResult.success) {
        return { success: false, error: 'Code not found for update' };
      }
      
      const codeDocRef = doc(db, `artifacts/${this.appId}/public/data/codes`, docId);
      await updateDoc(codeDocRef, {
        ...updateData,
        updatedBy: userId,
        updatedAt: new Date()
      });
      
      // Record code update in history (unless skipped for merge operations)
      if (!skipHistory) {
        await this.historyService.recordCodeUpdate(updateData.id, oldResult.data, updateData, userId);
      }
      
      return { success: true, updatedBy: userId };
    } catch (error) {
      console.error("Error updating code: ", error);
      return { success: false, error };
    }
  }

  // Delete a code (soft delete with isDeleted flag)
  async deleteCode(docId, userId = 'system', deletionReason = 'User deleted', skipHistory = false) {
    try {
      // Get code data for history tracking
      const codeDocRef = doc(db, `artifacts/${this.appId}/public/data/codes`, docId);
      const codeSnap = await getDoc(codeDocRef);
      
      if (codeSnap.exists()) {
        const codeData = codeSnap.data();
        
        // Record code deletion in history (unless skipped for merge operations)
        if (!skipHistory) {
          await this.historyService.recordCodeDeletion(codeData.id, codeData, userId, deletionReason);
        }
        
        // Soft delete: mark as deleted instead of hard delete
        await updateDoc(codeDocRef, {
          isDeleted: true,
          deletedAt: serverTimestamp(),
          deletedBy: userId,
          deletionReason: deletionReason
        });
        
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
      // Use the same logic as onCodesSnapshot: search by logical ID field first
      const codesCollection = collection(db, `artifacts/${this.appId}/public/data/codes`);
      const codeQuery = query(codesCollection, where('id', '==', codeId));
      const querySnapshot = await getDocs(codeQuery);
      
      if (!querySnapshot.empty) {
        const doc = querySnapshot.docs[0];
        return { success: true, data: { id: doc.data().id || doc.id, docId: doc.id, ...doc.data() } };
      }
      
      return { success: false, error: 'Code not found' };
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
        // Use existing code as target
        const extractedTargetCodeId = strategy.replace('merge_into_', '');
        const targetCode = selectedCodes.find(c => c.id === extractedTargetCodeId);
        
        if (!targetCode) {
          return { success: false, error: 'Target code not found' };
        }
        
        targetCodeId = targetCode.id;
        targetDocId = targetCode.docId;
        
        // Update target code with new config (skip history - we'll record merge history instead)
        const updateResult = await this.updateCode(targetDocId, {
          id: targetCodeId,
          label: resultConfig.label,
          description: resultConfig.description,
          color: resultConfig.color,
          textColor: resultConfig.textColor
        }, userId, true); // Skip history recording
        
        if (!updateResult.success) {
          return { success: false, error: 'Failed to update target code' };
        }
      }
      
      // Step 2: Transfer highlights and reflexive responses from source codes to target code
      let totalHighlightsMoved = 0;
      let totalReflexiveResponsesMoved = 0;
      
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
      
      // Step 2b: Transfer reflexive responses from source codes to target code
      try {
        const reflexiveCollection = collection(db, `artifacts/${this.appId}/public/data/reflexive_responses`);
        
        for (const sourceCode of selectedCodes) {
          if (sourceCode.id === targetCodeId) continue; // Skip target code
          
          const reflexiveQuery = query(
            reflexiveCollection,
            where('codeId', '==', sourceCode.id)
          );
          
          const snapshot = await getDocs(reflexiveQuery);
          
          // Update each reflexive response to use the target code
          const batch = writeBatch(db);
          let codeReflexiveCount = 0;
          
          snapshot.docs.forEach(doc => {
            batch.update(doc.ref, { 
              codeId: targetCodeId,
              codeLabel: resultConfig.label, // Update the code label reference too
              updatedAt: new Date()
            });
            codeReflexiveCount++;
          });
          
          if (codeReflexiveCount > 0) {
            await batch.commit();
            totalReflexiveResponsesMoved += codeReflexiveCount;
          }
        }
      } catch (error) {
        console.error("Error transferring reflexive responses: ", error);
        return { success: false, error: 'Failed to transfer reflexive responses' };
      }
      
      // Step 3: Delete source codes (except target if merging into existing)
      try {
        for (const sourceCode of selectedCodes) {
          if (strategy !== 'create_new' && sourceCode.id === targetCodeId) {
            continue; // Skip target code in merge into existing strategies
          }
          
          const deleteResult = await this.deleteCode(
            sourceCode.docId || sourceCode.id, 
            userId, 
            `Merged into "${resultConfig.label}"`,
            true // Skip history - we'll record merge history instead
          );
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
          highlightTransferCount: totalHighlightsMoved,
          reflexiveResponseTransferCount: totalReflexiveResponsesMoved
        }, userId);
      } catch (error) {
        console.error("Error recording merge history: ", error);
        // Don't fail the operation if history recording fails
      }
      
      return { 
        success: true, 
        targetCodeId,
        highlightsMoved: totalHighlightsMoved,
        reflexiveResponsesMoved: totalReflexiveResponsesMoved
      };
      
    } catch (error) {
      console.error("Error merging codes: ", error);
      return { success: false, error: error.message };
    }
  }

  // Split a code by reassigning its highlights to other codes
  async splitCode(type, splitData, userId) {
    // Validate userId first
    if (!userId) {
      return { success: false, error: 'Missing userId for split operation' };
    }
    
    const { codeId, reassignments, sourceCode, forceDeleteSourceCode } = splitData;

    try {
      if (type === 'getHighlights') {
        // Get all highlights for this code across all documents
        const highlightsCollection = collection(db, `artifacts/${this.appId}/public/data/highlights`);
        const highlightsQuery = query(highlightsCollection, where('code', '==', codeId));
        
        const snapshot = await getDocs(highlightsQuery);
        const highlights = snapshot.docs.map(doc => ({ 
          id: doc.id, 
          docId: doc.id, // Add docId for batch operations later
          ...doc.data() 
        }));
        
        // Enhance highlights with context information
        const { HighlightService } = await import('./highlightService.js');
        const highlightService = new HighlightService(this.appId);
        const highlightsWithContext = await highlightService.addContextToHighlights(highlights);
        
        return { success: true, highlights: highlightsWithContext };
      }

      if (type === 'getReflexiveCount') {
        // Get count of reflexive responses for a specific highlight and code
        const { highlightId, codeId } = splitData;
        const reflexiveCollection = collection(db, `artifacts/${this.appId}/public/data/reflexive_responses`);
        const reflexiveQuery = query(
          reflexiveCollection,
          where('highlightId', '==', highlightId),
          where('codeId', '==', codeId)
        );
        
        const snapshot = await getDocs(reflexiveQuery);
        return { success: true, count: snapshot.size };
      }

      if (type === 'checkReflexiveResponses') {
        // Check which highlights have reflexive responses that could be transferred
        const highlightsWithReflexive = [];
        const reflexiveCollection = collection(db, `artifacts/${this.appId}/public/data/reflexive_responses`);
        
        for (const [highlightId, assignment] of Object.entries(reassignments)) {
          const reflexiveQuery = query(
            reflexiveCollection,
            where('highlightId', '==', highlightId),
            where('codeId', '==', sourceCode.id)
          );
          
          const snapshot = await getDocs(reflexiveQuery);
          if (snapshot.size > 0) {
            highlightsWithReflexive.push({
              highlightId,
              newCodeId: assignment.newCodeId,
              reflexiveCount: snapshot.size
            });
          }
        }
        
        return { success: true, highlightsWithReflexive };
      }

      if (type === 'executeSplit') {
        let totalHighlightsReassigned = 0;
        let totalReflexiveResponsesTransferred = 0;

        // Step 1: Reassign highlights to new codes
        if (reassignments && Object.keys(reassignments).length > 0) {
          const highlightsCollection = collection(db, `artifacts/${this.appId}/public/data/highlights`);
          
          for (const [highlightId, assignment] of Object.entries(reassignments)) {
            const { newCodeId, transferReflexive } = assignment;
            
            // Update highlight to use new code
            const highlightDocRef = doc(highlightsCollection, highlightId);
            await updateDoc(highlightDocRef, {
              code: newCodeId,
              updatedAt: new Date()
            });
            totalHighlightsReassigned++;

            // Transfer reflexive responses if user chose to transfer for this specific highlight
            if (transferReflexive) {
              try {
                const reflexiveCollection = collection(db, `artifacts/${this.appId}/public/data/reflexive_responses`);
                const reflexiveQuery = query(
                  reflexiveCollection,
                  where('highlightId', '==', highlightId),
                  where('codeId', '==', sourceCode.id)
                );
                
                const reflexiveSnapshot = await getDocs(reflexiveQuery);
                const updateBatch = writeBatch(db);
                
                reflexiveSnapshot.docs.forEach(doc => {
                  updateBatch.update(doc.ref, {
                    codeId: newCodeId,
                    updatedAt: new Date()
                  });
                  totalReflexiveResponsesTransferred++;
                });
                
                if (reflexiveSnapshot.docs.length > 0) {
                  await updateBatch.commit();
                }
              } catch (reflexiveError) {
                console.warn(`Failed to transfer reflexive responses for highlight ${highlightId}:`, reflexiveError);
              }
            }
          }
        }

        // Step 2: Check if source code should be deleted
        let codeDeleted = false;
        const remainingHighlightsQuery = query(
          collection(db, `artifacts/${this.appId}/public/data/highlights`),
          where('code', '==', sourceCode.id)
        );
        const remainingSnapshot = await getDocs(remainingHighlightsQuery);
        
        // Delete the source code only if user explicitly chose to delete it AND no highlights remain
        if (forceDeleteSourceCode === true && remainingSnapshot.empty) {
          const deleteResult = await this.deleteCode(
            sourceCode.docId || sourceCode.id, 
            userId, 
            'Split operation - user chose to delete source code'
          );
          codeDeleted = deleteResult.success;
        }

        // Record split history
        try {
          await this.historyService.recordCodeSplit({
            sourceCode,
            reassignments,
            totalHighlightsReassigned,
            totalReflexiveResponsesDeleted: 0, // In splits, reflexive responses are transferred, not deleted
            codeDeleted
          }, userId);
        } catch (error) {
          console.error("Error recording split history: ", error);
          // Don't fail the operation if history recording fails
        }

        return {
          success: true,
          highlightsReassigned: totalHighlightsReassigned,
          reflexiveResponsesTransferred: totalReflexiveResponsesTransferred,
          codeDeleted
        };
      }

      return { success: false, error: 'Invalid split operation type' };
    } catch (error) {
      console.error("Error splitting code: ", error);
      return { success: false, error: error.message };
    }
  }
}