import { auth } from './firebase.js';
import { getOpenAIKey } from './openaiKey.js';

export const authFetch = async (url, options = {}) => {
  const token = await auth.currentUser?.getIdToken();
  const headers = {
    ...(options.headers || {})
  };

  if (token) {
    headers.Authorization = `Bearer ${token}`;
  }

  if (getOpenAIKey()) {
    headers['X-OpenAI-Key'] = getOpenAIKey();
  }

  return fetch(url, {
    ...options,
    headers
  });
};
