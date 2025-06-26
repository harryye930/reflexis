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
