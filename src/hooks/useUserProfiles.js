import { useState, useEffect } from 'react';
import { collection, onSnapshot, query } from 'firebase/firestore';
import { db } from '../lib/firebase.js';

export const useUserProfiles = (appId, currentUser) => {
  const [userProfiles, setUserProfiles] = useState({});
  const [userProfilesLoaded, setUserProfilesLoaded] = useState(false);

  useEffect(() => {
    if (!currentUser) return;

    const usersCollection = collection(db, `artifacts/${appId}/public/data/users`);
    const unsubscribe = onSnapshot(query(usersCollection), (snapshot) => {
      const profiles = {};
      snapshot.docs.forEach(doc => {
        const data = doc.data();
        
        // Ensure we have valid user data before adding to profiles
        if (data.userId && data.name && data.color) {
          profiles[data.userId] = { name: data.name, color: data.color };
        }
      });
      setUserProfiles(profiles);
      setUserProfilesLoaded(true);
    });

    return () => unsubscribe();
  }, [appId, currentUser]);

  return { userProfiles, userProfilesLoaded };
};
