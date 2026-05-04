import { collection, onSnapshot, addDoc, doc, setDoc, deleteDoc, query, orderBy, getDoc, where, getCountFromServer } from 'firebase/firestore';
import { db } from '../../../lib/firebase.js';

export class DocumentService {
  constructor(projectId) {
    this.projectId = projectId;
  }

  // Listen to documents collection
  onDocumentsSnapshot(callback) {
    const documentsCollection = collection(db, `projects/${this.projectId}/documents`);
    const documentsQuery = query(documentsCollection, orderBy('createdAt', 'asc'));
    
    return onSnapshot(documentsQuery, (snapshot) => {
      const documents = snapshot.docs.map(doc => ({ 
        id: doc.id, 
        docId: doc.id,
        isDefault: false,
        ...doc.data() 
      }));
      callback(documents);
    });
  }

  // Add a new document
  async addDocument(documentData, userId) {
    try {
      const documentsCollection = collection(db, `projects/${this.projectId}/documents`);
      const docRef = await addDoc(documentsCollection, {
        ...documentData,
        isDefault: false,
        createdAt: new Date(),
        createdBy: userId
      });
      
      return { success: true, id: docRef.id };
    } catch (error) {
      console.error("Error adding document: ", error);
      return { success: false, error };
    }
  }

  // Update an existing document
  async updateDocument(documentId, updateData, userId) {
    try {
      const docRef = doc(db, `projects/${this.projectId}/documents`, documentId);
      await setDoc(docRef, {
        ...updateData,
        updatedAt: new Date(),
        updatedBy: userId
      }, { merge: true });
      
      return { success: true };
    } catch (error) {
      console.error("Error updating document: ", error);
      return { success: false, error };
    }
  }

  // Delete a document
  async deleteDocument(documentId) {
    try {
      const blockers = await this.getDocumentDeletionBlockers(documentId);
      if (!blockers.success) return blockers;

      const { annotationCount, noteCount } = blockers;
      if (annotationCount > 0 || noteCount > 0) {
        return {
          success: false,
          blocked: true,
          blockers: { annotationCount, noteCount },
          error: `Delete blocked. Remove all annotations and reflexive notes from this document before deleting it. This document still has ${annotationCount} annotation${annotationCount === 1 ? '' : 's'} and ${noteCount} note${noteCount === 1 ? '' : 's'}.`
        };
      }

      await deleteDoc(doc(db, `projects/${this.projectId}/documents`, documentId));
      return { success: true };
    } catch (error) {
      console.error("Error deleting document: ", error);
      return { success: false, error };
    }
  }

  // Documents must be empty of annotations and notes before deletion.
  async getDocumentDeletionBlockers(documentId) {
    try {
      const highlightsCollection = collection(db, `projects/${this.projectId}/highlights`);
      const responsesCollection = collection(db, `projects/${this.projectId}/reflexive_responses`);

      const [highlightCountSnapshot, responseCountSnapshot] = await Promise.all([
        getCountFromServer(query(highlightsCollection, where('documentId', '==', documentId))),
        getCountFromServer(query(responsesCollection, where('documentId', '==', documentId)))
      ]);

      return {
        success: true,
        annotationCount: highlightCountSnapshot.data().count,
        noteCount: responseCountSnapshot.data().count
      };
    } catch (error) {
      console.error("Error checking document deletion blockers: ", error);
      return { success: false, error };
    }
  }

  // Get a single document by ID
  async getDocument(documentId) {
    try {
      const docRef = doc(db, `projects/${this.projectId}/documents`, documentId);
      const docSnap = await getDoc(docRef);
      
      if (docSnap.exists()) {
        return { success: true, data: { id: docSnap.id, ...docSnap.data() } };
      } else {
        return { success: false, error: 'Document not found' };
      }
    } catch (error) {
      console.error("Error getting document: ", error);
      return { success: false, error };
    }
  }
}
