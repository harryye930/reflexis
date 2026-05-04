/**
 * Tests for `projectService.js` — focused on `createProject` and
 * `deleteProject`, the two operations that fan out across many Firestore
 * paths and where a wrong write order can leave a project half-deleted.
 *
 * We replace `firebase/firestore` and `lib/firebase.js` with a minimal
 * in-memory fake so we can assert on the actual writes the service issues
 * (batch order matters for the deletion flow), and stub out the AI
 * summariser since it isn't relevant to project lifecycle.
 *
 * Tiers: simple (return shape), medium (writes hit every expected path),
 * complex (membership profile shape + deletion ordering / missing-data
 * resilience). The complex cases are the ones most likely to regress
 * silently when this file is refactored.
 *
 * Module-scope test state must be `mock`-prefixed for jest.mock factories
 * to reference it (see Jest's hoisting rules).
 */

// jsdom's `crypto` typically lacks `subtle`, and the property is often
// non-writable, so a plain assignment silently no-ops. Use defineProperty.
if (!global.crypto || !global.crypto.subtle) {
  Object.defineProperty(global, 'crypto', {
    value: require('node:crypto').webcrypto,
    writable: true,
    configurable: true
  });
}
if (typeof global.TextEncoder === 'undefined') {
  global.TextEncoder = require('node:util').TextEncoder;
}

const mockState = {
  store: new Map(),
  events: []
};

jest.mock('../../../../lib/firebase.js', () => ({ db: { __fakeDb: true } }));

jest.mock('../researchBackgroundSummaryService.js', () => ({
  ResearchBackgroundSummaryService: {
    generateSummary: jest.fn(async () => ({ success: true, keywords: 'mock-keywords' }))
  }
}));

jest.mock('firebase/firestore', () => {
  const refFromParent = (parent, segments) => {
    if (parent && parent.__fakeDb) {
      return segments.join('/');
    }
    if (parent && typeof parent.__path === 'string') {
      return [parent.__path, ...segments].join('/');
    }
    return segments.join('/');
  };

  const docFn = (parent, ...segments) => {
    if (segments.length === 0 && parent && parent.__isCollection) {
      const id = `auto_${Math.random().toString(36).slice(2, 12)}`;
      return { __isDoc: true, __path: `${parent.__path}/${id}`, id };
    }
    const path = refFromParent(parent, segments);
    return { __isDoc: true, __path: path, id: path.split('/').pop() };
  };

  const collectionFn = (parent, ...segments) => ({
    __isCollection: true,
    __path: refFromParent(parent, segments)
  });

  const getDoc = jest.fn(async (ref) => {
    const data = mockState.store.get(ref.__path);
    if (data === undefined) {
      return { exists: () => false, data: () => undefined, id: ref.id };
    }
    return { exists: () => true, data: () => data, id: ref.id };
  });

  const getDocs = jest.fn(async (ref) => {
    const prefix = `${ref.__path}/`;
    const docs = [];
    for (const [path, data] of mockState.store.entries()) {
      if (!path.startsWith(prefix)) continue;
      const remainder = path.slice(prefix.length);
      if (remainder.includes('/')) continue;
      docs.push({
        id: remainder,
        ref: { __isDoc: true, __path: path, id: remainder },
        data: () => data,
        exists: () => true
      });
    }
    return { docs, size: docs.length, empty: docs.length === 0 };
  });

  const deleteDoc = jest.fn(async (ref) => {
    mockState.store.delete(ref.__path);
    mockState.events.push({ kind: 'delete', path: ref.__path });
  });

  const updateDoc = jest.fn(async (ref, partial) => {
    const existing = mockState.store.get(ref.__path) || {};
    mockState.store.set(ref.__path, { ...existing, ...partial });
    mockState.events.push({ kind: 'update', path: ref.__path, data: partial });
  });

  const writeBatch = jest.fn(() => {
    const pending = [];
    return {
      set: (ref, data) => pending.push({ kind: 'set', path: ref.__path, data }),
      update: (ref, data) => pending.push({ kind: 'update', path: ref.__path, data }),
      delete: (ref) => pending.push({ kind: 'delete', path: ref.__path }),
      commit: jest.fn(async () => {
        for (const op of pending) {
          if (op.kind === 'set') {
            mockState.store.set(op.path, op.data);
          } else if (op.kind === 'update') {
            const existing = mockState.store.get(op.path) || {};
            mockState.store.set(op.path, { ...existing, ...op.data });
          } else if (op.kind === 'delete') {
            mockState.store.delete(op.path);
          }
          mockState.events.push(op);
        }
      })
    };
  });

  return {
    collection: collectionFn,
    deleteDoc,
    doc: docFn,
    getDoc,
    getDocs,
    onSnapshot: jest.fn(),
    query: (ref) => ref,
    updateDoc,
    writeBatch
  };
});

const { ProjectService } = require('../projectService.js');
const { userColors } = require('../../../../lib/utils/colorUtils.js');
const { defaultCodes } = require('../../../../constants/defaultCodes.js');
const { defaultDocuments } = require('../../../../constants/defaultDocuments.js');
const { parseResearchBackgroundFromStorage } = require('../../../../constants/researchBackground.js');

beforeEach(() => {
  mockState.store = new Map();
  mockState.events = [];
});

const buildUser = (overrides = {}) => ({
  uid: 'user-owner-1',
  email: 'owner@example.com',
  displayName: 'Owner User',
  ...overrides
});

const buildUserProfile = (overrides = {}) => ({
  name: 'Owner User',
  email: 'owner@example.com',
  researchBackground: [
    '## Brief History of Qualitative Data Analysis',
    '5 years grounded theory.',
    '',
    '## Background and Experience Effects on Interpretation',
    'Clinical lens may bias toward pathology.',
    '',
    '## Initial View of the Data',
    ''
  ].join('\n'),
  reducedResearchBackground: 'grounded-theory, clinical',
  profileCompleted: true,
  ...overrides
});

describe('ProjectService.createProject', () => {
  // simple
  test('returns a success payload with the new project id, name, and a join key', async () => {
    const service = new ProjectService();
    const result = await service.createProject({ name: '  Project Alpha  ' }, buildUser(), buildUserProfile());

    expect(result.success).toBe(true);
    expect(result.project.name).toBe('Project Alpha');
    expect(result.project.id).toMatch(/^auto_/);
    expect(result.joinKey).toEqual(expect.any(String));
    expect(result.joinKey.length).toBeGreaterThan(20);
    expect(result.project.joinKey).toBe(result.joinKey);
    expect(result.defaultContentCreated).toBe(true);
  });

  // medium
  test('writes project, owner membership, user-project index, invite settings, join-key lookup, and defaults atomically', async () => {
    const service = new ProjectService();
    const user = buildUser();
    const result = await service.createProject({ name: 'Project Beta' }, user, buildUserProfile());

    const projectId = result.project.id;
    const joinKeyHash = await service.hashJoinKey(result.joinKey);

    expect(mockState.store.get(`projects/${projectId}`)).toMatchObject({
      name: 'Project Beta',
      ownerId: user.uid,
      createdBy: user.uid
    });
    expect(mockState.store.get(`projects/${projectId}/members/${user.uid}`)).toMatchObject({
      userId: user.uid,
      role: 'owner',
      projectId
    });
    expect(mockState.store.get(`users/${user.uid}/projects/${projectId}`)).toMatchObject({
      projectId,
      role: 'owner',
      name: 'Project Beta'
    });
    expect(mockState.store.get(`projects/${projectId}/settings/invite`)).toMatchObject({
      joinKeyHash,
      joinKey: result.joinKey,
      updatedBy: user.uid
    });
    expect(mockState.store.get(`project_join_keys/${joinKeyHash}`)).toMatchObject({
      projectId,
      projectName: 'Project Beta',
      createdBy: user.uid
    });

    for (const seedDoc of defaultDocuments) {
      expect(mockState.store.has(`projects/${projectId}/documents/${seedDoc.id}`)).toBe(true);
    }
    for (const seedCode of defaultCodes) {
      expect(mockState.store.has(`projects/${projectId}/codes/${seedCode.docId}`)).toBe(true);
    }
  });

  // complex — the membership profile is what every other feature reads from,
  // so its shape needs to be pinned down carefully.
  test('owner membership profile carries a per-project initialDataView slot, palette color, and project-scoped research background', async () => {
    const service = new ProjectService();
    const user = buildUser();
    const userProfile = buildUserProfile();

    const result = await service.createProject({ name: 'Project Gamma' }, user, userProfile);
    const membership = mockState.store.get(`projects/${result.project.id}/members/${user.uid}`);

    expect(membership.role).toBe('owner');
    expect(userColors).toContain(membership.color);
    expect(membership.name).toBe(userProfile.name);
    expect(membership.email).toBe(user.email);
    expect(membership.profileCompleted).toBe(true);

    // initialDataView is per-project and must start empty even if the user
    // somehow has stale text from another project — we never inherit it.
    expect(membership.initialDataView).toBe('');
    expect(membership.initialDataViewReminderDismissedAt).toBeUndefined();

    // The stored research background is the user's history+experience with
    // an empty initialDataView header so the parser can fill it in later.
    const parsed = parseResearchBackgroundFromStorage(membership.researchBackground);
    expect(parsed.qualitativeHistory).toBe('5 years grounded theory.');
    expect(parsed.backgroundExperience).toBe('Clinical lens may bias toward pathology.');
    expect(parsed.initialDataView).toBe('');

    expect(membership.reducedResearchBackground).toBe('grounded-theory, clinical');
  });
});

describe('ProjectService.deleteProject', () => {
  const seedProject = ({ projectId = 'project-to-delete', joinKeyHash = 'hash-abc' } = {}) => {
    mockState.store.set(`projects/${projectId}`, {
      name: 'Doomed Project',
      ownerId: 'owner-uid'
    });
    mockState.store.set(`projects/${projectId}/members/owner-uid`, {
      userId: 'owner-uid',
      role: 'owner'
    });
    mockState.store.set(`projects/${projectId}/members/member-uid`, {
      userId: 'member-uid',
      role: 'member'
    });
    mockState.store.set(`users/owner-uid/projects/${projectId}`, { projectId, role: 'owner' });
    mockState.store.set(`users/member-uid/projects/${projectId}`, { projectId, role: 'member' });
    if (joinKeyHash) {
      mockState.store.set(`projects/${projectId}/settings/invite`, { joinKeyHash, joinKey: 'visible-key' });
      mockState.store.set(`project_join_keys/${joinKeyHash}`, { projectId });
    }
    mockState.store.set(`projects/${projectId}/member_secrets/member-uid`, { userId: 'member-uid' });
    mockState.store.set(`projects/${projectId}/documents/doc-1`, { content: 'hi' });
    mockState.store.set(`projects/${projectId}/codes/code-1`, { label: 'X' });
    mockState.store.set(`projects/${projectId}/highlights/h-1`, { text: 'sample' });
    return projectId;
  };

  // simple
  test('returns success and removes the project document', async () => {
    const service = new ProjectService();
    const projectId = seedProject();

    const result = await service.deleteProject(projectId, 'owner-uid');

    expect(result.success).toBe(true);
    expect(mockState.store.has(`projects/${projectId}`)).toBe(false);
  });

  // medium
  test('cleans up every project-scoped path and the global join-key lookup', async () => {
    const service = new ProjectService();
    const projectId = seedProject({ joinKeyHash: 'hash-xyz' });

    await service.deleteProject(projectId, 'owner-uid');

    const survivors = [...mockState.store.keys()].filter((path) =>
      path === `projects/${projectId}`
      || path.startsWith(`projects/${projectId}/`)
      || path === `project_join_keys/hash-xyz`
      || path === `users/owner-uid/projects/${projectId}`
      || path === `users/member-uid/projects/${projectId}`
    );
    expect(survivors).toEqual([]);
  });

  // complex — the owner membership doc must be removed *after* the project
  // doc itself, otherwise security rules that gate writes on the caller
  // still being a member will reject the project delete and leave orphans.
  test('deletes the current owner membership and project-list entry with the final project delete, and tolerates missing invite settings', async () => {
    const service = new ProjectService();
    const projectId = seedProject({ joinKeyHash: null });

    const result = await service.deleteProject(projectId, 'owner-uid');
    expect(result.success).toBe(true);

    const projectDocDeletedAt = mockState.events.findIndex(
      (event) => event.kind === 'delete' && event.path === `projects/${projectId}`
    );
    const ownerMemberDeletedAt = mockState.events.findIndex(
      (event) => event.kind === 'delete' && event.path === `projects/${projectId}/members/owner-uid`
    );
    const memberDeletedAt = mockState.events.findIndex(
      (event) => event.kind === 'delete' && event.path === `projects/${projectId}/members/member-uid`
    );
    const ownerUserProjectDeletedAt = mockState.events.findIndex(
      (event) => event.kind === 'delete' && event.path === `users/owner-uid/projects/${projectId}`
    );

    expect(projectDocDeletedAt).toBeGreaterThanOrEqual(0);
    expect(ownerMemberDeletedAt).toBeGreaterThan(projectDocDeletedAt);
    expect(ownerUserProjectDeletedAt).toBeGreaterThan(projectDocDeletedAt);
    expect(memberDeletedAt).toBeGreaterThanOrEqual(0);
    expect(memberDeletedAt).toBeLessThan(projectDocDeletedAt);

    const joinKeyDeletes = mockState.events.filter(
      (event) => event.kind === 'delete' && event.path.startsWith('project_join_keys/')
    );
    expect(joinKeyDeletes).toEqual([]);
  });
});
