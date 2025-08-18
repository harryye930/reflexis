/**
 * Utility functions for calculating code disagreement metrics
 */

/**
 * Calculate simple percentage agreement for a code
 * @param {Array} highlights - All highlights for the code across all documents  
 * @param {Array} users - Array of unique user IDs who have used this code
 * @returns {Object} Disagreement analysis object
 */
export function calculateCodeDisagreement(highlights, users) {
  // Handle edge cases
  if (!highlights || highlights.length === 0) {
    return {
      agreementPercentage: 100,
      disagreementLevel: 'No Data',
      color: 'gray',
      totalHighlights: 0,
      uniqueUsers: 0,
      hasMultipleUsers: false,
      details: 'No highlights found for this code'
    };
  }

  // Get unique users who have used this code
  const uniqueUserIds = new Set(highlights.map(h => h.userId));
  const uniqueUserCount = uniqueUserIds.size;

  // If only one user, perfect agreement
  if (uniqueUserCount <= 1) {
    return {
      agreementPercentage: 100,
      disagreementLevel: 'Single Coder',
      color: 'gray',
      totalHighlights: highlights.length,
      uniqueUsers: uniqueUserCount,
      hasMultipleUsers: false,
      details: 'Only one user has used this code'
    };
  }

  // Group highlights by text segments to find overlaps and disagreements
  const textSegments = new Map();
  
  highlights.forEach(highlight => {
    const key = `${highlight.documentId}-${highlight.startIndex}-${highlight.endIndex}`;
    if (!textSegments.has(key)) {
      textSegments.set(key, []);
    }
    textSegments.get(key).push(highlight);
  });

  // Calculate agreement metrics
  let agreementInstances = 0;
  let totalOpportunities = 0;
  let overlappingSegments = 0;
  let totalSegments = textSegments.size;

  textSegments.forEach(segmentHighlights => {
    const segmentUsers = new Set(segmentHighlights.map(h => h.userId));
    
    if (segmentUsers.size > 1) {
      // Multiple users highlighted this exact segment - this is agreement
      overlappingSegments++;
      agreementInstances += segmentUsers.size;
      totalOpportunities += segmentUsers.size;
    } else {
      // Only one user highlighted this segment
      totalOpportunities += 1;
    }
  });

  // Calculate percentage agreement
  // Agreement = (number of times multiple users agreed on same segment) / total opportunities
  const agreementPercentage = totalOpportunities > 0 ? 
    Math.round((agreementInstances / totalOpportunities) * 100) : 0;

  // Determine disagreement level and color with more intuitive labels
  const disagreementPercentage = 100 - agreementPercentage;
  let disagreementLevel, color;

  if (disagreementPercentage >= 70) {
    disagreementLevel = 'Needs Discussion';
    color = 'red';
  } else if (disagreementPercentage >= 40) {
    disagreementLevel = 'May Need Discussion';
    color = 'orange';
  } else if (disagreementPercentage >= 15) {
    disagreementLevel = 'Minor Disagreement';
    color = 'yellow';
  } else {
    disagreementLevel = 'No Discussion Needed';
    color = 'green';
  }

  return {
    agreementPercentage,
    disagreementLevel,
    color,
    totalHighlights: highlights.length,
    uniqueUsers: uniqueUserCount,
    hasMultipleUsers: uniqueUserCount > 1,
    overlappingSegments,
    totalSegments,
    details: `${overlappingSegments} segments with multiple coders out of ${totalSegments} total segments`
  };
}

/**
 * Get color classes for disagreement level
 * @param {string} color - The base color (red, orange, yellow, green, gray)
 * @param {string} variant - The variant (bg, text, border)
 * @returns {string} Tailwind CSS classes
 */
export function getDisagreementColorClasses(color, variant = 'bg') {
  const colorMap = {
    red: {
      bg: 'bg-red-100',
      text: 'text-red-800',
      border: 'border-red-200',
      dot: 'bg-red-500'
    },
    orange: {
      bg: 'bg-orange-100',
      text: 'text-orange-800',
      border: 'border-orange-200',
      dot: 'bg-orange-500'
    },
    yellow: {
      bg: 'bg-yellow-100',
      text: 'text-yellow-800',
      border: 'border-yellow-200',
      dot: 'bg-yellow-500'
    },
    green: {
      bg: 'bg-green-100',
      text: 'text-green-800',
      border: 'border-green-200',
      dot: 'bg-green-500'
    },
    gray: {
      bg: 'bg-gray-100',
      text: 'text-gray-600',
      border: 'border-gray-200',
      dot: 'bg-gray-400'
    }
  };

  return colorMap[color]?.[variant] || colorMap.gray[variant];
}

/**
 * Format disagreement percentage for display
 * @param {number} percentage - The agreement percentage
 * @returns {string} Formatted percentage string
 */
export function formatDisagreementPercentage(percentage) {
  const disagreement = 100 - percentage;
  if (disagreement === 0) return '0%';
  if (disagreement === 100) return '100%';
  return `${disagreement}%`;
}
