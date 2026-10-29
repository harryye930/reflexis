// A visitor's own OpenAI key. It lives only in this tab's memory: never in browser storage or Firebase.
let openAIKey = '';
const listeners = new Set();

export const getOpenAIKey = () => openAIKey;

export function setOpenAIKey(value) {
  openAIKey = (value || '').trim();
  listeners.forEach(listener => listener());
}

export function subscribeOpenAIKey(listener) {
  listeners.add(listener);
  return () => listeners.delete(listener);
}
