import { collection, onSnapshot, addDoc, query, where, orderBy, getDocs } from 'firebase/firestore';
import { db } from '../../../lib/firebase.js';

export class CodeHistoryService {
  constructor(appId) {
    this.appId = appId;
  }

  // Listen to code history for a specific code
  onCodeHistorySnapshot(codeId, callback) {
    const historyCollection = collection(db, `artifacts/${this.appId}/public/data/code_history`);
    const historyQuery = query(
      historyCollection,
      where('codeId', '==', codeId),
      orderBy('timestamp', 'desc')
    );
    
    return onSnapshot(historyQuery, (snapshot) => {
      const historyData = snapshot.docs.map(doc => ({ id: doc.id, ...doc.data() }));
      callback(historyData);
    });
  }

  // Add a new history entry
  async addHistoryEntry(historyData) {
    try {
      const historyCollection = collection(db, `artifacts/${this.appId}/public/data/code_history`);
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
      type: 'created',
      userId,
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

    return await this.addHistoryEntry({
      codeId,
      type: 'updated',
      userId,
      user: userId,
      description,
      changes
    });
  }

  // Record code deletion
  async recordCodeDeletion(codeId, codeData, userId) {
    return await this.addHistoryEntry({
      codeId,
      type: 'deleted',
      userId,
      user: userId,
      description: `Code "${codeData.label}" deleted`,
      changes: {
        deletedData: codeData
      }
    });
  }

  // Record code application (when used in highlights)
  async recordCodeApplication(codeId, codeLabel, documentId, documentTitle, userId) {
    return await this.addHistoryEntry({
      codeId,
      type: 'applied',
      userId,
      user: userId,
      description: `Code "${codeLabel}" applied to text in "${documentTitle}"`,
      changes: {
        documentId,
        documentTitle
      }
    });
  }

  // Record usage milestones
  async recordUsageMilestone(codeId, codeLabel, count, documentCount) {
    let milestone = '';
    if (count === 10) milestone = '10 applications';
    else if (count === 25) milestone = '25 applications';
    else if (count === 50) milestone = '50 applications';
    else if (count === 100) milestone = '100 applications';
    else if (count % 100 === 0) milestone = `${count} applications`;
    
    if (milestone) {
      return await this.addHistoryEntry({
        codeId,
        type: 'usage-milestone',
        userId: 'system',
        user: 'System',
        description: `Code "${codeLabel}" reached ${milestone} across ${documentCount} documents`,
        changes: {
          milestone,
          count,
          documentCount
        }
      });
    }
    
    return { success: true };
  }

  // Get code history for a specific code
  async getCodeHistory(codeId) {
    try {
      const historyCollection = collection(db, `artifacts/${this.appId}/public/data/code_history`);
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

  // Get usage statistics for a code
  async getCodeUsageStats(codeId) {
    try {
      // Get all application entries for this code
      const historyCollection = collection(db, `artifacts/${this.appId}/public/data/code_history`);
      const usageQuery = query(
        historyCollection,
        where('codeId', '==', codeId),
        where('type', '==', 'applied'),
        orderBy('timestamp', 'desc')
      );
      
      const snapshot = await getDocs(usageQuery);
      const applications = snapshot.docs.map(doc => ({ id: doc.id, ...doc.data() }));
      
      // Calculate stats
      const totalApplications = applications.length;
      const uniqueDocuments = new Set(applications.map(app => app.changes?.documentId)).size;
      const uniqueUsers = new Set(applications.map(app => app.userId)).size;
      const firstUsed = applications.length > 0 ? applications[applications.length - 1].timestamp : null;
      const lastUsed = applications.length > 0 ? applications[0].timestamp : null;
      
      return {
        success: true,
        data: {
          totalApplications,
          uniqueDocuments,
          uniqueUsers,
          firstUsed,
          lastUsed
        }
      };
    } catch (error) {
      console.error("Error getting code usage stats: ", error);
      return { success: false, error };
    }
  }
}
