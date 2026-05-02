import { collection, onSnapshot, query } from 'firebase/firestore';
import { db } from '../../../lib/firebase.js';

export class UserService {
  constructor(projectId) {
    this.projectId = projectId;
  }

  // Listen to all members in the current project
  onUsersSnapshot(callback) {
    const usersCollection = collection(db, `projects/${this.projectId}/members`);
    const usersQuery = query(usersCollection);
    
    return onSnapshot(usersQuery, (snapshot) => {
      const profiles = {};
      snapshot.docs.forEach(doc => {
        const data = doc.data();
        
        // Ensure we have valid member data before adding to profiles
        if (data.userId && data.name && data.color) {
          profiles[data.userId] = { 
            name: data.name, 
            color: data.color,
            role: data.role || 'member',
            researchBackground: data.researchBackground || null,
            reducedResearchBackground: data.reducedResearchBackground || null
          };
        }
      });
      callback(profiles);
    });
  }

  // Get all members
  async getUsers() {
    try {
      const usersCollection = collection(db, `projects/${this.projectId}/members`);
      const usersQuery = query(usersCollection);

      const snapshot = await new Promise((resolve) => {
        const unsubscribe = onSnapshot(usersQuery, resolve, { includeMetadataChanges: true });
        setTimeout(() => unsubscribe(), 1000); // Timeout after 1 second
      });
      
      const profiles = {};
      snapshot.docs.forEach(doc => {
        const data = doc.data();
        
        // Ensure we have valid member data before adding to profiles
        if (data.userId && data.name && data.color) {
          profiles[data.userId] = { 
            name: data.name, 
            color: data.color,
            role: data.role || 'member',
            researchBackground: data.researchBackground || null,
            reducedResearchBackground: data.reducedResearchBackground || null
          };
        }
      });
      
      return { success: true, data: profiles };
    } catch (error) {
      console.error('Error getting users:', error);
      return { success: false, error };
    }
  }
}
