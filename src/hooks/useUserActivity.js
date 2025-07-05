import { useEffect } from 'react';
import { AuthService } from '../services/api/firebase/authService.js';

export const useUserActivity = (appId, currentUser) => {
  useEffect(() => {
    if (!currentUser) return;

    const authService = new AuthService(appId);

    const updateActivity = async () => {
      try {
        await authService.updateLastSeen(currentUser.uid);
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
