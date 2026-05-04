/**
 * Tests for `highlightFilterUtils.js`.
 *
 * The "uniquely coded" filter hides highlights whose entire overlap-set
 * agrees on a single code. This is what powers the "show only highlights
 * that have disagreement" toggle, so getting the overlap predicate right
 * matters: too aggressive hides genuine disagreements; too lenient leaves
 * the view cluttered.
 *
 *   simple   - one or two highlights, easy answers
 *   medium   - partial overlaps and exact-match overlaps
 *   complex  - chains of overlaps, identical spans by multiple users
 */

import {
  getUniquelyCodedHighlightIds,
  filterUniquelyCodedHighlights
} from '../highlightFilterUtils.js';

const hl = (id, code, startIndex, endIndex) => ({ id, code, startIndex, endIndex });

describe('getUniquelyCodedHighlightIds', () => {
  // simple
  test('returns [] for empty / null inputs', () => {
    expect(getUniquelyCodedHighlightIds([])).toEqual([]);
    expect(getUniquelyCodedHighlightIds(null)).toEqual([]);
    expect(getUniquelyCodedHighlightIds(undefined)).toEqual([]);
  });

  test('a single isolated highlight is "uniquely coded" (no overlaps with other codes)', () => {
    expect(getUniquelyCodedHighlightIds([hl('h1', 'A', 0, 10)])).toEqual(['h1']);
  });

  test('two non-overlapping highlights with the same code → both hidden', () => {
    const ids = getUniquelyCodedHighlightIds([
      hl('h1', 'A', 0, 10),
      hl('h2', 'A', 20, 30)
    ]);
    expect(ids.sort()).toEqual(['h1', 'h2']);
  });

  // medium
  test('partial overlap between two different codes → both kept', () => {
    const ids = getUniquelyCodedHighlightIds([
      hl('h1', 'A', 0, 10),
      hl('h2', 'B', 5, 15)
    ]);
    expect(ids).toEqual([]);
  });

  test('exact-span overlap, same code → still uniquely coded (hidden)', () => {
    const ids = getUniquelyCodedHighlightIds([
      hl('h1', 'A', 0, 10),
      hl('h2', 'A', 0, 10)
    ]).sort();
    expect(ids).toEqual(['h1', 'h2']);
  });

  test('back-to-back highlights at the same boundary do NOT count as overlap', () => {
    // [0,10) and [10,20) share no characters. Both should be hidden as
    // uniquely coded (no overlapping disagreement).
    const ids = getUniquelyCodedHighlightIds([
      hl('h1', 'A', 0, 10),
      hl('h2', 'B', 10, 20)
    ]).sort();
    expect(ids).toEqual(['h1', 'h2']);
  });

  // complex
  test('chain of overlaps with mixed codes — only the truly isolated one hides', () => {
    // h1: A   [0,10]
    // h2: B   [8,20]   overlaps h1 (different code) → kept
    // h3: B   [18,30]  overlaps h2 (same code only) → check carefully
    // h4: A   [50,60]  isolated
    const highlights = [
      hl('h1', 'A', 0, 10),
      hl('h2', 'B', 8, 20),
      hl('h3', 'B', 18, 30),
      hl('h4', 'A', 50, 60)
    ];
    const hidden = getUniquelyCodedHighlightIds(highlights).sort();

    // h1 overlaps h2 (different codes) → kept
    // h2 overlaps h1 (A) and h3 (B) → codes={A,B} → kept
    // h3 overlaps h2 (B) only → codes={B} → hidden
    // h4 isolated → codes={A} → hidden
    expect(hidden).toEqual(['h3', 'h4']);
  });

  test('three coders agreeing on the same span are all hidden', () => {
    const highlights = [
      hl('h1', 'X', 0, 5),
      hl('h2', 'X', 0, 5),
      hl('h3', 'X', 0, 5)
    ];
    expect(getUniquelyCodedHighlightIds(highlights).sort()).toEqual(['h1', 'h2', 'h3']);
  });
});

describe('filterUniquelyCodedHighlights', () => {
  const sample = [
    hl('h1', 'A', 0, 10),
    hl('h2', 'B', 5, 15),
    hl('h3', 'A', 100, 110)
  ];

  test('returns input unchanged when the toggle is off', () => {
    expect(filterUniquelyCodedHighlights(sample, false)).toBe(sample);
  });

  test('returns input unchanged when input is null', () => {
    expect(filterUniquelyCodedHighlights(null, true)).toBe(null);
  });

  test('removes uniquely-coded highlights when the toggle is on', () => {
    const filtered = filterUniquelyCodedHighlights(sample, true);
    // h1 ↔ h2 disagree (kept), h3 isolated (removed).
    expect(filtered.map(h => h.id).sort()).toEqual(['h1', 'h2']);
  });

  test('returns same array reference when nothing needs hiding (allocation-free path)', () => {
    const allDisagreeing = [
      hl('h1', 'A', 0, 10),
      hl('h2', 'B', 0, 10)
    ];
    expect(filterUniquelyCodedHighlights(allDisagreeing, true)).toBe(allDisagreeing);
  });
});
