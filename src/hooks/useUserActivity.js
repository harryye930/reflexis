import { useEffect } from 'react';
import { doc, setDoc } from 'firebase/firestore';
import { db } from '../lib/firebase.js';

export const useUserActivity = (appId, currentUser) => {
  useEffect(() => {
    if (!currentUser) return;

    const updateActivity = async () => {
      try {
        const userDocRef = doc(db, `artifacts/${appId}/public/data/users`, currentUser.uid);
        // Only update lastSeen, don't accidentally overwrite other fields
        await setDoc(userDocRef, {
          lastSeen: new Date()
        }, { merge: true });
      } catch (error) {
        console.error('Error updating user activity:', error);
      }
    };

    // Update immediately and then every 30 seconds
    updateActivity();
    const interval = setInterval(updateActivity, 30000);
    return () => clearInterval(interval);
  }, [appId, currentUser]);
};
