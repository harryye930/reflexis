import { useCallback } from 'react';
import { HighlightService } from '../services/api/firebase/highlightService.js';

export const useNavigateToHighlight = (appId, activeDocumentId, highlights, switchActiveDocument, showMessage) => {
  const handleNavigateToHighlight = useCallback(async (documentId, highlightId) => {
    try {
      // First, switch to the correct document if not already active
      const needsDocumentSwitch = activeDocumentId !== documentId;
      if (needsDocumentSwitch) {
        showMessage('Switching to document...');
        switchActiveDocument(documentId);
      }

      // Check if we already have the highlight in current highlights array (fast path)
      let targetHighlight = highlights.find(h => h.id === highlightId);
      
      // If not found and we switched documents, or if not found at all, fetch fresh data
      if (!targetHighlight) {
        let attempts = 0;
        const maxAttempts = needsDocumentSwitch ? 8 : 3; // Fewer attempts if no document switch needed
        
        // Create a temporary highlight service to fetch fresh data
        const tempHighlightService = new HighlightService(appId);
        
        // Poll for the highlight to be available
        while (attempts < maxAttempts && !targetHighlight) {
          try {
            // Get fresh highlights for the document
            const freshHighlights = await new Promise((resolve) => {
              const unsubscribe = tempHighlightService.onHighlightsSnapshot(documentId, (highlightsData) => {
                unsubscribe(); // Immediately unsubscribe
                resolve(highlightsData);
              });
            });
            
            targetHighlight = freshHighlights.find(h => h.id === highlightId);
            
            if (!targetHighlight) {
              // Shorter wait times, especially if no document switch
              const waitTime = needsDocumentSwitch ? 150 : 100;
              await new Promise(resolve => setTimeout(resolve, waitTime));
              attempts++;
            }
          } catch (error) {
            console.warn('Error fetching highlights:', error);
            const waitTime = needsDocumentSwitch ? 150 : 100;
            await new Promise(resolve => setTimeout(resolve, waitTime));
            attempts++;
          }
        }
      }

      if (!targetHighlight) {
        console.warn('Highlight not found after polling:', highlightId);
        console.warn('Document ID:', documentId);
        showMessage('Could not find the highlighted text. It may have been deleted.', true);
        return;
      }

      // Wait for DOM to be ready and search for the element with retry logic
      const findAndScrollToElement = (retryCount = 0) => {
        const maxRetries = 3; // Reduced retries
        
        // Find the highlight element in the DOM
        const textContainer = document.getElementById('text-container');
        if (!textContainer) {
          if (retryCount < maxRetries) {
            setTimeout(() => findAndScrollToElement(retryCount + 1), 150); // Faster retry
            return;
          }
          console.warn('Text container not found after retries');
          showMessage('Document container not found', true);
          return;
        }

        // Look for highlight elements
        const highlightElements = textContainer.querySelectorAll('.highlight, .highlight-segment, [data-highlight-ids]');
        
        // Find the element that corresponds to our highlight
        let targetElement = null;
        const targetText = targetHighlight.text.trim();
        
        // First try: look for element with matching data attribute (fastest)
        for (const element of highlightElements) {
          const elementHighlightIds = element.dataset.highlightIds;
          if (elementHighlightIds && elementHighlightIds.split(',').includes(highlightId)) {
            targetElement = element;
            break;
          }
        }
        
        // Second try: exact text match (if data attribute not found)
        if (!targetElement) {
          for (const element of highlightElements) {
            if (element.textContent.trim() === targetText) {
              targetElement = element;
              break;
            }
          }
        }
        
        // Third try: partial text match for longer highlights (only if really needed)
        if (!targetElement && targetText.length > 20) {
          const targetStart = targetText.substring(0, 20);
          const targetEnd = targetText.substring(targetText.length - 20);
          
          for (const element of highlightElements) {
            const elementText = element.textContent.trim();
            if (elementText.includes(targetStart) && elementText.includes(targetEnd)) {
              targetElement = element;
              break;
            }
          }
        }

        if (targetElement) {
          // Scroll the element into view
          targetElement.scrollIntoView({ 
            behavior: 'smooth', 
            block: 'center',
            inline: 'nearest'
          });

          // Add a temporary highlight effect
          targetElement.style.animation = 'highlight-pulse 2s ease-in-out';
          
          // Remove the animation after it completes
          setTimeout(() => {
            if (targetElement.style) {
              targetElement.style.animation = '';
            }
          }, 2000);

          showMessage(`Navigated to highlighted text: "${targetText.substring(0, 50)}${targetText.length > 50 ? '...' : ''}"`);
        } else {
          if (retryCount < maxRetries) {
            setTimeout(() => findAndScrollToElement(retryCount + 1), 150); // Faster retry
            return;
          }
          console.warn('Could not locate highlight element in DOM after retries');
          showMessage('Found highlighted text data but could not locate it in the document. Try again.', true);
        }
      };

      // Start the DOM search - reduced initial delay or immediate if no document switch
      const initialDelay = needsDocumentSwitch ? 300 : 50;
      setTimeout(findAndScrollToElement, initialDelay);

    } catch (error) {
      console.error('Error navigating to highlight:', error);
      showMessage('Error navigating to highlight', true);
    }
  }, [appId, activeDocumentId, highlights, switchActiveDocument, showMessage]);

  return handleNavigateToHighlight;
};
