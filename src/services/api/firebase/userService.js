import { collection, onSnapshot, query } from 'firebase/firestore';
import { db } from '../../../lib/firebase.js';

export class UserService {
  constructor(appId) {
    this.appId = appId;
  }

  // Listen to all users in the system
  onUsersSnapshot(callback) {
    const usersCollection = collection(db, `artifacts/${this.appId}/public/data/users`);
    const usersQuery = query(usersCollection);
    
    return onSnapshot(usersQuery, (snapshot) => {
      const profiles = {};
      snapshot.docs.forEach(doc => {
        const data = doc.data();
        
        // Ensure we have valid user data before adding to profiles
        if (data.userId && data.name && data.color) {
          profiles[data.userId] = { 
            name: data.name, 
            color: data.color,
            researchBackground: data.researchBackground || null,
            reducedResearchBackground: data.reducedResearchBackground || null
          };
        }
      });
      callback(profiles);
    });
  }

  // Get all users
  async getUsers() {
    try {
      const usersCollection = collection(db, `artifacts/${this.appId}/public/data/users`);
      const usersQuery = query(usersCollection);
      
      const snapshot = await new Promise((resolve) => {
        const unsubscribe = onSnapshot(usersQuery, resolve, { includeMetadataChanges: true });
        setTimeout(() => unsubscribe(), 1000); // Timeout after 1 second
      });
      
      const profiles = {};
      snapshot.docs.forEach(doc => {
        const data = doc.data();
        
        // Ensure we have valid user data before adding to profiles
        if (data.userId && data.name && data.color) {
          profiles[data.userId] = { 
            name: data.name, 
            color: data.color,
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