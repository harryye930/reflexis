/**
 * Utility functions for hover preferences and user color management
 */

// Distinct color for "codes only" mode - choose a color not in the current palette
// This unified color is used when showAuthor = false (codes only mode)
export const UNIFIED_USER_COLOR = '#6366f1'; // Indigo-500, distinct from existing colors

/**
 * Get the appropriate user color based on hover preferences
 * @param {Object} user - User profile object
 * @param {boolean} showAuthor - Whether to show author info (individual colors)
 * @returns {string} The color to use for the user indicator
 */
export const getUserDisplayColor = (user, showAuthor) => {
  if (!showAuthor) {
    return UNIFIED_USER_COLOR;
  }
  return user?.color || '#e5e7eb';
};

/**
 * Get the appropriate user name display based on hover preferences
 * @param {Object} user - User profile object
 * @param {boolean} showAuthor - Whether to show author info
 * @param {Object} currentUser - Current user object
 * @param {string} userId - User ID of the highlight owner
 * @returns {string|null} The name to display, or null if should be hidden
 */
export const getUserDisplayName = (user, showAuthor, currentUser, userId) => {
  if (!showAuthor) {
    return null; // Hide author info completely
  }
  
  const name = user?.name || 'Anonymous';
  const isCurrentUser = currentUser && userId === currentUser.uid;
  return isCurrentUser ? `${name} (you)` : name;
};

/**
 * Determine if author info should be shown based on preferences
 * @param {boolean} showAuthor - Whether to show author info
 * @returns {boolean} Whether to show author information
 */
export const shouldShowAuthorInfo = (showAuthor) => {
  return showAuthor;
};
