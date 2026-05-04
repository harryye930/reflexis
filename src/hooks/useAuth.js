import { useState, useEffect } from 'react';
import { AuthService } from '../services/api/firebase/authService.js';

export const useAuth = () => {
  const [currentUser, setCurrentUser] = useState(null);
  const [userProfile, setUserProfile] = useState(null);
  const [loading, setLoading] = useState(true);
  const [needsProfileSetup, setNeedsProfileSetup] = useState(false);
  const [setupError, setSetupError] = useState(null);
  const [authService] = useState(() => new AuthService());

  const getSetupErrorMessage = (error) => {
    const code = error?.code || '';
    if (code === 'permission-denied') {
      return 'Firebase is signed in, but Firestore rules have not been deployed for the new project/user data model yet.';
    }
    return error?.message || String(error || 'Failed to initialize your account.');
  };

  const completeProfile = async (displayName, researchBackground) => {
    if (!currentUser) return;
    
    try {
      const result = await authService.completeProfile(currentUser.uid, displayName, researchBackground);
      if (result.success) {
        setNeedsProfileSetup(false);
        setSetupError(null);
        const profileResult = await authService.getUserDocument(currentUser.uid);
        if (profileResult.success) {
          setUserProfile(profileResult.data);
        }
      } else {
        throw new Error(result.error);
      }
    } catch (error) {
      console.error('Error completing profile:', error);
      throw error;
    }
  };

  const signUp = async (email, password) => authService.signUp(email, password);
  const signIn = async (email, password) => authService.signIn(email, password);
  const logOut = async () => {
    const result = await authService.signOut();
    if (result.success) {
      setCurrentUser(null);
      setUserProfile(null);
      setNeedsProfileSetup(false);
      setSetupError(null);
    }
    return result;
  };

  useEffect(() => {
    const unsubscribe = authService.onAuthStateChange(async user => {
      if (user) {
        try {
          setSetupError(null);
          // Check if user document exists
          const userDocResult = await authService.getUserDocument(user.uid);
          
          if (!userDocResult.success) {
            if (userDocResult.error?.code === 'permission-denied') {
              setCurrentUser(user);
              setSetupError(getSetupErrorMessage(userDocResult.error));
              setLoading(false);
              return;
            }

            // Create new user document
            const setupResult = await authService.setupNewUser(user);
            if (setupResult.success) {
              setNeedsProfileSetup(true);
              setUserProfile({
                userId: user.uid,
                email: user.email || null,
                profileCompleted: false
              });
            } else {
              setCurrentUser(user);
              setSetupError(getSetupErrorMessage(setupResult.error));
              setLoading(false);
              return;
            }
          } else {
            const existingData = userDocResult.data;
            setUserProfile(existingData);
            
            // Check if user has completed profile setup
            if (!existingData.profileCompleted) {
              setNeedsProfileSetup(true);
            } else {
              setNeedsProfileSetup(false);
            }
            
            // Update lastSeen
            await authService.updateLastSeen(user.uid);
          }
          
          setCurrentUser(user);
          setLoading(false);
        } catch (error) {
          console.error('Error setting up user:', error);
          setCurrentUser(user);
          setSetupError(getSetupErrorMessage(error));
          setLoading(false);
        }
      } else {
        setCurrentUser(null);
        setUserProfile(null);
        setNeedsProfileSetup(false);
        setSetupError(null);
        setLoading(false);
      }
    });
    
    return () => unsubscribe();
  }, [authService]);

  return {
    currentUser,
    userProfile,
    loading,
    needsProfileSetup,
    setupError,
    completeProfile,
    signIn,
    signUp,
    logOut
  };
};
