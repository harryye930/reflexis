/**
 * Utility functions for filtering highlights based on uniqueness criteria
 */

/**
 * Determine if two highlight ranges overlap by any amount.
 * Overlap exists if startA < endB and endA > startB.
 * @param {Object} a - highlight with startIndex and endIndex
 * @param {Object} b - highlight with startIndex and endIndex
 * @returns {boolean}
 */
const rangesOverlap = (a, b) => {
  if (!a || !b) return false;
  return a.startIndex < b.endIndex && a.endIndex > b.startIndex;
};

/**
 * Identifies highlights that are "uniquely coded" per the clarified rules:
 * - Hide a highlight if, within the set of highlights that overlap its range, only one unique code is present.
 *   (Doesn't matter if coded once, multiple times, or by multiple people if the code is the same.)
 * - Keep (show) a highlight if there's any overlap with a different code (i.e., code set size > 1).
 *
 * Note: This considers interval overlap, not exact span equality. If spans differ in length, any overlapping
 * portion with a different code will keep those overlapping highlights visible.
 *
 * @param {Array} highlights - Array of highlight objects
 * @returns {Array} Array of highlight IDs that should be hidden
 */
export const getUniquelyCodedHighlightIds = (highlights) => {
  if (!highlights || highlights.length === 0) return [];

  const hideIds = [];

  // For each highlight, look at all overlapping highlights and examine the set of codes
  for (let i = 0; i < highlights.length; i++) {
    const h = highlights[i];

    // Collect codes of all overlapping highlights (including itself)
    const codes = new Set();
    for (let j = 0; j < highlights.length; j++) {
      const other = highlights[j];
      if (rangesOverlap(h, other)) {
        codes.add(other.code);
        // Early exit if we already know there's disagreement
        if (codes.size > 1) break;
      }
    }

    // If only one unique code among all overlaps, then it's uniquely coded -> hide it
    if (codes.size === 1) {
      hideIds.push(h.id);
    }
  }

  return hideIds;
};

/**
 * Filters highlights to remove "uniquely coded" ones
 * 
 * @param {Array} highlights - Array of highlight objects
 * @param {boolean} hideSameCodeHighlights - Whether to hide highlights where overlaps use the same code only
 * @returns {Array} Filtered array of highlights
 */
export const filterUniquelyCodedHighlights = (highlights, hideSameCodeHighlights) => {
  if (!hideSameCodeHighlights || !highlights) return highlights;
  const hideIds = getUniquelyCodedHighlightIds(highlights);
  if (hideIds.length === 0) return highlights;
  const hideSet = new Set(hideIds);
  return highlights.filter(h => !hideSet.has(h.id));
};

/**
 * Filters out highlights authored by users in the hiddenUserIds list.
 *
 * @param {Array} highlights - Array of highlight objects (each may carry userId)
 * @param {Array<string>} hiddenUserIds - User IDs whose highlights should be hidden
 * @returns {Array} Filtered array of highlights
 */
export const filterHighlightsByHiddenUsers = (highlights, hiddenUserIds) => {
  if (!highlights || !hiddenUserIds || hiddenUserIds.length === 0) return highlights;
  const hiddenSet = new Set(hiddenUserIds);
  return highlights.filter((h) => !hiddenSet.has(h.userId));
};
