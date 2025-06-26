import { useState, useEffect } from 'react';
import { onAuthStateChanged, signInAnonymously } from 'firebase/auth';
import { doc, getDoc, setDoc } from 'firebase/firestore';
import { auth, db } from '../lib/firebase.js';
import { getAvailableColor } from '../lib/utils/colorUtils.js';

export const useAuth = (appId) => {
  const [currentUser, setCurrentUser] = useState(null);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    const unsubscribe = onAuthStateChanged(auth, async user => {
      if (user) {
        try {
          // Check if user document already exists to avoid overwriting existing data
          const userDocRef = doc(db, `artifacts/${appId}/public/data/users`, user.uid);
          const userDoc = await getDoc(userDocRef);
          
          if (!userDoc.exists()) {
            // Only create new user document if it doesn't exist
            const assignedColor = await getAvailableColor(appId);
            const randomName = `User-${user.uid.substring(0, 4)}`;
            await setDoc(userDocRef, {
              userId: user.uid,
              name: randomName,
              color: assignedColor,
              lastSeen: new Date(),
              isAnonymous: user.isAnonymous
            });
          } else {
            const existingData = userDoc.data();
            
            // Check if existing document has all required fields
            if (!existingData.userId || !existingData.name || !existingData.color) {
              // Document exists but is incomplete, recreate it properly
              const assignedColor = await getAvailableColor(appId);
              const randomName = `User-${user.uid.substring(0, 4)}`;
              await setDoc(userDocRef, {
                userId: user.uid,
                name: randomName,
                color: assignedColor,
                lastSeen: new Date(),
                isAnonymous: user.isAnonymous
              });
            } else {
              // User exists with complete data, just update lastSeen
              await setDoc(userDocRef, {
                lastSeen: new Date()
              }, { merge: true });
            }
          }
          
          // Only set current user AFTER the user document is ready
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

  return { currentUser, loading };
};
