import { useEffect } from 'react';
import { AuthService } from '../services/api/firebase/authService.js';

export const useUserActivity = (currentUser) => {
  useEffect(() => {
    if (!currentUser) return;

    const authService = new AuthService();

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
  }, [currentUser]);
};
