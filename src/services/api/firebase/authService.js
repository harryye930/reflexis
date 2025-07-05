import { onAuthStateChanged, signInAnonymously } from 'firebase/auth';
import { doc, setDoc, getDoc } from 'firebase/firestore';
import { auth, db } from '../../../lib/firebase.js';
import { getAvailableColor } from '../../../lib/utils/colorUtils.js';

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
      const userDocRef = doc(db, `artifacts/${this.appId}/public/data/users`, userId);
      await setDoc(userDocRef, {
        name: displayName,
        researchBackground,
        profileCompleted: true,
        lastSeen: new Date()
      }, { merge: true });
      
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
} 