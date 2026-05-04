import { collection, doc, onSnapshot, query, updateDoc } from 'firebase/firestore';
import { db } from '../../../lib/firebase.js';

const buildProfileFromMemberData = (data) => ({
  name: data.name,
  color: data.color,
  role: data.role || 'member',
  researchBackground: data.researchBackground || null,
  reducedResearchBackground: data.reducedResearchBackground || null,
  initialDataView: data.initialDataView || '',
  initialDataViewReminderDismissedAt: data.initialDataViewReminderDismissedAt || null,
  preferences: data.preferences || null,
  disableLlm: data.preferences?.disableLlm ?? data.disableLlm ?? false,
  profileCompleted: !!data.profileCompleted,
  lastSeen: data.lastSeen || null
});

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
          profiles[data.userId] = buildProfileFromMemberData(data);
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
          profiles[data.userId] = buildProfileFromMemberData(data);
        }
      });
      
      return { success: true, data: profiles };
    } catch (error) {
      console.error('Error getting users:', error);
      return { success: false, error };
    }
  }

  async updateLastSeen(userId) {
    try {
      await updateDoc(doc(db, 'projects', this.projectId, 'members', userId), {
        lastSeen: new Date()
      });

      return { success: true };
    } catch (error) {
      console.error('Error updating project member activity:', error);
      return { success: false, error };
    }
  }
}
