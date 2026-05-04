/**
 * Tests for `hoverUtils.js`. Small, presentational helpers — but the
 * "showAuthor=false / codes-only" mode runs through them every time a
 * highlight is rendered, so the contract should be locked down.
 */

import {
  UNIFIED_USER_COLOR,
  HIGHLIGHT_GREY,
  getUserDisplayColor,
  getUserDisplayName,
  shouldShowAuthorInfo
} from '../hoverUtils.js';

describe('exported color constants', () => {
  test('UNIFIED_USER_COLOR and HIGHLIGHT_GREY are valid 6-digit hex', () => {
    expect(UNIFIED_USER_COLOR).toMatch(/^#[0-9a-fA-F]{6}$/);
    expect(HIGHLIGHT_GREY).toMatch(/^#[0-9a-fA-F]{6}$/);
  });
});

describe('getUserDisplayColor', () => {
  test("codes-only mode collapses everyone to the unified color", () => {
    expect(getUserDisplayColor({ color: '#abcdef' }, false)).toBe(UNIFIED_USER_COLOR);
  });

  test('with author shown, returns the user’s assigned color', () => {
    expect(getUserDisplayColor({ color: '#123456' }, true)).toBe('#123456');
  });

  test('falls back to a neutral grey when the user has no color and authorship is shown', () => {
    expect(getUserDisplayColor({}, true)).toBe('#e5e7eb');
    expect(getUserDisplayColor(null, true)).toBe('#e5e7eb');
    expect(getUserDisplayColor(undefined, true)).toBe('#e5e7eb');
  });
});

describe('getUserDisplayName', () => {
  test('codes-only mode hides the name entirely', () => {
    expect(getUserDisplayName({ name: 'Ada' }, false, { uid: 'u1' }, 'u1')).toBeNull();
  });

  test('returns "(you)" suffix when the highlight belongs to the current user', () => {
    expect(
      getUserDisplayName({ name: 'Ada' }, true, { uid: 'u1' }, 'u1')
    ).toBe('Ada (you)');
  });

  test('returns the plain name for someone else', () => {
    expect(
      getUserDisplayName({ name: 'Ada' }, true, { uid: 'u1' }, 'u2')
    ).toBe('Ada');
  });

  test('uses "Anonymous" when the user has no name', () => {
    expect(getUserDisplayName({}, true, { uid: 'u1' }, 'u2')).toBe('Anonymous');
    expect(getUserDisplayName(null, true, { uid: 'u1' }, 'u2')).toBe('Anonymous');
  });

  test('still works when there is no current user (e.g. logged-out viewer)', () => {
    // No currentUser means no "(you)" suffix can apply.
    expect(getUserDisplayName({ name: 'Ada' }, true, null, 'u1')).toBe('Ada');
  });
});

describe('shouldShowAuthorInfo', () => {
  test('returns the boolean it was passed', () => {
    expect(shouldShowAuthorInfo(true)).toBe(true);
    expect(shouldShowAuthorInfo(false)).toBe(false);
  });
});
