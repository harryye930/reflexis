import { authFetch } from '../../../lib/authFetch.js';

// Service for generating research background keyword summaries
export class ResearchBackgroundSummaryService {
  /**
   * Generate a keyword summary of a research background
   * @param {string} researchBackground - The full research background text
   * @param {string} userName - Optional user name for context
   * @returns {Promise<{success: boolean, keywords?: string, error?: string}>}
   */
  static async generateSummary(researchBackground, userName = null) {
    try {
      if (!researchBackground || typeof researchBackground !== 'string') {
        return { success: false, error: 'Valid research background is required' };
      }

      const response = await authFetch('/api/research-background/summary', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({
          researchBackground: researchBackground.trim(),
          userName
        }),
      });

      if (!response.ok) {
        const errorData = await response.json().catch(() => ({}));
        throw new Error(errorData.error || `HTTP error! status: ${response.status}`);
      }

      const data = await response.json();
      
      if (!data.success || !data.keywords) {
        throw new Error(data.error || 'Failed to generate keywords');
      }

      return {
        success: true,
        keywords: data.keywords.trim()
      };
    } catch (error) {
      console.error('Error generating research background summary:', error);
      return {
        success: false,
        error: error.message || 'Failed to generate research background summary'
      };
    }
  }
}
