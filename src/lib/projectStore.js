// Firestore boundary: only the reserved demo project uses tab-local data.
// All other references and operations pass through to the Firebase SDK.
import * as firestore from 'firebase/firestore';
import { isDemoPath, readDemoRecords, writeDemoRecords, subscribeDemo } from './demo/store.js';
export * from 'firebase/firestore';

const isLocal = (ref) => ref?.demo === true;
const makeRef = (path) => ({ demo: true, path, id: path.split('/').pop() });
const pathFor = (parent, segments) => [isLocal(parent) ? parent.path : '', ...segments].filter(Boolean).join('/');

export function collection(parent, ...segments) {
  const path = pathFor(parent, segments);
  return isDemoPath(path) ? makeRef(path) : firestore.collection(parent, ...segments);
}
export function doc(parent, ...segments) {
  const path = pathFor(parent, segments);
  return isDemoPath(path) ? makeRef(path) : firestore.doc(parent, ...segments);
}
// Constraints are materialized by the SDK only for a real Firestore query.
export const where = (...args) => ({ constraint: 'where', args });
export const orderBy = (...args) => ({ constraint: 'orderBy', args });
export function query(ref, ...constraints) {
  return isLocal(ref) ? { ...ref, constraints } : firestore.query(ref, ...constraints.map(c => c.constraint ? firestore[c.constraint](...c.args) : c));
}

const snapshotDoc = (path, data) => ({
  id: path.split('/').pop(), ref: makeRef(path), exists: () => data !== undefined,
  data: () => data === undefined ? undefined : JSON.parse(JSON.stringify(data))
});
function snapshot(ref) {
  const records = readDemoRecords();
  if (ref.path.split('/').length % 2 === 0) return snapshotDoc(ref.path, records[ref.path]);
  let entries = Object.entries(records).filter(([path]) => path.startsWith(`${ref.path}/`) && path.split('/').length === ref.path.split('/').length + 1);
  for (const { constraint, args } of ref.constraints || []) {
    const [field, op, expected] = args;
    if (constraint === 'where') {
      if (op !== '==') throw new Error(`Unsupported demo query operator: ${op}`);
      entries = entries.filter(([, data]) => data[field] === expected);
    }
  }
  const sorts = (ref.constraints || []).filter(c => c.constraint === 'orderBy');
  entries.sort(([, a], [, b]) => {
    for (const { args: [field, direction] } of sorts) {
      const comparison = a[field] < b[field] ? -1 : a[field] > b[field] ? 1 : 0;
      if (comparison) return direction === 'desc' ? -comparison : comparison;
    }
    return 0;
  });
  const docs = entries.map(([path, data]) => snapshotDoc(path, data));
  return { docs, size: docs.length, empty: docs.length === 0, forEach: (callback) => docs.forEach(callback) };
}
export function onSnapshot(ref, ...args) {
  if (!isLocal(ref)) return firestore.onSnapshot(ref, ...args);
  const callback = args.find(arg => typeof arg === 'function');
  return subscribeDemo(() => callback(snapshot(ref)));
}
export const getDoc = (ref) => isLocal(ref) ? Promise.resolve(snapshot(ref)) : firestore.getDoc(ref);
export const getDocs = (ref) => isLocal(ref) ? Promise.resolve(snapshot(ref)) : firestore.getDocs(ref);
export const getCountFromServer = (ref) => isLocal(ref) ? Promise.resolve({ data: () => ({ count: snapshot(ref).size }) }) : firestore.getCountFromServer(ref);

const localData = (value) => {
  if (value?._methodName === 'serverTimestamp') return new Date().toISOString();
  if (value instanceof Date) return value.toISOString();
  if (Array.isArray(value)) return value.map(localData);
  if (value && typeof value === 'object') return Object.fromEntries(Object.entries(value).map(([key, item]) => [key, localData(item)]));
  return value;
};
const write = (type, ref, data, options) => writeDemoRecords([{ type, path: ref.path, data: localData(data), merge: options?.merge }]);
export async function setDoc(ref, data, options) {
  if (!isLocal(ref)) return firestore.setDoc(ref, data, options);
  write('set', ref, data, options);
}
export async function updateDoc(ref, data) {
  if (!isLocal(ref)) return firestore.updateDoc(ref, data);
  write('update', ref, data);
}
export async function deleteDoc(ref) {
  if (!isLocal(ref)) return firestore.deleteDoc(ref);
  write('delete', ref);
}
export async function addDoc(ref, data) {
  if (!isLocal(ref)) return firestore.addDoc(ref, data);
  const child = makeRef(`${ref.path}/${crypto.randomUUID()}`);
  write('set', child, data);
  return child;
}
export function writeBatch(db) {
  const operations = [];
  const batch = {};
  for (const type of ['set', 'update', 'delete']) {
    batch[type] = (ref, data, options) => { operations.push({ type, ref, data, options }); return batch; };
  }
  batch.commit = async () => {
    const demo = operations.some(op => isLocal(op.ref));
    if (demo) {
      if (operations.some(op => !isLocal(op.ref))) throw new Error('Cannot mix demo and Firebase writes.');
      writeDemoRecords(operations.map(op => ({ type: op.type, path: op.ref.path, data: localData(op.data), merge: op.options?.merge })));
    } else {
      const liveBatch = firestore.writeBatch(db);
      operations.forEach(op => {
        if (op.type === 'delete') liveBatch.delete(op.ref);
        else if (op.type === 'set') liveBatch.set(op.ref, op.data, op.options || {});
        else liveBatch.update(op.ref, op.data);
      });
      await liveBatch.commit();
    }
  };
  return batch;
}
