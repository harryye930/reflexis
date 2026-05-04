/**
 * Tests for `colorUtils.js`. We only test the pure helpers here —
 * `getAvailableColor` reaches into Firestore and is exercised in the
 * Firebase-tied integration paths, not unit-testable without mocks.
 *
 * The module imports `../firebase.js` at top level, which in turn calls
 * getAuth() on import. In a CI environment without API keys that throws,
 * so we stub both firebase modules out before requiring colorUtils.
 */

jest.mock('../../firebase.js', () => ({ db: {}, auth: {} }));
jest.mock('firebase/firestore', () => ({
  collection: jest.fn(),
  getDocs: jest.fn(async () => ({ docs: [] }))
}));

import { hexToRgba, userColors } from '../colorUtils.js';

describe('userColors palette', () => {
  test('every entry is a valid 6-digit hex string', () => {
    for (const c of userColors) {
      expect(c).toMatch(/^#[0-9a-fA-F]{6}$/);
    }
  });

  test('palette has no duplicate colors', () => {
    expect(new Set(userColors).size).toBe(userColors.length);
  });
});

describe('hexToRgba', () => {
  // simple
  test('converts a basic hex to rgba with the given opacity', () => {
    expect(hexToRgba('#ff0000', 1)).toBe('rgba(255, 0, 0, 1)');
    expect(hexToRgba('#000000', 0.5)).toBe('rgba(0, 0, 0, 0.5)');
  });

  test('is case-insensitive on the hex', () => {
    expect(hexToRgba('#AABBCC', 1)).toBe('rgba(170, 187, 204, 1)');
    expect(hexToRgba('#aabbcc', 1)).toBe('rgba(170, 187, 204, 1)');
  });

  // medium
  test('handles every color in the user palette without producing NaN', () => {
    for (const c of userColors) {
      const rgba = hexToRgba(c, 0.3);
      expect(rgba).not.toMatch(/NaN/);
      expect(rgba).toMatch(/^rgba\(\d+, \d+, \d+, 0\.3\)$/);
    }
  });

  // complex / defensive
  test('returns a safe fallback (not NaN) for malformed hex', () => {
    // Older callers might pass a 3-digit hex or a non-string. Whatever we
    // return, it must not be a CSS-breaking "rgba(NaN, NaN, NaN, ...)".
    expect(hexToRgba('#fff', 1)).not.toMatch(/NaN/);
    expect(hexToRgba('not-a-color', 1)).not.toMatch(/NaN/);
    expect(hexToRgba(null, 1)).not.toMatch(/NaN/);
    expect(hexToRgba(undefined, 1)).not.toMatch(/NaN/);
  });
});
