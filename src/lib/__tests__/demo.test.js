jest.mock('../firebase.js', () => ({ db: {}, auth: {} }));
jest.mock('firebase/firestore', () => ({
  collection: jest.fn(() => ({ live: true })),
  doc: jest.fn(() => ({ live: true })),
  query: jest.fn(ref => ref),
  where: jest.fn(), orderBy: jest.fn(),
  getDocs: jest.fn(async () => ({ docs: [], empty: true })),
  updateDoc: jest.fn(), setDoc: jest.fn(), deleteDoc: jest.fn(), addDoc: jest.fn(),
  writeBatch: jest.fn(), onSnapshot: jest.fn(),
  serverTimestamp: () => ({ _methodName: 'serverTimestamp' })
}));

import * as firebase from 'firebase/firestore';
import { collection, doc, getDocs, updateDoc, writeBatch, onSnapshot } from '../projectStore.js';
import { DEMO_PROJECT_ID, DEMO_USER_ID, createDemoSeed } from '../demo/seed.js';
import { resetDemo, readDemoRecords, writeDemoRecords } from '../demo/store.js';
import { CodeService } from '../../services/api/firebase/codeService.js';
import { HighlightService } from '../../services/api/firebase/highlightService.js';
import { ReflexiveService } from '../../services/api/firebase/reflexiveService.js';
import { defaultDocuments } from '../../constants/defaultDocuments.js';

beforeAll(() => {
  Object.defineProperty(global, 'crypto', { value: require('node:crypto').webcrypto, configurable: true });
});
beforeEach(() => { sessionStorage.clear(); resetDemo(); jest.clearAllMocks(); });
const root = `projects/${DEMO_PROJECT_ID}`;

test('the full default corpus and all sample annotations are consistent', () => {
  const records = createDemoSeed();
  const documents = Object.entries(records).filter(([path]) => path.includes('/documents/'));
  expect(documents).toHaveLength(defaultDocuments.length);
  Object.entries(records).filter(([path]) => path.includes('/highlights/')).forEach(([, h]) => {
    expect(records[`${root}/documents/${h.documentId}`].content.slice(h.startIndex, h.endIndex)).toBe(h.text);
    expect(records[`${root}/members/${h.userId}`]).toBeDefined();
  });
  expect(Object.keys(records).filter(path => path.includes('/reflexive_responses/'))).toHaveLength(9);
});

test('sample merge and split keep active coding, reflections and both sides of history consistent', () => {
  const records = createDemoSeed();
  const entries = Object.entries(records);
  const codes = Object.fromEntries(entries.filter(([path]) => path.includes('/codes/')).map(([, code]) => [code.id, code]));
  const highlights = Object.fromEntries(entries.filter(([path]) => path.includes('/highlights/')).map(([path, highlight]) => [path.split('/').pop(), highlight]));
  const responses = entries.filter(([path]) => path.includes('/reflexive_responses/')).map(([, response]) => response);
  const history = entries.filter(([path]) => path.includes('/code_history/')).map(([, event]) => event);
  expect(Object.values(codes).filter(code => !code.isDeleted)).toHaveLength(5);
  expect(Object.values(codes).filter(code => code.isDeleted)).toHaveLength(2);
  Object.values(highlights).forEach(highlight => expect(codes[highlight.code].isDeleted).not.toBe(true));
  responses.forEach(response => {
    expect(response.codeId).toBe(highlights[response.highlightId].code);
    expect(response.codeLabel).toBe(codes[response.codeId].label);
  });
  const mergeSource = history.find(event => event.type === 'merge_and_delete');
  const mergeTarget = history.find(event => event.type === 'merge' && event.codeId === mergeSource.changes.targetCodeId);
  expect(mergeTarget.changes.sourceCodeIds).toContain(mergeSource.codeId);
  expect(codes[mergeSource.codeId].targetCodeId).toBe(mergeTarget.codeId);
  expect(mergeSource.changes.highlightTransferCount).toBe(mergeTarget.changes.highlightTransferCount);
  expect(highlights['demo-verification'].code).toBe(mergeTarget.codeId);
  const split = history.find(event => event.type === 'split_and_delete');
  const received = history.filter(event => event.type === 'split' && event.changes.sourceCode.id === split.codeId);
  expect(received.map(event => event.codeId).sort()).toEqual(split.changes.targetCodes.map(code => code.id).sort());
  expect(received.reduce((count, event) => count + event.changes.highlightsReceived, 0)).toBe(split.changes.highlightTransferCount);
  expect(received.reduce((count, event) => count + event.changes.reflexiveResponsesReceived, 0)).toBe(split.changes.reflexiveResponseTransferCount);
  received.forEach(event => expect(+event.timestamp).toBeGreaterThanOrEqual(+split.timestamp));
  expect(highlights['demo-feedback-access'].code).toBe('public_voice');
  expect(highlights['demo-feedback-translation'].code).toBe('technical_translation');
});

test('coding, reflection, code edits, history and reset never call Firebase', async () => {
  const codes = new CodeService(DEMO_PROJECT_ID);
  const highlights = new HighlightService(DEMO_PROJECT_ID);
  const added = await codes.addCode({ id: 'demo_test', label: 'Test', description: 'A test code', color: 'bg-blue-200' }, DEMO_USER_ID);
  expect(added.success).toBe(true);
  expect((await codes.updateCode(added.docId, { id: 'demo_test', label: 'Revised' }, DEMO_USER_ID)).success).toBe(true);
  const highlight = await highlights.addHighlight({ documentId: defaultDocuments[0].id, text: 'My first thought', startIndex: 0, endIndex: 16, code: 'demo_test' }, DEMO_USER_ID);
  expect(highlight.success).toBe(true);
  await new ReflexiveService(DEMO_PROJECT_ID).addReflexiveResponse({ highlightId: highlight.highlightId, codeId: 'demo_test', response: 'An alternative reading', documentId: defaultDocuments[0].id }, DEMO_USER_ID);
  expect((await codes.getCodeHistory('demo_test')).data).toHaveLength(3);
  expect(Object.values(readDemoRecords()).some(record => record.response === 'An alternative reading')).toBe(true);
  expect(sessionStorage.length).toBe(0);
  await highlights.deleteHighlight(highlight.highlightId);
  expect((await highlights.getHighlights(defaultDocuments[0].id)).data.some(h => h.id === highlight.highlightId)).toBe(false);
  resetDemo();
  expect((await codes.getCode('demo_test')).success).toBe(false);
  Object.values(firebase).filter(value => jest.isMockFunction(value)).forEach(fn => expect(fn).not.toHaveBeenCalled());
});

test('merging codes moves demo highlights and notes with the existing service logic', async () => {
  const codes = new CodeService(DEMO_PROJECT_ID);
  const source = (await codes.getCode('public_voice')).data;
  const target = (await codes.getCode('invisible_work')).data;
  const result = await codes.mergeCodes({ selectedCodes: [source, target], strategy: 'merge_into_invisible_work', resultConfig: target, deleteSourceCodes: true }, DEMO_USER_ID);
  expect(result.success).toBe(true);
  const records = readDemoRecords();
  expect(records[`${root}/highlights/demo-work-maya`].code).toBe('invisible_work');
  expect(records[`${root}/reflexive_responses/note-maya-1`].codeId).toBe('invisible_work');
  expect((await codes.getCode('public_voice')).data.isDeleted).toBe(true);
  expect(firebase.writeBatch).not.toHaveBeenCalled();
});

test('fresh isolated stores cannot see each other’s changes', () => {
  const originalTab = readDemoRecords();
  writeDemoRecords([{ type: 'update', path: `${root}/members/${DEMO_USER_ID}`, data: { name: 'Visitor one' } }]);
  jest.isolateModules(() => {
    const secondTab = require('../demo/store.js');
    expect(secondTab.readDemoRecords()[`${root}/members/${DEMO_USER_ID}`].name).toBe(originalTab[`${root}/members/${DEMO_USER_ID}`].name);
    secondTab.writeDemoRecords([{ type: 'update', path: `${root}/members/${DEMO_USER_ID}`, data: { name: 'Visitor two' } }]);
    secondTab.resetDemo();
  });
  expect(readDemoRecords()[`${root}/members/${DEMO_USER_ID}`].name).toBe('Visitor one');
  // Reloading creates a fresh in-memory store, discarding the first visitor's edits.
  jest.isolateModules(() => {
    expect(require('../demo/store.js').readDemoRecords()[`${root}/members/${DEMO_USER_ID}`].name).toBe(originalTab[`${root}/members/${DEMO_USER_ID}`].name);
  });
  expect(sessionStorage.length).toBe(0);
});

test('subscribers update and unsubscribe, and mixed demo/live batches reject before writing', async () => {
  const member = doc({}, root, 'members', DEMO_USER_ID);
  const listener = jest.fn();
  const stop = onSnapshot(member, listener);
  await Promise.resolve();
  expect(listener).toHaveBeenCalledTimes(1);
  await updateDoc(member, { name: 'Changed locally' });
  expect(listener).toHaveBeenCalledTimes(2);
  stop();
  await updateDoc(member, { name: 'Changed again' });
  expect(listener).toHaveBeenCalledTimes(2);
  const batch = writeBatch({});
  batch.update(member, { name: 'Should not apply' });
  batch.update({ live: true }, { name: 'Live data' });
  await expect(batch.commit()).rejects.toThrow('Cannot mix');
  expect(readDemoRecords()[member.path].name).toBe('Changed again');
  expect(firebase.writeBatch).not.toHaveBeenCalled();
});

test('real project operations still go to Firebase', async () => {
  const ref = collection({}, 'projects/existing-project/documents');
  await getDocs(ref);
  await updateDoc(doc({}, 'projects/existing-project/members/real-user'), { name: 'Real user' });
  expect(firebase.collection).toHaveBeenCalledWith({}, 'projects/existing-project/documents');
  expect(firebase.getDocs).toHaveBeenCalledWith(ref);
  expect(firebase.updateDoc).toHaveBeenCalledWith({ live: true }, { name: 'Real user' });
});
