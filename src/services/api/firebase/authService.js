import {
  createUserWithEmailAndPassword,
  onAuthStateChanged,
  signInWithEmailAndPassword,
  signOut as firebaseSignOut,
  updateProfile
} from 'firebase/auth';
import { doc, setDoc, getDoc } from 'firebase/firestore';
import { auth, db } from '../../../lib/firebase.js';
import { ResearchBackgroundSummaryService } from './researchBackgroundSummaryService.js';

const toAuthError = (error) => ({
  code: error?.code || 'auth/unknown',
  message: error?.message || 'Authentication failed'
});

export class AuthService {
  // Listen to authentication state changes
  onAuthStateChange(callback) {
    return onAuthStateChanged(auth, callback);
  }

  async signUp(email, password) {
    try {
      const credential = await createUserWithEmailAndPassword(auth, email, password);
      await this.createUserDocument(credential.user.uid, {
        userId: credential.user.uid,
        email: credential.user.email,
        profileCompleted: false,
        createdAt: new Date(),
        lastSeen: new Date()
      });
      return { success: true, user: credential.user };
    } catch (error) {
      return { success: false, error: toAuthError(error) };
    }
  }

  async signIn(email, password) {
    try {
      const credential = await signInWithEmailAndPassword(auth, email, password);
      return { success: true, user: credential.user };
    } catch (error) {
      return { success: false, error: toAuthError(error) };
    }
  }

  async signOut() {
    try {
      await firebaseSignOut(auth);
      return { success: true };
    } catch (error) {
      console.error('Error signing out:', error);
      return { success: false, error };
    }
  }

  // Get user document from Firestore
  async getUserDocument(userId) {
    try {
      const userDocRef = doc(db, 'users', userId);
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
      const userDocRef = doc(db, 'users', userId);
      await setDoc(userDocRef, userData);
      return { success: true };
    } catch (error) {
      console.error('Error creating user document:', error);
      return { success: false, error };
    }
  }

  // Update user document
  async updateUserDocument(userId, updateData, options = {}) {
    try {
      // If research background is being updated, generate reduced version
      if (updateData.researchBackground && !options.skipResearchBackgroundSummary) {
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

      const userDocRef = doc(db, 'users', userId);
      await setDoc(userDocRef, updateData, { merge: true });
      return { success: true, data: updateData, reducedResearchBackground: updateData.reducedResearchBackground };
    } catch (error) {
      console.error('Error updating user document:', error);
      return { success: false, error };
    }
  }

  // Complete user profile
  async completeProfile(userId, displayName, researchBackground, options = {}) {
    try {
      // Generate reduced research background
      const summaryResult = options.skipResearchBackgroundSummary
        ? { success: false, error: 'LLM features are disabled in settings' }
        : await this.generateReducedResearchBackground(
            researchBackground,
            displayName
          );
      
      const updateData = {
        name: displayName,
        researchBackground,
        profileCompleted: true,
        lastSeen: new Date()
      };

      if (auth.currentUser?.uid === userId) {
        await updateProfile(auth.currentUser, { displayName });
      }

      // Add reduced research background if generation was successful
      if (summaryResult.success) {
        updateData.reducedResearchBackground = summaryResult.keywords;
      } else {
        console.warn('Failed to generate reduced research background:', summaryResult.error);
        // Continue with profile completion even if summary generation fails
      }

      const userDocRef = doc(db, 'users', userId);
      await setDoc(userDocRef, updateData, { merge: true });
      
      return { success: true, data: updateData, reducedResearchBackground: updateData.reducedResearchBackground };
    } catch (error) {
      console.error('Error completing profile:', error);
      return { success: false, error };
    }
  }

  async setupNewUser(user) {
    try {
      const userData = {
        userId: user.uid,
        email: user.email || null,
        name: user.displayName || '',
        lastSeen: new Date(),
        profileCompleted: false
      };
      
      return await this.createUserDocument(user.uid, userData);
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
