import { useState } from 'react';

export const useDiscussionPrompt = () => {
  const [isGenerating, setIsGenerating] = useState(false);
  const [discussionPrompt, setDiscussionPrompt] = useState(null);
  const [error, setError] = useState(null);

  const generateDiscussionPrompt = async ({ 
    highlights, 
    userProfiles, 
    allCodes, 
    activeDocument 
  }) => {
    if (!highlights || highlights.length < 2) {
      return { success: false, error: 'Need at least 2 highlights for discussion prompt' };
    }

    // Check if we have different codes applied by different users
    const uniqueUserCodes = new Map();
    highlights.forEach(highlight => {
      const userId = highlight.userId;
      const codeId = highlight.code;
      const code = allCodes?.find(c => c.id === codeId);
      
      if (code && userId) {
        uniqueUserCodes.set(userId, {
          codeId,
          codeName: code.label,
          codeDescription: code.description,
          positionality: userProfiles[userId]?.researchBackground,
          userName: userProfiles[userId]?.name
        });
      }
    });

    // Only generate prompt if we have different codes from different users
    if (uniqueUserCodes.size < 2) {
      return { success: false, error: 'Need different codes from different users' };
    }

    // Check if the codes are actually different
    const uniqueCodes = new Set([...uniqueUserCodes.values()].map(u => u.codeId));
    if (uniqueCodes.size < 2) {
      return { success: false, error: 'All users applied the same code' };
    }

    setIsGenerating(true);
    setError(null);

    try {
      // Get the coded text and context
      const primaryHighlight = highlights[0];
      const codedText = primaryHighlight.text;
      
      // Extract full context from the document
      let context = codedText; // fallback to just the coded text if no document
      
      if (activeDocument?.content && primaryHighlight.startIndex !== undefined) {
        const contextLength = 100;
        const startIndex = primaryHighlight.startIndex;
        const endIndex = primaryHighlight.endIndex || startIndex + codedText.length;
        
        const contextStart = Math.max(0, startIndex - contextLength);
        const contextEnd = Math.min(activeDocument.content.length, endIndex + contextLength);
        
        const beforeContext = activeDocument.content.substring(contextStart, startIndex);
        const afterContext = activeDocument.content.substring(endIndex, contextEnd);
        
        // Build full context with ellipsis if truncated
        const beforeWithEllipsis = contextStart > 0 ? '...' + beforeContext : beforeContext;
        const afterWithEllipsis = contextEnd < activeDocument.content.length ? afterContext + '...' : afterContext;
        
        context = beforeWithEllipsis + codedText + afterWithEllipsis;
      }

      // Prepare researchers data
      const researchers = [...uniqueUserCodes.entries()].map(([userId, data]) => ({
        userId,
        name: data.userName || 'Anonymous',
        positionality: data.positionality || 'Not specified',
        code: data.codeName,
        codeId: data.codeId,
        codeDescription: data.codeDescription
      }));

      // Prepare detailed code definitions for the API
      const codeDefinitions = researchers.map(r => ({
        name: r.code,
        description: r.codeDescription || 'No description provided'
      }));

      const response = await fetch('/api/discussion-prompt/generate', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({
          codedText,
          context,
          codes: researchers.map(r => r.code),
          codeDefinitions,
          researchers,
          documentTitle: activeDocument?.title
        }),
      });

      const result = await response.json();

      if (result.success) {
        setDiscussionPrompt({
          title: result.title,
          prompt: result.prompt,
          researchers: researchers,
          codedText: codedText,
          context: context !== codedText ? context : null
        });
        return { success: true, prompt: result };
      } else {
        setError(result.error || 'Failed to generate discussion prompt');
        return { success: false, error: result.error || 'Failed to generate discussion prompt' };
      }
    } catch (err) {
      console.error('Error generating discussion prompt:', err);
      const errorMessage = 'Failed to generate discussion prompt';
      setError(errorMessage);
      return { success: false, error: errorMessage };
    } finally {
      setIsGenerating(false);
    }
  };

  const clearDiscussionPrompt = () => {
    setDiscussionPrompt(null);
    setError(null);
  };

  return {
    isGenerating,
    discussionPrompt,
    error,
    generateDiscussionPrompt,
    clearDiscussionPrompt
  };
};
