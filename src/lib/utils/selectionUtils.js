export const getTextPosition = (textContainer, targetIndex) => {
  let currentIndex = 0;
  const walker = document.createTreeWalker(
    textContainer,
    NodeFilter.SHOW_TEXT,
    null,
    false
  );

  while (walker.nextNode()) {
    const textLength = walker.currentNode.textContent.length;
    if (currentIndex + textLength >= targetIndex) {
      return {
        node: walker.currentNode,
        offset: targetIndex - currentIndex
      };
    }
    currentIndex += textLength;
  }
  return null;
};

export const getAbsoluteIndex = (container, node, offset) => {
  // Get all text content from the container
  const fullText = container.textContent || container.innerText || '';
  
  // Find the position of this text node within the full text
  let currentIndex = 0;
  const walker = document.createTreeWalker(
    container,
    NodeFilter.SHOW_TEXT,
    null,
    false
  );

  while (walker.nextNode()) {
    const textNode = walker.currentNode;
    if (textNode === node) {
      // Found our target node, return the current index plus offset
      return currentIndex + offset;
    }
    currentIndex += textNode.textContent.length;
  }
  
  return currentIndex + offset;
};

// Returns true if a node is inside a UI-only element that should not be part of text selection
const isInsideNonSelectableUI = (node) => {
  if (!node) return false;
  const el = node.nodeType === Node.ELEMENT_NODE ? node : node.parentElement;
  if (!el) return false;
  return !!el.closest('[data-user-code-indicator="true"], .user-code-indicator');
};

// Extract selected text from a range while excluding UI overlays (e.g., user code indicators)
export const getCleanSelectedText = (range) => {
  if (!range) return '';
  const fragment = range.cloneContents();
  let text = '';
  const walker = document.createTreeWalker(
    fragment,
    NodeFilter.SHOW_TEXT,
    null,
    false
  );

  while (walker.nextNode()) {
    const textNode = walker.currentNode;
    // In the cloned fragment, we still need to check if this text belongs to an indicator
    if (isInsideNonSelectableUI(textNode)) continue;
    text += textNode.textContent;
  }
  return text;
};

// Get the textContent of a container excluding UI-only elements
export const getCleanTextFromContainer = (container) => {
  if (!container) return '';
  let text = '';
  const walker = document.createTreeWalker(
    container,
    NodeFilter.SHOW_TEXT,
    null,
    false
  );

  while (walker.nextNode()) {
    const textNode = walker.currentNode;
    if (isInsideNonSelectableUI(textNode)) continue;
    text += textNode.textContent;
  }
  return text;
};

// Compute absolute index in container text excluding UI-only elements
export const getCleanAbsoluteIndex = (container, node, offset) => {
  let currentIndex = 0;
  const walker = document.createTreeWalker(
    container,
    NodeFilter.SHOW_TEXT,
    null,
    false
  );

  while (walker.nextNode()) {
    const textNode = walker.currentNode;
    if (isInsideNonSelectableUI(textNode)) {
      continue;
    }
    if (textNode === node) {
      return currentIndex + offset;
    }
    currentIndex += textNode.textContent.length;
  }
  return currentIndex + offset;
};

// Helper function to compare arrays
export const arraysEqual = (a, b) => {
  if (!Array.isArray(a) || !Array.isArray(b)) return false;
  if (a.length !== b.length) return false;
  return a.every((val, index) => val === b[index]);
};

// Find `targetText` inside `sourceText`, disambiguated by what should
// appear immediately before and after it. Used as the primary mapping from
// a live DOM selection back to the canonical source string.
//
// We score each occurrence by how many characters of the expected
// before/after context line up *adjacent* to the match, instead of doing
// bag-of-words on a fixed-size window. Proximity matters: in qualitative
// data the same phrase can appear many times, and only the immediate
// neighbouring text reliably identifies which one the user pointed at.
//
// Whitespace at the boundary is ignored on both sides so that a selection
// ending at a word boundary still scores, regardless of whether the caller
// passed in trailing whitespace.
export const findTextWithContext = (sourceText, targetText, beforeContext = '', afterContext = '') => {
  const normalizedTarget = targetText.replace(/\s+/g, ' ').trim();
  const normalizedBefore = beforeContext.replace(/\s+/g, ' ').trim();
  const normalizedAfter = afterContext.replace(/\s+/g, ' ').trim();
  const normalizedSource = sourceText.replace(/\s+/g, ' ');

  if (!normalizedTarget) return -1;

  // Collect every occurrence; the +1 step deliberately allows overlapping
  // matches like 'aaaa' inside 'aaaaaa'.
  const occurrences = [];
  let searchStart = 0;
  let foundIndex = -1;
  while ((foundIndex = normalizedSource.indexOf(normalizedTarget, searchStart)) !== -1) {
    occurrences.push(foundIndex);
    searchStart = foundIndex + 1;
  }

  if (occurrences.length === 0) return -1;
  if (occurrences.length === 1) return occurrences[0];

  // Pull a few extra chars beyond the context length so a leading or
  // trailing space doesn't starve the prefix/suffix comparison.
  const SLACK = 8;
  const trimStart = (s) => s.replace(/^\s+/, '');
  const trimEnd = (s) => s.replace(/\s+$/, '');

  let bestMatch = occurrences[0];
  let bestScore = -1;

  for (const index of occurrences) {
    let score = 0;

    if (normalizedBefore) {
      const windowStart = Math.max(0, index - normalizedBefore.length - SLACK);
      const a = trimEnd(normalizedSource.substring(windowStart, index));
      const b = trimEnd(normalizedBefore);
      let i = 0;
      while (i < a.length && i < b.length && a[a.length - 1 - i] === b[b.length - 1 - i]) i++;
      score += i;
    }

    if (normalizedAfter) {
      const start = index + normalizedTarget.length;
      const end = Math.min(normalizedSource.length, start + normalizedAfter.length + SLACK);
      const a = trimStart(normalizedSource.substring(start, end));
      const b = trimStart(normalizedAfter);
      let i = 0;
      while (i < a.length && i < b.length && a[i] === b[i]) i++;
      score += i;
    }

    if (score > bestScore) {
      bestScore = score;
      bestMatch = index;
    }
  }

  return bestMatch;
};
