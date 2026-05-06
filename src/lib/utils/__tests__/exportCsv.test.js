/**
 * Tests for the project export builders. Tiers:
 * - simple: header rows and filename match the contract
 * - medium: highlights sort by document → offset; reflexive rows preserve
 *   every response (revisions and cross-user reflections) and join back to
 *   highlights via Highlight ID
 * - complex: ordering of revisions within a highlight, fallback fields when
 *   the highlight is missing, and that empty-input cases produce a header-
 *   only file rather than crashing
 */

const { buildHighlightCsv, buildReflexiveCsv } = require('../exportCsv.js');

const makeLookup = (entries) => new Map(entries);

const baseFixture = () => {
  const documentLookup = makeLookup([
    ['doc-a', { title: 'Alpha Interview' }],
    ['doc-b', { title: 'Beta Interview' }]
  ]);

  const codeLookup = makeLookup([
    ['code-care', { id: 'code-care', label: 'Care work', description: 'Acts of caring' }],
    ['code-power', { id: 'code-power', label: 'Power dynamics', description: 'Who decides' }]
  ]);

  const memberLookup = makeLookup([
    ['user-1', { name: 'Riya Kapoor', email: 'riya@example.com', role: 'member' }],
    ['user-2', { name: 'Sam Patel', email: 'sam@example.com', role: 'owner' }]
  ]);

  return { documentLookup, codeLookup, memberLookup };
};

const parseCsv = (content) => {
  const stripped = content.replace(/^﻿/, '').replace(/\r\n$/, '');
  return stripped.split('\r\n');
};

describe('buildHighlightCsv', () => {
  // simple
  test('emits the eight-column header and project-named filename', () => {
    const { documentLookup, codeLookup, memberLookup } = baseFixture();
    const { filename, content } = buildHighlightCsv({
      project: { name: 'My Study' },
      highlights: [],
      documentLookup,
      codeLookup,
      memberLookup
    });

    const [header] = parseCsv(content);
    expect(header).toBe('Document,Passage,Code,Code description,Coder,Coder email,Coded at,Highlight ID');
    expect(filename).toBe('My_Study_highlights.csv');
  });

  // medium
  test('sorts by document title then start offset', () => {
    const { documentLookup, codeLookup, memberLookup } = baseFixture();
    const highlights = [
      { id: 'h-beta', documentId: 'doc-b', startIndex: 5, text: 'beta passage', code: 'code-power', userId: 'user-2', createdAt: new Date('2026-04-01T10:00:00Z') },
      { id: 'h-alpha-2', documentId: 'doc-a', startIndex: 200, text: 'alpha later', code: 'code-care', userId: 'user-1', createdAt: new Date('2026-04-02T10:00:00Z') },
      { id: 'h-alpha-1', documentId: 'doc-a', startIndex: 10, text: 'alpha first', code: 'code-care', userId: 'user-1', createdAt: new Date('2026-04-03T10:00:00Z') }
    ];

    const { content } = buildHighlightCsv({
      project: { name: 'Study' },
      highlights,
      documentLookup,
      codeLookup,
      memberLookup
    });

    const lines = parseCsv(content);
    expect(lines).toHaveLength(4);
    expect(lines[1]).toContain('h-alpha-1');
    expect(lines[2]).toContain('h-alpha-2');
    expect(lines[3]).toContain('h-beta');
  });
});

describe('buildReflexiveCsv', () => {
  // simple
  test('emits the eleven-column header and project-named filename', () => {
    const { documentLookup, codeLookup, memberLookup } = baseFixture();
    const { filename, content } = buildReflexiveCsv({
      project: { name: 'My Study' },
      reflexiveResponses: [],
      highlights: [],
      documentLookup,
      codeLookup,
      memberLookup
    });

    const [header] = parseCsv(content);
    expect(header).toBe('Highlight ID,Document,Code,Passage,Reflexive author,Author email,Prompt type,Prompt,Response,Created at,Updated at');
    expect(filename).toBe('My_Study_reflexive.csv');
    // header-only output for empty input
    expect(parseCsv(content)).toHaveLength(1);
  });

  // medium — every response is preserved, joinable back to highlights via Highlight ID
  test('preserves every response (revisions and cross-user) and joins to highlights', () => {
    const { documentLookup, codeLookup, memberLookup } = baseFixture();
    const highlights = [
      { id: 'h1', documentId: 'doc-a', startIndex: 0, text: 'shared passage', code: 'code-care', userId: 'user-1' }
    ];
    const reflexiveResponses = [
      { id: 'r1', highlightId: 'h1', userId: 'user-1', promptType: 'justification', prompt: 'Why care?', response: 'first attempt', createdAt: new Date('2026-04-01T10:00:00Z'), updatedAt: new Date('2026-04-01T10:00:00Z') },
      { id: 'r2', highlightId: 'h1', userId: 'user-1', promptType: 'justification', prompt: 'Why care?', response: 'final answer', createdAt: new Date('2026-04-03T10:00:00Z'), updatedAt: new Date('2026-04-03T10:00:00Z') },
      { id: 'r3', highlightId: 'h1', userId: 'user-2', promptType: 'positionality', prompt: 'Your lens?', response: 'sams reflection', createdAt: new Date('2026-04-05T10:00:00Z') }
    ];

    const { content } = buildReflexiveCsv({
      project: { name: 'Study' },
      reflexiveResponses,
      highlights,
      documentLookup,
      codeLookup,
      memberLookup
    });

    const lines = parseCsv(content);
    // header + 3 rows
    expect(lines).toHaveLength(4);

    // every response text is present
    expect(content).toContain('first attempt');
    expect(content).toContain('final answer');
    expect(content).toContain('sams reflection');

    // each row carries the Highlight ID for joining back
    expect(lines[1].startsWith('h1,')).toBe(true);
    expect(lines[2].startsWith('h1,')).toBe(true);
    expect(lines[3].startsWith('h1,')).toBe(true);

    // passage from the highlight is denormalized onto each response row
    expect(lines[1]).toContain('shared passage');

    // distinct authors are recorded per row
    expect(lines[1]).toContain('Riya Kapoor');
    expect(lines[3]).toContain('Sam Patel');
  });

  // complex — within a highlight, revisions sit in chronological order;
  // across highlights, document title then offset wins. Sort is deterministic.
  test('sorts by document then highlight offset, then response createdAt within a highlight', () => {
    const { documentLookup, codeLookup, memberLookup } = baseFixture();
    const highlights = [
      { id: 'h-beta', documentId: 'doc-b', startIndex: 0, text: 'beta', code: 'code-power', userId: 'user-2' },
      { id: 'h-alpha-late', documentId: 'doc-a', startIndex: 100, text: 'alpha late', code: 'code-care', userId: 'user-1' },
      { id: 'h-alpha-early', documentId: 'doc-a', startIndex: 10, text: 'alpha early', code: 'code-care', userId: 'user-1' }
    ];
    const reflexiveResponses = [
      // out of order on purpose
      { id: 'r-beta', highlightId: 'h-beta', userId: 'user-2', promptType: 'note', response: 'beta note', createdAt: new Date('2026-04-10T00:00:00Z') },
      { id: 'r-alpha-late-second', highlightId: 'h-alpha-late', userId: 'user-1', promptType: 'justification', response: 'late-2', createdAt: new Date('2026-04-02T00:00:00Z') },
      { id: 'r-alpha-late-first', highlightId: 'h-alpha-late', userId: 'user-1', promptType: 'justification', response: 'late-1', createdAt: new Date('2026-04-01T00:00:00Z') },
      { id: 'r-alpha-early', highlightId: 'h-alpha-early', userId: 'user-1', promptType: 'justification', response: 'early-1', createdAt: new Date('2026-04-03T00:00:00Z') }
    ];

    const { content } = buildReflexiveCsv({
      project: { name: 'Study' },
      reflexiveResponses,
      highlights,
      documentLookup,
      codeLookup,
      memberLookup
    });

    const lines = parseCsv(content);
    // alpha early first, then alpha late (offset 100) with revisions in chronological order, then beta
    expect(lines[1]).toContain('early-1');
    expect(lines[2]).toContain('late-1');
    expect(lines[3]).toContain('late-2');
    expect(lines[4]).toContain('beta note');
  });

  // complex — when a response references a highlight that's been deleted,
  // we still want to export the response using its denormalized fields so
  // the researcher's reflection isn't lost.
  test('falls back to response.documentId / sourceText / codeLabel when highlight is missing', () => {
    const { documentLookup, codeLookup, memberLookup } = baseFixture();
    const reflexiveResponses = [
      {
        id: 'orphan',
        highlightId: 'h-deleted',
        documentId: 'doc-a',
        userId: 'user-1',
        promptType: 'note',
        sourceText: 'archived passage',
        codeLabel: 'Care work (archived)',
        response: 'still meaningful',
        createdAt: new Date('2026-04-01T00:00:00Z')
      }
    ];

    const { content } = buildReflexiveCsv({
      project: { name: 'Study' },
      reflexiveResponses,
      highlights: [],
      documentLookup,
      codeLookup,
      memberLookup
    });

    const [, row] = parseCsv(content);
    const cells = row.split(',');
    expect(cells[0]).toBe('h-deleted');
    expect(cells[1]).toBe('Alpha Interview');
    expect(cells[2]).toBe('Care work (archived)');
    expect(cells[3]).toBe('archived passage');
    expect(cells[8]).toBe('still meaningful');
  });
});
