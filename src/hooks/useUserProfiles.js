import { useState, useEffect } from 'react';
import { UserService } from '../services/api/firebase/userService.js';

export const useUserProfiles = (appId, currentUser) => {
  const [userProfiles, setUserProfiles] = useState({});
  const [userProfilesLoaded, setUserProfilesLoaded] = useState(false);
  const [userService] = useState(() => new UserService(appId));

  useEffect(() => {
    if (!currentUser) return;

    const unsubscribe = userService.onUsersSnapshot((profiles) => {
      setUserProfiles(profiles);
      setUserProfilesLoaded(true);
    });

    return () => unsubscribe();
  }, [appId, currentUser, userService]);

  return { userProfiles, userProfilesLoaded };
};
