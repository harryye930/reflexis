import { collection, onSnapshot, addDoc, query, where, orderBy, getDocs, updateDoc } from 'firebase/firestore';
import { db } from '../../../lib/firebase.js';

export class CodeHistoryService {
  constructor(projectId) {
    this.projectId = projectId;
  }

  // Listen to code history for a specific code
  onCodeHistorySnapshot(codeId, callback) {
    try {
      const historyCollection = collection(db, `projects/${this.projectId}/code_history`);
      const historyQuery = query(
        historyCollection,
        where('codeId', '==', codeId),
        orderBy('timestamp', 'desc')
      );
      
      return onSnapshot(historyQuery, 
        (snapshot) => {
          try {
            const historyData = snapshot.docs.map(doc => ({ id: doc.id, ...doc.data() }));
            callback(historyData);
          } catch (error) {
            console.error('Error processing history snapshot:', error);
            callback([]);
          }
        },
        (error) => {
          console.error('Error in history snapshot listener:', error);
          callback([]);
        }
      );
    } catch (error) {
      console.error('Error setting up history listener:', error);
      // Return a dummy unsubscribe function
      return () => {};
    }
  }

  // Listen to all code history entries (across all codes)
  onAllHistorySnapshot(callback) {
    try {
      const historyCollection = collection(db, `projects/${this.projectId}/code_history`);
      const historyQuery = query(
        historyCollection,
        orderBy('timestamp', 'asc')
      );

      return onSnapshot(
        historyQuery,
        (snapshot) => {
          try {
            const historyData = snapshot.docs.map((doc) => ({ id: doc.id, ...doc.data() }));
            callback(historyData);
          } catch (error) {
            console.error('Error processing all-history snapshot:', error);
            callback([]);
          }
        },
        (error) => {
          console.error('Error in all-history snapshot listener:', error);
          callback([]);
        }
      );
    } catch (error) {
      console.error('Error setting up all-history listener:', error);
      return () => {};
    }
  }

  // Get all code history entries (across all codes)
  async getAllHistory() {
    try {
      const historyCollection = collection(db, `projects/${this.projectId}/code_history`);
      const historyQuery = query(historyCollection, orderBy('timestamp', 'asc'));
      const snapshot = await getDocs(historyQuery);
      const historyData = snapshot.docs.map((doc) => ({ id: doc.id, ...doc.data() }));
      return { success: true, data: historyData };
    } catch (error) {
      console.error('Error getting all code history: ', error);
      return { success: false, error };
    }
  }

  // Add a new history entry
  async addHistoryEntry(historyData) {
    try {
      // Validate required fields
      if (!historyData.userId) {
        throw new Error('Missing userId in history data');
      }
      
      if (!historyData.codeId) {
        throw new Error('Missing codeId in history data');
      }
      
      const historyCollection = collection(db, `projects/${this.projectId}/code_history`);
      await addDoc(historyCollection, {
        ...historyData,
        timestamp: new Date()
      });
      
      return { success: true };
    } catch (error) {
      console.error("Error adding code history entry: ", error);
      return { success: false, error };
    }
  }

  // Record code creation
  async recordCodeCreation(codeId, codeData, userId) {
    return await this.addHistoryEntry({
      codeId,
  type: 'create',
      userId: userId,
      user: userId, // Will be resolved to user name in the component
      description: `Code "${codeData.label}" created`,
      changes: {
        label: codeData.label,
        description: codeData.description,
        color: codeData.color
      }
    });
  }

  // Record code update
  async recordCodeUpdate(codeId, oldData, newData, userId) {
    const changes = {};
    let description = `Code "${newData.label}" updated`;
    
    // Track what changed
    if (oldData.label !== newData.label) {
      changes.label = { from: oldData.label, to: newData.label };
      description = `Code renamed from "${oldData.label}" to "${newData.label}"`;
    }
    
    if (oldData.description !== newData.description) {
      changes.description = { from: oldData.description, to: newData.description };
      if (!changes.label) {
        description = `Code "${newData.label}" description updated`;
      }
    }
    
    if (oldData.color !== newData.color || oldData.textColor !== newData.textColor) {
      changes.color = { 
        from: { bg: oldData.color, text: oldData.textColor },
        to: { bg: newData.color, text: newData.textColor }
      };
      if (!changes.label && !changes.description) {
        description = `Code "${newData.label}" color updated`;
      }
    }

    // Only record history if there are actual changes
    if (Object.keys(changes).length === 0) {
      console.log('No changes detected in code update, skipping history record');
      return { success: true, message: 'No changes detected' };
    }

    return await this.addHistoryEntry({
      codeId,
  type: 'update',
      userId: userId,
      user: userId,
      description,
      changes
    });
  }

  // Record code deletion
  async recordCodeDeletion(codeId, codeData, userId, deletionReason = 'User deleted') {
    return await this.addHistoryEntry({
      codeId,
  type: 'delete',
      userId: userId,
      user: userId,
      description: `Code "${codeData.label}" deleted: ${deletionReason}`,
      changes: {
        deletedData: codeData,
        deletionReason
      }
    });
  }

  // Record code application (when used in highlights)
  async recordCodeApplication(codeId, codeLabel, documentId, documentTitle, userId) {
    return await this.addHistoryEntry({
      codeId,
  type: 'apply',
      userId: userId,
      user: userId,
      description: `Code "${codeLabel}" applied to text in document "${documentTitle}"`,
      changes: {
        documentId,
        documentTitle
      }
    });
  }

  // Get code history for a specific code
  async getCodeHistory(codeId) {
    try {
      const historyCollection = collection(db, `projects/${this.projectId}/code_history`);
      const historyQuery = query(
        historyCollection,
        where('codeId', '==', codeId),
        orderBy('timestamp', 'desc')
      );
      
      const snapshot = await getDocs(historyQuery);
      const historyData = snapshot.docs.map(doc => ({ id: doc.id, ...doc.data() }));
      
      return { success: true, data: historyData };
    } catch (error) {
      console.error("Error getting code history: ", error);
      return { success: false, error };
    }
  }

  // Record code merge
  async recordCodeMerge(mergeData, userId) {
    try {
      const { selectedCodes, strategy, resultConfig, targetCodeId, highlightTransferCount = 0, reflexiveResponseTransferCount = 0, perSourceHighlightCount = {}, perSourceReflexiveCount = {}, deleteSourceCodes = false } = mergeData;
      
      // Validate input data
      if (!selectedCodes || !Array.isArray(selectedCodes) || selectedCodes.length === 0) {
        throw new Error('Invalid selectedCodes data');
      }
      
      if (!targetCodeId || !resultConfig) {
        throw new Error('Missing targetCodeId or resultConfig');
      }
      
      // Record merge event for the target/result code
  const mergeDescription = strategy === 'create_new' 
        ? `Code "${resultConfig.label}" populated by merging ${selectedCodes.length} codes: ${selectedCodes.map(c => c.label).join(', ')}`
        : `Code "${resultConfig.label}" updated by merging ${selectedCodes.length - 1} codes: ${selectedCodes.filter(c => c.id !== targetCodeId).map(c => c.label).join(', ')}`;

      await this.addHistoryEntry({
      codeId: targetCodeId,
  type: 'merge',
      userId: userId,
      user: userId,
      description: mergeDescription,
      changes: {
        strategy,
        sourceCodeIds: selectedCodes.map(c => c.id),
        sourceCodes: selectedCodes.map(c => ({
          id: c.id || 'unknown',
          label: c.label,
          description: c.description,
          color: c.color,
          textColor: c.textColor
        })),
        resultConfig,
        highlightTransferCount: highlightTransferCount,
        reflexiveResponseTransferCount: reflexiveResponseTransferCount,
        deleteSourceCodes
      }
    });

    // Record combined source-side MERGE_AND_DELETE events for source codes (except target if merging into existing)
    for (const sourceCode of selectedCodes) {
      if (strategy !== 'create_new' && sourceCode.id === targetCodeId) {
        continue; // Skip target code in merge into existing strategies
      }
      try {
        await this.addHistoryEntry({
          codeId: sourceCode.id,
          // Use appropriate action type based on whether codes were actually deleted
          type: deleteSourceCodes ? 'merge_and_delete' : 'merge',
          userId: userId,
          user: userId,
          description: deleteSourceCodes ? `Code "${sourceCode.label}" merged into "${resultConfig.label}" and deleted` : `Code "${sourceCode.label}" merged into "${resultConfig.label}"`,
          changes: {
            strategy,
            targetCode: {
              id: targetCodeId,
              label: resultConfig.label,
              description: resultConfig.description,
              color: resultConfig.color,
              textColor: resultConfig.textColor
            },
            sourceCodes: selectedCodes.map(c => ({
              id: c.id || 'unknown',
              label: c.label,
              description: c.description,
              color: c.color,
              textColor: c.textColor
            })),
            highlightTransferCount: perSourceHighlightCount[sourceCode.id] || 0,
            reflexiveResponseTransferCount: perSourceReflexiveCount[sourceCode.id] || 0,
            mergeOperation: true,
            deleted: deleteSourceCodes,
            targetCodeId: targetCodeId
          }
        });
      } catch (e) {
        console.warn('Failed to add source-side merged_and_deleted history entry:', e);
      }
    }

    return { success: true };
    } catch (error) {
      console.error('Error recording code merge:', error);
      return { success: false, error: error.message };
    }
  }

  // Record code split
  async recordCodeSplit(splitData, userId) {
    try {
      const { sourceCode, reassignments, totalHighlightsReassigned, totalReflexiveResponsesTransferred = 0, totalReflexiveResponsesDeleted, codeDeleted, targetCodesInfo } = splitData;
      
      // Validate input data
      if (!sourceCode) {
        throw new Error('Missing sourceCode data');
      }
      
      if (!userId) {
        throw new Error('Missing userId for split operation');
      }

      // Get target codes information - use provided info if available, otherwise fetch from DB
      let targetCodes = [];
      
      if (targetCodesInfo && Array.isArray(targetCodesInfo)) {
        // Use the provided target codes information
        targetCodes = targetCodesInfo;
      } else {
        // Fallback: fetch target codes from database
        const uniqueCodeIds = [...new Set(Object.values(reassignments).map(a => a.newCodeId))];
        
        for (const codeId of uniqueCodeIds) {
          try {
            const codeResult = await this.getCodeById(codeId);
            if (codeResult.success) {
              targetCodes.push({
                id: codeId,
                label: codeResult.data.label,
                description: codeResult.data.description,
                color: codeResult.data.color,
                textColor: codeResult.data.textColor
              });
            }
          } catch (error) {
            console.warn(`Could not fetch target code ${codeId}:`, error);
          }
        }
      }

      // Record split event for the source code; if deleted, use combined SPLIT_AND_DELETE action type
      const splitDescription = `Code "${sourceCode.label}" split into ${targetCodes.length} codes: ${targetCodes.map(c => c.label).join(', ')}`;

      await this.addHistoryEntry({
        codeId: sourceCode.id,
        type: codeDeleted ? 'split_and_delete' : 'split',
        userId: userId,
        user: userId,
        description: codeDeleted ? `${splitDescription} and deleted` : splitDescription,
        changes: {
          sourceCode: {
            id: sourceCode.id,
            label: sourceCode.label,
            description: sourceCode.description,
            color: sourceCode.color,
            textColor: sourceCode.textColor
          },
          targetCodes,
          reassignmentCount: Object.keys(reassignments).length,
          highlightTransferCount: totalHighlightsReassigned,
          reflexiveResponseTransferCount: totalReflexiveResponsesTransferred,
          reflexiveResponsesDeleted: totalReflexiveResponsesDeleted,
          codeDeleted
        }
      });

      // Record application events for target codes
      for (const targetCode of targetCodes) {
        const targetHighlightCount = Object.values(reassignments).filter(a => a.newCodeId === targetCode.id).length;
        // Compute per-target reflexive received if splitData provided it
        const perTarget = splitData.perTargetReflexiveReceived || {};
        const targetReflexiveCount = perTarget[targetCode.id] || 0;
        
        if (targetHighlightCount > 0) {
          await this.addHistoryEntry({
            codeId: targetCode.id,
            type: 'split',
            userId: userId,
            user: userId,
            description: `Code "${targetCode.label}" received ${targetHighlightCount} highlight${targetHighlightCount !== 1 ? 's' : ''} from split of "${sourceCode.label}"`,
            changes: {
              sourceCode: {
                id: sourceCode.id,
                label: sourceCode.label,
                description: sourceCode.description,
                color: sourceCode.color,
                textColor: sourceCode.textColor
              },
              highlightsReceived: targetHighlightCount,
              reflexiveResponsesReceived: targetReflexiveCount,
              splitOperation: true
            }
          });
        }
      }

      return { success: true };
    } catch (error) {
      console.error('Error recording code split:', error);
      return { success: false, error: error.message };
    }
  }

  // Helper method to get code by ID (needed for split recording)
  async getCodeById(codeId) {
    try {
      const codesCollection = collection(db, `projects/${this.projectId}/codes`);
      const q = query(codesCollection, where('id', '==', codeId));
      const snapshot = await getDocs(q);
      
      if (snapshot.empty) {
        return { success: false, error: 'Code not found' };
      }
      
      const doc = snapshot.docs[0];
      return { 
        success: true, 
        data: { id: doc.id, docId: doc.id, ...doc.data() } 
      };
    } catch (error) {
      console.error("Error getting code by ID: ", error);
      return { success: false, error };
    }
  }
}
