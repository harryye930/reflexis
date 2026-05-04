import { auth } from './firebase.js';

export const authFetch = async (url, options = {}) => {
  const token = await auth.currentUser?.getIdToken();
  const headers = {
    ...(options.headers || {})
  };

  if (token) {
    headers.Authorization = `Bearer ${token}`;
  }

  return fetch(url, {
    ...options,
    headers
  });
};
