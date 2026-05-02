/**
 * Tests for the text-selection helpers in `selectionUtils.js`.
 *
 * These functions are the backbone of the highlight system: every saved
 * highlight depends on translating a live DOM Selection into a stable
 * character offset in the document's source text. We test them at three
 * levels of complexity:
 *
 *   simple   - a single text node, no overlays, no whitespace games
 *   medium   - multiple text nodes, nested elements, multi-line strings
 *   complex  - non-selectable UI overlays (user code indicators), repeated
 *              text disambiguated by surrounding context, normalised
 *              whitespace
 *
 * Anything broken here will show up as silently mis-placed highlights, so
 * we lean on the side of being explicit even where it's a little verbose.
 *
 * @jest-environment jsdom
 */

import {
  getTextPosition,
  getAbsoluteIndex,
  getCleanSelectedText,
  getCleanTextFromContainer,
  getCleanAbsoluteIndex,
  arraysEqual,
  findTextWithContext
} from '../selectionUtils.js';

const makeContainer = (html) => {
  const div = document.createElement('div');
  div.innerHTML = html;
  document.body.appendChild(div);
  return div;
};

afterEach(() => {
  document.body.innerHTML = '';
});

// ---------------------------------------------------------------------------
// arraysEqual: trivial, but the predicate is used for sorting/diff logic.
// ---------------------------------------------------------------------------
describe('arraysEqual', () => {
  test('returns true for two empty arrays', () => {
    expect(arraysEqual([], [])).toBe(true);
  });

  test('returns true for arrays with identical primitive contents', () => {
    expect(arraysEqual([1, 2, 3], [1, 2, 3])).toBe(true);
    expect(arraysEqual(['a', 'b'], ['a', 'b'])).toBe(true);
  });

  test('returns false when lengths differ', () => {
    expect(arraysEqual([1, 2], [1, 2, 3])).toBe(false);
  });

  test('returns false when ordering differs', () => {
    expect(arraysEqual([1, 2, 3], [3, 2, 1])).toBe(false);
  });

  test('uses strict equality (no deep compare)', () => {
    expect(arraysEqual([{ a: 1 }], [{ a: 1 }])).toBe(false);
  });
});

// ---------------------------------------------------------------------------
// findTextWithContext: pure string algorithm, no DOM. This is the fallback
// the highlight pipeline uses to disambiguate repeated phrases.
// ---------------------------------------------------------------------------
describe('findTextWithContext', () => {
  test('returns -1 when target is empty', () => {
    expect(findTextWithContext('hello world', '')).toBe(-1);
  });

  test('returns -1 when target does not appear in source', () => {
    expect(findTextWithContext('hello world', 'goodbye')).toBe(-1);
  });

  test('finds the unique occurrence of a phrase', () => {
    const source = 'The participant described feeling nervous.';
    expect(findTextWithContext(source, 'feeling nervous')).toBe(source.indexOf('feeling nervous'));
  });

  test('normalises whitespace before searching (matches across newlines)', () => {
    const source = 'The participant\n  described\tfeeling\nnervous.';
    // Source after normalisation: 'The participant described feeling nervous.'
    const result = findTextWithContext(source, 'described feeling');
    expect(result).toBeGreaterThan(-1);
  });

  test('returns the first occurrence when target appears repeatedly and no context is given', () => {
    const source = 'trust matters here. trust matters there.';
    expect(findTextWithContext(source, 'trust matters')).toBe(0);
  });

  test('disambiguates repeated text using before-context', () => {
    const source = 'I felt unsafe. trust matters here. Later, hopefully, trust matters there.';
    // Without context, the function returns the first match. With "Later"
    // as before-context, it should pick the second occurrence.
    const firstIndex = source.indexOf('trust matters');
    const secondIndex = source.indexOf('trust matters', firstIndex + 1);

    const beforeContext = 'Later, hopefully,';
    const result = findTextWithContext(source, 'trust matters', beforeContext, '');
    expect(result).toBe(secondIndex);
  });

  test('disambiguates repeated text using after-context', () => {
    const source = 'trust matters here. trust matters there.';
    const here = source.indexOf('trust matters');
    const there = source.indexOf('trust matters', here + 1);

    expect(findTextWithContext(source, 'trust matters', '', 'there')).toBe(there);
    // And the other side, just to make sure the test isn't tautological.
    expect(findTextWithContext(source, 'trust matters', '', 'here')).toBe(here);
  });

  test('falls back to first occurrence when context words are too short to score', () => {
    // Words of length <=2 are filtered out, so 'a' as before-context can't
    // score any occurrence and we should get the first match.
    const source = 'cat in a hat. cat on a mat.';
    expect(findTextWithContext(source, 'cat', 'a', 'a')).toBe(0);
  });

  test('does not infinite-loop on overlapping target patterns', () => {
    // 'aaaa' occurs at indices 0, 1, 2, 3, 4 within 'aaaaaaaa'. The walker
    // increments searchStart by 1 to allow overlap; this test guards the
    // termination of that loop.
    expect(() => findTextWithContext('aaaaaaaa', 'aaaa')).not.toThrow();
  });
});

// ---------------------------------------------------------------------------
// getTextPosition / getAbsoluteIndex: simple DOM walks. These are used for
// reverse mapping (offset -> DOM node) when navigating to a stored highlight.
// ---------------------------------------------------------------------------
describe('getTextPosition / getAbsoluteIndex', () => {
  test('simple: single text node round-trips through both functions', () => {
    const container = makeContainer('<p>Hello world</p>');
    const textNode = container.querySelector('p').firstChild;

    // Pick character index 6 (the 'w' of 'world').
    const pos = getTextPosition(container, 6);
    expect(pos.node).toBe(textNode);
    expect(pos.offset).toBe(6);

    // And go the other way: offset 6 in the same node should map back.
    expect(getAbsoluteIndex(container, textNode, 6)).toBe(6);
  });

  test('medium: spans across nested elements accumulate text length correctly', () => {
    const container = makeContainer('<p>Hello <em>brave</em> world</p>');
    // Combined text: "Hello brave world"
    //                 0      6     12
    const emTextNode = container.querySelector('em').firstChild;

    // 'brave' starts at index 6, so offset 0 in the em should be 6.
    expect(getAbsoluteIndex(container, emTextNode, 0)).toBe(6);
    expect(getAbsoluteIndex(container, emTextNode, 5)).toBe(11);

    // Reverse: index 8 sits inside 'brave' (the 'a').
    const pos = getTextPosition(container, 8);
    expect(pos.node).toBe(emTextNode);
    expect(pos.offset).toBe(2); // 'br|a' -> offset 2
  });

  test('returns null from getTextPosition when index exceeds total text length', () => {
    const container = makeContainer('<p>short</p>');
    expect(getTextPosition(container, 999)).toBeNull();
  });
});

// ---------------------------------------------------------------------------
// getCleanSelectedText / getCleanTextFromContainer: must skip nodes inside
// non-selectable UI elements (the `data-user-code-indicator` overlays).
// ---------------------------------------------------------------------------
describe('clean text extraction skips UI overlays', () => {
  test('simple: getCleanTextFromContainer ignores user-code-indicator children', () => {
    const container = makeContainer(
      '<p>The cat <span data-user-code-indicator="true">[ANIMAL]</span> sat.</p>'
    );
    expect(getCleanTextFromContainer(container)).toBe('The cat  sat.');
  });

  test('medium: getCleanSelectedText on a Range that fully contains an overlay', () => {
    const container = makeContainer(
      '<p>The cat <span class="user-code-indicator">[ANIMAL]</span> sat quietly.</p>'
    );
    const p = container.querySelector('p');
    const range = document.createRange();
    range.selectNodeContents(p);

    expect(getCleanSelectedText(range)).toBe('The cat  sat quietly.');
  });

  test('complex: nested overlays are also stripped', () => {
    const container = makeContainer(
      '<p>Alpha <span data-user-code-indicator="true">[A] <span data-user-code-indicator="true">[B]</span></span> beta.</p>'
    );
    expect(getCleanTextFromContainer(container)).toBe('Alpha  beta.');
  });

  test('returns empty string for an empty range or container', () => {
    expect(getCleanSelectedText(null)).toBe('');
    expect(getCleanTextFromContainer(null)).toBe('');
  });
});

// ---------------------------------------------------------------------------
// getCleanAbsoluteIndex: this is the function that actually translates a
// browser Selection's anchor/focus into a character offset in the document.
// It must match getCleanTextFromContainer so that downstream string search
// can find the selected substring in the source.
// ---------------------------------------------------------------------------
describe('getCleanAbsoluteIndex', () => {
  test('simple: matches getAbsoluteIndex when there are no overlays', () => {
    const container = makeContainer('<p>Hello world</p>');
    const textNode = container.querySelector('p').firstChild;

    expect(getCleanAbsoluteIndex(container, textNode, 6))
      .toBe(getAbsoluteIndex(container, textNode, 6));
  });

  test('medium: overlay text does NOT count toward the offset of later nodes', () => {
    // The clean view of this container is "Alpha  beta." (overlay removed).
    // Without the overlay-skipping logic, "beta" would be reported at index 13
    // (after "Alpha [TAG] "), but we want index 7 — the position in the
    // *clean* text where "beta" appears.
    const container = makeContainer(
      '<p>Alpha <span data-user-code-indicator="true">[TAG]</span> beta.</p>'
    );
    const cleanText = getCleanTextFromContainer(container);

    // Find the text node holding " beta." (it's the third child of <p>).
    const p = container.querySelector('p');
    const betaNode = Array.from(p.childNodes).find(
      (n) => n.nodeType === Node.TEXT_NODE && n.textContent.includes('beta')
    );

    const idx = getCleanAbsoluteIndex(container, betaNode, 1); // skip leading space
    // The clean text starts " beta." at index 6, so offset 1 → index 7.
    expect(idx).toBe(cleanText.indexOf('beta'));
  });

  test('complex: round-trip — index from offset reproduces the same substring', () => {
    // This is the property that actually matters in production: whatever
    // the user selects, the offsets we compute can be used to slice the
    // clean source text and recover the same string.
    const container = makeContainer(
      '<p>Trust <span data-user-code-indicator="true">[CODE]</span> matters here. Trust matters there.</p>'
    );
    const cleanText = getCleanTextFromContainer(container);
    expect(cleanText).toBe('Trust  matters here. Trust matters there.');

    // Build a range over " matters here" — including the leading space that
    // remains after the overlay is removed. We anchor the range to the text
    // node that follows the overlay.
    const p = container.querySelector('p');
    const tailNode = Array.from(p.childNodes).find(
      (n) => n.nodeType === Node.TEXT_NODE && n.textContent.includes('matters here')
    );

    // " matters here" within tailNode starts at offset 0.
    const startOffsetInNode = tailNode.textContent.indexOf('matters here');
    const endOffsetInNode = startOffsetInNode + 'matters here'.length;

    const startIdx = getCleanAbsoluteIndex(container, tailNode, startOffsetInNode);
    const endIdx = getCleanAbsoluteIndex(container, tailNode, endOffsetInNode);

    expect(cleanText.substring(startIdx, endIdx)).toBe('matters here');
  });
});

// ---------------------------------------------------------------------------
// End-to-end: simulate the highlight-creation pipeline that
// useHighlightManagement.js performs. We use the helpers to translate a
// Selection-like range, then verify the same substring can be located in a
// canonical source text using findTextWithContext.
// ---------------------------------------------------------------------------
describe('end-to-end pipeline', () => {
  test('selection across nodes maps to the correct substring of source text', () => {
    const sourceText =
      'The participant described feeling nervous about the procedure. ' +
      'Later, the participant described feeling reassured.';

    // The "rendered" container splits the same text across multiple nodes
    // and inserts a non-selectable code indicator in the middle.
    const container = makeContainer(
      '<p>The participant <span data-user-code-indicator="true">[P1]</span> described feeling nervous about the procedure. ' +
      'Later, the participant described feeling reassured.</p>'
    );

    const p = container.querySelector('p');
    const textAfterIndicator = Array.from(p.childNodes).find(
      (n) => n.nodeType === Node.TEXT_NODE && n.textContent.includes('described feeling nervous')
    );

    const startOffsetInNode = textAfterIndicator.textContent.indexOf('feeling nervous');
    const endOffsetInNode = startOffsetInNode + 'feeling nervous'.length;

    // Compute clean indices the way the production hook does.
    const cleanStart = getCleanAbsoluteIndex(container, textAfterIndicator, startOffsetInNode);
    const cleanEnd = getCleanAbsoluteIndex(container, textAfterIndicator, endOffsetInNode);
    const cleanText = getCleanTextFromContainer(container);

    expect(cleanText.substring(cleanStart, cleanEnd)).toBe('feeling nervous');

    // Use the surrounding context to disambiguate against the source — the
    // phrase "feeling nervous" only occurs once, but this pattern is the
    // same as in production.
    const contextBefore = cleanText.substring(Math.max(0, cleanStart - 50), cleanStart);
    const contextAfter = cleanText.substring(cleanEnd, Math.min(cleanText.length, cleanEnd + 50));

    const sourceIdx = findTextWithContext(sourceText, 'feeling nervous', contextBefore, contextAfter);
    expect(sourceText.substring(sourceIdx, sourceIdx + 'feeling nervous'.length)).toBe('feeling nervous');
  });

  test('repeated phrase is disambiguated by trailing context', () => {
    const sourceText =
      'I felt small. trust matters here. Later, in another moment, trust matters there.';

    // Two occurrences of "trust matters". The user selected the second one.
    const container = makeContainer(`<p>${sourceText}</p>`);
    const textNode = container.querySelector('p').firstChild;
    const secondOccurrence = sourceText.lastIndexOf('trust matters');

    const cleanStart = getCleanAbsoluteIndex(container, textNode, secondOccurrence);
    const cleanEnd = cleanStart + 'trust matters'.length;
    const cleanText = getCleanTextFromContainer(container);

    const contextAfter = cleanText.substring(cleanEnd, cleanEnd + 30);

    const sourceIdx = findTextWithContext(sourceText, 'trust matters', '', contextAfter);
    expect(sourceIdx).toBe(secondOccurrence);
  });
});
