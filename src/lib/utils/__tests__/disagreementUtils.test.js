/**
 * Tests for `disagreementUtils.js`.
 *
 * `calculateCodeDisagreement` is fed a list of highlights all carrying the
 * same code and decides how much agreement there is across coders. The
 * three buckets we care about:
 *
 *   simple   - empty / single-coder edge cases
 *   medium   - mixed agreement and the level/colour bucketing
 *   complex  - many segments, many coders, repeated coding by one user
 */

import {
  calculateCodeDisagreement,
  getDisagreementColorClasses,
  formatDisagreementPercentage
} from '../disagreementUtils.js';

const hl = (id, userId, documentId, startIndex, endIndex) => ({
  id,
  userId,
  documentId,
  startIndex,
  endIndex
});

describe('calculateCodeDisagreement', () => {
  // ----- simple ----------------------------------------------------------
  test('empty/null highlights → "No Data" with 100% agreement', () => {
    const a = calculateCodeDisagreement(null, []);
    const b = calculateCodeDisagreement([], []);
    for (const r of [a, b]) {
      expect(r.disagreementLevel).toBe('No Data');
      expect(r.color).toBe('gray');
      expect(r.totalHighlights).toBe(0);
      expect(r.hasMultipleUsers).toBe(false);
    }
  });

  test('single coder with multiple highlights → "Single Coder"', () => {
    const result = calculateCodeDisagreement(
      [
        hl('h1', 'u1', 'd1', 0, 10),
        hl('h2', 'u1', 'd1', 20, 30)
      ],
      ['u1']
    );
    expect(result.disagreementLevel).toBe('Single Coder');
    expect(result.agreementPercentage).toBe(100);
    expect(result.uniqueUsers).toBe(1);
    expect(result.hasMultipleUsers).toBe(false);
  });

  // ----- medium ----------------------------------------------------------
  test('two coders agreeing on the same span → 100% agreement', () => {
    const result = calculateCodeDisagreement(
      [
        hl('h1', 'u1', 'd1', 0, 10),
        hl('h2', 'u2', 'd1', 0, 10)
      ],
      ['u1', 'u2']
    );
    expect(result.agreementPercentage).toBe(100);
    expect(result.overlappingSegments).toBe(1);
    expect(result.totalSegments).toBe(1);
    expect(result.disagreementLevel).toBe('No Discussion Needed');
    expect(result.color).toBe('green');
  });

  test('two coders, completely disjoint spans → 0% agreement, "Needs Discussion"', () => {
    const result = calculateCodeDisagreement(
      [
        hl('h1', 'u1', 'd1', 0, 10),
        hl('h2', 'u2', 'd1', 50, 60)
      ],
      ['u1', 'u2']
    );
    expect(result.agreementPercentage).toBe(0);
    expect(result.disagreementLevel).toBe('Needs Discussion');
    expect(result.color).toBe('red');
  });

  test('disagreement level buckets line up with the documented thresholds', () => {
    // Build inputs that push the percentage into each bucket. Each test
    // case is (numAgreeingPairs, numDisjoint, expectedColor).
    const cases = [
      // 2 agree-segments (4 instances), 0 disjoint → 100% agree → green
      { agreeing: 2, disjoint: 0, color: 'green' },
      // 1 agreeing (2 instances), 1 disjoint (1 instance) → 2/3 ≈ 67% → yellow (33% disagree)
      { agreeing: 1, disjoint: 1, color: 'yellow' },
      // 1 agreeing (2 instances), 3 disjoint (3 instances) → 2/5 = 40% agree → 60% disagree → orange
      { agreeing: 1, disjoint: 3, color: 'orange' },
      // 0 agreeing, 5 disjoint → 0/5 = 0% agree → 100% disagree → red
      { agreeing: 0, disjoint: 5, color: 'red' }
    ];

    for (const c of cases) {
      const highlights = [];
      let id = 0;
      for (let i = 0; i < c.agreeing; i++) {
        // two users agreeing on span [i*100, i*100+10]
        highlights.push(hl(`h${id++}`, 'uA', 'd1', i * 100, i * 100 + 10));
        highlights.push(hl(`h${id++}`, 'uB', 'd1', i * 100, i * 100 + 10));
      }
      // Alternate users on the disjoint segments so uniqueUserCount stays >= 2
      // and we don't trip the "Single Coder" early-return when agreeing === 0.
      for (let i = 0; i < c.disjoint; i++) {
        const user = i % 2 === 0 ? 'uA' : 'uB';
        highlights.push(hl(`h${id++}`, user, 'd1', 1000 + i * 100, 1000 + i * 100 + 10));
      }
      const result = calculateCodeDisagreement(highlights, ['uA', 'uB']);
      expect(result.color).toBe(c.color);
    }
  });

  // ----- complex ---------------------------------------------------------
  test('a user double-coding the same span counts once toward agreement', () => {
    // Two highlights from the same user on the same span, plus one from a
    // different user. The Set-of-userIds-per-segment guards against
    // double-counting; this is exactly that case.
    const result = calculateCodeDisagreement(
      [
        hl('h1', 'u1', 'd1', 0, 10),
        hl('h2', 'u1', 'd1', 0, 10),
        hl('h3', 'u2', 'd1', 0, 10)
      ],
      ['u1', 'u2']
    );
    expect(result.totalSegments).toBe(1);
    expect(result.overlappingSegments).toBe(1);
    // Two distinct users on the segment → 2/2 = 100%.
    expect(result.agreementPercentage).toBe(100);
  });

  test('segments are scoped per-document (same span in different docs is not agreement)', () => {
    const result = calculateCodeDisagreement(
      [
        hl('h1', 'u1', 'd1', 0, 10),
        hl('h2', 'u2', 'd2', 0, 10) // same start/end, different doc
      ],
      ['u1', 'u2']
    );
    expect(result.totalSegments).toBe(2);
    expect(result.overlappingSegments).toBe(0);
    expect(result.agreementPercentage).toBe(0);
  });
});

describe('getDisagreementColorClasses', () => {
  test('returns the requested variant for a known color', () => {
    expect(getDisagreementColorClasses('red', 'bg')).toBe('bg-red-100');
    expect(getDisagreementColorClasses('green', 'text')).toBe('text-green-800');
    expect(getDisagreementColorClasses('orange', 'dot')).toBe('bg-orange-500');
  });

  test('falls back to gray classes for an unknown color', () => {
    expect(getDisagreementColorClasses('octarine', 'bg')).toBe('bg-gray-100');
    expect(getDisagreementColorClasses(undefined, 'border')).toBe('border-gray-200');
  });
});

describe('formatDisagreementPercentage', () => {
  test('formats agreement → disagreement string', () => {
    expect(formatDisagreementPercentage(100)).toBe('0%');
    expect(formatDisagreementPercentage(0)).toBe('100%');
    expect(formatDisagreementPercentage(75)).toBe('25%');
  });
});
