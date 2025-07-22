import { collection, onSnapshot, addDoc, deleteDoc, doc, query, where, setDoc, getDoc } from 'firebase/firestore';
import { db } from '../../../lib/firebase.js';
import { CodeService } from './codeService.js';

export class HighlightService {
  constructor(appId) {
    this.appId = appId;
    this.codeService = new CodeService(appId);
  }

  // Listen to highlights for a specific document
  onHighlightsSnapshot(documentId, callback) {
    const highlightsCollection = collection(db, `artifacts/${this.appId}/public/data/highlights`);
    const highlightsQuery = query(highlightsCollection, where('documentId', '==', documentId));
    
    return onSnapshot(highlightsQuery, (snapshot) => {
      const highlightsData = snapshot.docs.map(doc => ({ id: doc.id, ...doc.data() }));
      callback(highlightsData);
    });
  }

  // Add a new highlight
  async addHighlight(highlightData, userId) {
    try {
      const highlightsCollection = collection(db, `artifacts/${this.appId}/public/data/highlights`);
      const docRef = await addDoc(highlightsCollection, {
        ...highlightData,
        userId,
        createdAt: new Date()
      });
      
      // Record code application in history if a code was applied
      if (highlightData.code) {
        try {
          // Get document title for history tracking
          const documentTitle = highlightData.documentTitle || `Document ${highlightData.documentId}`;
          
          // Get code data for history tracking  
          const codeResult = await this.codeService.getCode(highlightData.code);
          const codeLabel = codeResult.success ? codeResult.data.label : 'Unknown Code';
          
          await this.codeService.recordCodeApplication(
            highlightData.code,
            codeLabel,
            highlightData.documentId,
            documentTitle,
            userId
          );
        } catch (historyError) {
          console.warn("Failed to record code application history:", historyError);
          // Don't fail the highlight creation if history tracking fails
        }
      }
      
      return { success: true, highlightId: docRef.id };
    } catch (error) {
      console.error("Error adding highlight: ", error);
      return { success: false, error };
    }
  }

  // Delete a highlight
  async deleteHighlight(highlightId) {
    try {
      await deleteDoc(doc(db, `artifacts/${this.appId}/public/data/highlights`, highlightId));
      return { success: true };
    } catch (error) {
      console.error("Error deleting highlight: ", error);
      return { success: false, error };
    }
  }

  // Get highlights for a specific document
  async getHighlights(documentId) {
    try {
      const highlightsCollection = collection(db, `artifacts/${this.appId}/public/data/highlights`);
      const highlightsQuery = query(highlightsCollection, where('documentId', '==', documentId));
      
      const snapshot = await new Promise((resolve) => {
        const unsubscribe = onSnapshot(highlightsQuery, resolve, { includeMetadataChanges: true });
        setTimeout(() => unsubscribe(), 1000); // Timeout after 1 second
      });
      
      const highlightsData = snapshot.docs.map(doc => ({ id: doc.id, ...doc.data() }));
      return { success: true, data: highlightsData };
    } catch (error) {
      console.error("Error getting highlights: ", error);
      return { success: false, error };
    }
  }

  // Update a highlight
  async updateHighlight(highlightId, updateData) {
    try {
      const highlightDocRef = doc(db, `artifacts/${this.appId}/public/data/highlights`, highlightId);
      await setDoc(highlightDocRef, {
        ...updateData,
        updatedAt: new Date()
      }, { merge: true });
      
      return { success: true };
    } catch (error) {
      console.error("Error updating highlight: ", error);
      return { success: false, error };
    }
  }

  // Helper method to add context information to highlights
  async addContextToHighlights(highlights) {
    // Group highlights by document for efficient document fetching
    const documentMap = new Map();
    const documentsToFetch = new Set();
    
    highlights.forEach(highlight => {
      documentsToFetch.add(highlight.documentId);
    });

    // Fetch all unique documents
    const documentsCollection = collection(db, `artifacts/${this.appId}/public/data/documents`);
    const fetchPromises = Array.from(documentsToFetch).map(async (documentId) => {
      try {
        const docRef = doc(documentsCollection, documentId);
        const docSnapshot = await getDoc(docRef);
        if (docSnapshot.exists()) {
          documentMap.set(documentId, docSnapshot.data());
        }
      } catch (error) {
        console.warn(`Failed to fetch document ${documentId}:`, error);
      }
    });

    await Promise.all(fetchPromises);

    // Add context to each highlight
    const contextLength = 100; // Number of characters before/after highlight
    
    return highlights.map(highlight => {
      const document = documentMap.get(highlight.documentId);
      if (!document || !document.content) {
        return {
          ...highlight,
          contextBefore: '',
          contextAfter: '',
          hasContext: false
        };
      }

      const fullText = document.content;
      const startIndex = highlight.startIndex || 0;
      const endIndex = highlight.endIndex || startIndex + highlight.text.length;

      // Calculate context boundaries
      const contextStartIndex = Math.max(0, startIndex - contextLength);
      const contextEndIndex = Math.min(fullText.length, endIndex + contextLength);

      // Extract context before and after
      const contextBefore = fullText.substring(contextStartIndex, startIndex);
      const contextAfter = fullText.substring(endIndex, contextEndIndex);

      // Add ellipsis if context was truncated
      const needsEllipsisBefore = contextStartIndex > 0;
      const needsEllipsisAfter = contextEndIndex < fullText.length;

      return {
        ...highlight,
        contextBefore: (needsEllipsisBefore ? '...' : '') + contextBefore,
        contextAfter: contextAfter + (needsEllipsisAfter ? '...' : ''),
        hasContext: true
      };
    });
  }
}