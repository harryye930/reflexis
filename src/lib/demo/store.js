import { createDemoSeed, DEMO_PROJECT_ID } from './seed.js';

let records;
const listeners = new Set();
const clone = (value) => JSON.parse(JSON.stringify(value));

export const isDemoPath = (path) => path === `projects/${DEMO_PROJECT_ID}` || path.startsWith(`projects/${DEMO_PROJECT_ID}/`);

function load() {
  if (!records) {
    try {
      // Remove data left by the earlier demo; current edits live only in memory.
      window.sessionStorage.removeItem('reflexis-demo-v1');
      window.sessionStorage.removeItem(`hoverPrefs_${DEMO_PROJECT_ID}`);
    } catch { /* Browser storage may be unavailable. */ }
    records = createDemoSeed();
  }
  return records;
}

function publish() {
  listeners.forEach(listener => listener());
}

export function readDemoRecords() { return clone(load()); }

export function writeDemoRecords(operations) {
  // Validate the whole batch before applying anything. Only this fixed local namespace is writable.
  const next = clone(load());
  operations.forEach(({ type, path, data, merge }) => {
    if (!isDemoPath(path)) throw new Error('Demo writes must stay inside the demo workspace.');
    if (type === 'delete') delete next[path];
    else {
      if (type === 'update' && !next[path]) throw new Error('Demo record not found.');
      next[path] = merge || type === 'update' ? { ...next[path], ...data } : data;
    }
  });
  records = next;
  publish();
}

export function subscribeDemo(callback) {
  listeners.add(callback);
  // Match Firestore's asynchronous initial snapshot; callers can safely capture unsubscribe.
  queueMicrotask(() => { if (listeners.has(callback)) callback(); });
  return () => listeners.delete(callback);
}

export function resetDemo() {
  records = createDemoSeed();
  publish();
}
