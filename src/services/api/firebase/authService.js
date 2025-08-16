import { onAuthStateChanged, signInAnonymously } from 'firebase/auth';
import { doc, setDoc, getDoc } from 'firebase/firestore';
import { auth, db } from '../../../lib/firebase.js';
import { getAvailableColor } from '../../../lib/utils/colorUtils.js';
import { ResearchBackgroundSummaryService } from './researchBackgroundSummaryService.js';

export class AuthService {
  constructor(appId) {
    this.appId = appId;
  }

  // Listen to authentication state changes
  onAuthStateChange(callback) {
    return onAuthStateChanged(auth, callback);
  }

  // Sign in anonymously
  async signInAnonymously() {
    try {
      await signInAnonymously(auth);
      return { success: true };
    } catch (error) {
      console.error('Error signing in anonymously:', error);
      return { success: false, error };
    }
  }

  // Get user document from Firestore
  async getUserDocument(userId) {
    try {
      const userDocRef = doc(db, `artifacts/${this.appId}/public/data/users`, userId);
      const userDoc = await getDoc(userDocRef);
      
      if (userDoc.exists()) {
        return { success: true, data: userDoc.data() };
      } else {
        return { success: false, error: 'User document not found' };
      }
    } catch (error) {
      console.error('Error getting user document:', error);
      return { success: false, error };
    }
  }

  // Create new user document
  async createUserDocument(userId, userData) {
    try {
      const userDocRef = doc(db, `artifacts/${this.appId}/public/data/users`, userId);
      await setDoc(userDocRef, userData);
      return { success: true };
    } catch (error) {
      console.error('Error creating user document:', error);
      return { success: false, error };
    }
  }

  // Update user document
  async updateUserDocument(userId, updateData) {
    try {
      // If research background is being updated, generate reduced version
      if (updateData.researchBackground) {
        // Get user name for context (either from updateData or existing document)
        let userName = updateData.name;
        if (!userName) {
          const existingUserResult = await this.getUserDocument(userId);
          if (existingUserResult.success) {
            userName = existingUserResult.data.name;
          }
        }

        const summaryResult = await this.generateReducedResearchBackground(
          updateData.researchBackground,
          userName
        );
        
        if (summaryResult.success) {
          updateData.reducedResearchBackground = summaryResult.keywords;
        } else {
          console.warn('Failed to generate reduced research background:', summaryResult.error);
          // Continue with update even if summary generation fails
        }
      }

      const userDocRef = doc(db, `artifacts/${this.appId}/public/data/users`, userId);
      await setDoc(userDocRef, updateData, { merge: true });
      return { success: true };
    } catch (error) {
      console.error('Error updating user document:', error);
      return { success: false, error };
    }
  }

  // Complete user profile
  async completeProfile(userId, displayName, researchBackground) {
    try {
      // Generate reduced research background
      const summaryResult = await this.generateReducedResearchBackground(
        researchBackground,
        displayName
      );
      
      const updateData = {
        name: displayName,
        researchBackground,
        profileCompleted: true,
        lastSeen: new Date()
      };

      // Add reduced research background if generation was successful
      if (summaryResult.success) {
        updateData.reducedResearchBackground = summaryResult.keywords;
      } else {
        console.warn('Failed to generate reduced research background:', summaryResult.error);
        // Continue with profile completion even if summary generation fails
      }

      const userDocRef = doc(db, `artifacts/${this.appId}/public/data/users`, userId);
      await setDoc(userDocRef, updateData, { merge: true });
      
      return { success: true };
    } catch (error) {
      console.error('Error completing profile:', error);
      return { success: false, error };
    }
  }

  // Setup new user with color assignment
  async setupNewUser(userId, isAnonymous = false) {
    try {
      const assignedColor = await getAvailableColor(this.appId);
      const userData = {
        userId,
        color: assignedColor,
        lastSeen: new Date(),
        isAnonymous,
        profileCompleted: false
      };
      
      return await this.createUserDocument(userId, userData);
    } catch (error) {
      console.error('Error setting up new user:', error);
      return { success: false, error };
    }
  }

  // Update user's last seen timestamp
  async updateLastSeen(userId) {
    return await this.updateUserDocument(userId, {
      lastSeen: new Date()
    });
  }

  // Helper method to generate reduced research background
  async generateReducedResearchBackground(researchBackground, userName = null) {
    try {
      return await ResearchBackgroundSummaryService.generateSummary(
        researchBackground,
        userName
      );
    } catch (error) {
      console.error('Error generating reduced research background:', error);
      return {
        success: false,
        error: error.message || 'Failed to generate reduced research background'
      };
    }
  }
} 