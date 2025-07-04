import { useState, useEffect } from 'react';
import { onAuthStateChanged, signInAnonymously } from 'firebase/auth';
import { doc, setDoc, getDoc } from 'firebase/firestore';
import { auth, db } from '../lib/firebase.js';
import { getAvailableColor } from '../lib/utils/colorUtils.js';

export const useAuth = (appId) => {
  const [currentUser, setCurrentUser] = useState(null);
  const [loading, setLoading] = useState(true);
  const [needsProfileSetup, setNeedsProfileSetup] = useState(false);

  const completeProfile = async (displayName, researchBackground) => {
    if (!currentUser) return;
    
    try {
      const userDocRef = doc(db, `artifacts/${appId}/public/data/users`, currentUser.uid);
      await setDoc(userDocRef, {
        name: displayName,
        researchBackground,
        profileCompleted: true,
        lastSeen: new Date()
      }, { merge: true });
      
      setNeedsProfileSetup(false);
    } catch (error) {
      console.error('Error completing profile:', error);
      throw error;
    }
  };

  useEffect(() => {
    const unsubscribe = onAuthStateChanged(auth, async user => {
      if (user) {
        try {
          const userDocRef = doc(db, `artifacts/${appId}/public/data/users`, user.uid);
          const userDoc = await getDoc(userDocRef);
          
          if (!userDoc.exists()) {
            // Create new user document
            const assignedColor = await getAvailableColor(appId);
            await setDoc(userDocRef, {
              userId: user.uid,
              color: assignedColor,
              lastSeen: new Date(),
              isAnonymous: user.isAnonymous,
              profileCompleted: false
            });
            setNeedsProfileSetup(true);
          } else {
            const existingData = userDoc.data();
            
            // Check if user has completed profile setup
            if (!existingData.profileCompleted) {
              setNeedsProfileSetup(true);
            }
            
            // Update lastSeen
            await setDoc(userDocRef, {
              lastSeen: new Date()
            }, { merge: true });
          }
          
          setCurrentUser(user);
          setLoading(false);
        } catch (error) {
          console.error('Error setting up user:', error);
          setLoading(false);
        }
      } else {
        signInAnonymously(auth).catch(error => {
          console.error(error);
          setLoading(false);
        });
      }
    });
    return () => unsubscribe();
  }, [appId]);

  return { currentUser, loading, needsProfileSetup, completeProfile };
};
