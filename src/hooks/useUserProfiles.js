import { useState, useEffect, useMemo } from 'react';
import { UserService } from '../services/api/firebase/userService.js';

export const useUserProfiles = (projectId, currentUser) => {
  const [userProfiles, setUserProfiles] = useState({});
  const [userProfilesLoaded, setUserProfilesLoaded] = useState(false);
  const userService = useMemo(() => (
    projectId ? new UserService(projectId) : null
  ), [projectId]);

  useEffect(() => {
    if (!currentUser || !projectId || !userService) {
      setUserProfiles({});
      setUserProfilesLoaded(false);
      return;
    }

    const unsubscribe = userService.onUsersSnapshot((profiles) => {
      setUserProfiles(profiles);
      setUserProfilesLoaded(true);
    });

    return () => unsubscribe();
  }, [projectId, currentUser, userService]);

  return { userProfiles, userProfilesLoaded };
};
