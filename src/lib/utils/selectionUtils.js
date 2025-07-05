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

// Helper function to compare arrays
export const arraysEqual = (a, b) => {
  if (a.length !== b.length) return false;
  return a.every((val, index) => val === b[index]);
};

// Helper function to find text using context-aware search
export const findTextWithContext = (sourceText, targetText, beforeContext = '', afterContext = '') => {
  const normalizedTarget = targetText.replace(/\s+/g, ' ').trim();
  const normalizedBefore = beforeContext.replace(/\s+/g, ' ').trim();
  const normalizedAfter = afterContext.replace(/\s+/g, ' ').trim();
  const normalizedSource = sourceText.replace(/\s+/g, ' ');
  
  if (!normalizedTarget) return -1;
  
  // Find all occurrences of the target text in the normalized source
  const occurrences = [];
  let searchStart = 0;
  let foundIndex = -1;
  
  while ((foundIndex = normalizedSource.indexOf(normalizedTarget, searchStart)) !== -1) {
    occurrences.push(foundIndex);
    searchStart = foundIndex + 1;
  }
  
  if (occurrences.length === 0) return -1;
  if (occurrences.length === 1) return occurrences[0];
  
  // If we have multiple occurrences, use context to find the best match
  let bestMatch = -1;
  let bestScore = -1;
  
  for (const index of occurrences) {
    let score = 0;
    
    // Check before context
    if (normalizedBefore) {
      const contextWindow = 100; // Larger window for better matching
      const beforeStart = Math.max(0, index - contextWindow);
      const actualBefore = normalizedSource.substring(beforeStart, index).replace(/\s+/g, ' ').trim();
      
      // Use partial matching - if any part of the context appears, give it points
      const beforeWords = normalizedBefore.split(' ').filter(w => w.length > 2);
      for (const word of beforeWords) {
        if (actualBefore.includes(word)) {
          score += 1;
        }
      }
    }
    
    // Check after context
    if (normalizedAfter) {
      const contextWindow = 100;
      const afterEnd = Math.min(normalizedSource.length, index + normalizedTarget.length + contextWindow);
      const actualAfter = normalizedSource.substring(index + normalizedTarget.length, afterEnd).replace(/\s+/g, ' ').trim();
      
      const afterWords = normalizedAfter.split(' ').filter(w => w.length > 2);
      for (const word of afterWords) {
        if (actualAfter.includes(word)) {
          score += 1;
        }
      }
    }
    
    if (score > bestScore) {
      bestScore = score;
      bestMatch = index;
    }
  }
  
  // If no context matched well, return the first occurrence
  return bestScore > 0 ? bestMatch : occurrences[0];
};
