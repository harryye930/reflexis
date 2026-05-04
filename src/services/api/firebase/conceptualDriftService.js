import { collection, query, where, getDocs } from 'firebase/firestore';
import { db } from '../../../lib/firebase.js';
import { authFetch } from '../../../lib/authFetch.js';
import { CodeService } from './codeService.js';

export class ConceptualDriftService {
  constructor(projectId) {
    this.projectId = projectId;
    this.codeService = new CodeService(projectId);
  }

  /**
   * Detect conceptual drift by analyzing a new passage against existing code examples
   * @param {Object} params - Detection parameters
   * @param {string} params.codeId - The code ID to check against
   * @param {string} params.newPassage - The new text passage to analyze
   * @param {string} params.documentId - Current document ID
   * @returns {Object} Drift detection result
   */
  async detectConceptualDrift({ codeId, newPassage, documentId, context }) {
    try {
      // Get the code definition using existing CodeService
      const codeResult = await this.codeService.getCode(codeId);
      if (!codeResult.success) {
        return { success: false, error: codeResult.error };
      }

      const code = codeResult.data;

      // Get representative examples of this code's usage
      const examplesResult = await this._getRepresentativeExamples(codeId, documentId);
      if (!examplesResult.success) {
        return { success: false, error: examplesResult.error };
      }

      const examples = examplesResult.data;

      // If we don't have enough examples, allow the highlight (no drift detection needed)
      if (examples.length < 2) {
        return {
          success: true,
          data: {
            drift_detected: false,
            explanation: 'Insufficient examples for conceptual drift detection',
            suggested_definition: null,
            examples_count: examples.length
          }
        };
      }

      // Call LLM API for conceptual drift analysis
      const driftResult = await this._analyzeDriftWithLLM({
        codeName: code.label,
        codeDefinition: code.description,
        existingExamples: examples,
        newPassage,
        context
      });

      return driftResult;

    } catch (error) {
      console.error('Error detecting conceptual drift:', error);
      return { success: false, error: error.message };
    }
  }

  /**
   * Get representative examples of code usage
   * @private
   */
  async _getRepresentativeExamples(codeId, currentDocumentId, maxExamples = 5) {
    try {
      const highlightsCollection = collection(db, `projects/${this.projectId}/highlights`);
      const highlightsQuery = query(highlightsCollection, where('code', '==', codeId));
      const querySnapshot = await getDocs(highlightsQuery);
      
      const highlights = querySnapshot.docs.map(doc => ({
        id: doc.id,
        ...doc.data()
      }));

      // Filter out current document highlights to avoid self-reference
      const externalHighlights = highlights.filter(h => h.documentId !== currentDocumentId);
      
      // If we have too few external examples, include some from current document
      let selectedHighlights = externalHighlights;
      if (selectedHighlights.length < 3 && highlights.length > externalHighlights.length) {
        const currentDocHighlights = highlights.filter(h => h.documentId === currentDocumentId);
        selectedHighlights = [
          ...externalHighlights,
          ...currentDocHighlights.slice(0, Math.max(0, 3 - externalHighlights.length))
        ];
      }

      // Sort by creation date and take most recent examples
      selectedHighlights.sort((a, b) => new Date(b.createdAt) - new Date(a.createdAt));
      selectedHighlights = selectedHighlights.slice(0, maxExamples);

      // Format examples for LLM analysis
      const examples = selectedHighlights.map(highlight => ({
        text: highlight.text,
        documentId: highlight.documentId,
        documentTitle: highlight.documentTitle || 'Unknown Document',
        createdAt: highlight.createdAt
      }));

      return { success: true, data: examples };

    } catch (error) {
      console.error('Error getting representative examples:', error);
      return { success: false, error: error.message };
    }
  }

  /**
   * Analyze conceptual drift using LLM
   * @private
   */
  async _analyzeDriftWithLLM({ codeName, codeDefinition, existingExamples, newPassage, context }) {
    try {
      const response = await authFetch('/api/code-drift/detect', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({
          codeName,
          codeDefinition,
          existingExamples,
          newPassage,
          context,
          llmEnabled: true
        }),
      });

      if (!response.ok) {
        throw new Error(`API request failed: ${response.status} ${response.statusText}`);
      }

      const result = await response.json();
      
      return {
        success: true,
        data: {
          drift_detected: result.drift_detected,
          explanation: result.explanation,
          suggested_definition: result.suggested_definition,
          examples_count: existingExamples.length
        }
      };

    } catch (error) {
      console.error('Error calling LLM API for conceptual drift detection:', error);
      return { 
        success: false, 
        error: `Failed to analyze conceptual drift: ${error.message}` 
      };
    }
  }

  /**
   * Get conceptual drift history for a code (for analytics/debugging)
   */
  async getConceptualDriftHistory(codeId) {
    try {
      // This could be implemented to track drift detection events
      // For now, return empty history as this is not stored in Firebase
      return {
        success: true,
        data: []
      };
    } catch (error) {
      console.error('Error getting conceptual drift history:', error);
      return { success: false, error: error.message };
    }
  }
}
