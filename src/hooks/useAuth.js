import { useState, useEffect } from 'react';
import { AuthService } from '../services/api/firebase/authService.js';

export const useAuth = (appId) => {
  const [currentUser, setCurrentUser] = useState(null);
  const [loading, setLoading] = useState(true);
  const [needsProfileSetup, setNeedsProfileSetup] = useState(false);
  const [authService] = useState(() => new AuthService(appId));

  const completeProfile = async (displayName, researchBackground) => {
    if (!currentUser) return;
    
    try {
      const result = await authService.completeProfile(currentUser.uid, displayName, researchBackground);
      if (result.success) {
        setNeedsProfileSetup(false);
      } else {
        throw new Error(result.error);
      }
    } catch (error) {
      console.error('Error completing profile:', error);
      throw error;
    }
  };

  useEffect(() => {
    const unsubscribe = authService.onAuthStateChange(async user => {
      if (user) {
        try {
          // Check if user document exists
          const userDocResult = await authService.getUserDocument(user.uid);
          
          if (!userDocResult.success) {
            // Create new user document
            const setupResult = await authService.setupNewUser(user.uid, user.isAnonymous);
            if (setupResult.success) {
              setNeedsProfileSetup(true);
            } else {
              throw new Error(setupResult.error);
            }
          } else {
            const existingData = userDocResult.data;
            
            // Check if user has completed profile setup
            if (!existingData.profileCompleted) {
              setNeedsProfileSetup(true);
            }
            
            // Update lastSeen
            await authService.updateLastSeen(user.uid);
          }
          
          setCurrentUser(user);
          setLoading(false);
        } catch (error) {
          console.error('Error setting up user:', error);
          setLoading(false);
        }
      } else {
        // Sign in anonymously
        const signInResult = await authService.signInAnonymously();
        if (!signInResult.success) {
          console.error('Error signing in anonymously:', signInResult.error);
          setLoading(false);
        }
      }
    });
    
    return () => unsubscribe();
  }, [appId, authService]);

  return { currentUser, loading, needsProfileSetup, completeProfile };
};
