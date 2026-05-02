import { collection, onSnapshot, addDoc, doc, setDoc, deleteDoc, query, orderBy, getDoc } from 'firebase/firestore';
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
      await deleteDoc(doc(db, `projects/${this.projectId}/documents`, documentId));
      return { success: true };
    } catch (error) {
      console.error("Error deleting document: ", error);
      return { success: false, error };
    }
  }

  // Ensure default documents exist in the database
  async ensureDefaultDocuments(defaultDocuments, userId) {
    try {
      const documentsCollection = collection(db, `projects/${this.projectId}/documents`);
      
      // Get existing documents to check which defaults are missing
      const existingDocsQuery = query(documentsCollection);
      const snapshot = await new Promise((resolve) => {
        const unsubscribe = onSnapshot(existingDocsQuery, resolve, { includeMetadataChanges: true });
        setTimeout(() => unsubscribe(), 1000); // Timeout after 1 second
      });
      
      const existingIds = new Set(snapshot.docs.map(doc => doc.id));
      const missingDefaults = defaultDocuments.filter(doc => !existingIds.has(doc.id));
      
      // Add missing default documents
      if (missingDefaults.length > 0) {
        const addPromises = missingDefaults.map(async (defaultDoc) => {
          const docRef = doc(db, `projects/${this.projectId}/documents`, defaultDoc.id);
          await setDoc(docRef, {
            title: defaultDoc.title,
            description: defaultDoc.description,
            content: defaultDoc.content,
            isDefault: true,
            createdAt: defaultDoc.createdAt,
            createdBy: 'system'
          });
        });
        
        await Promise.all(addPromises);
      }
      
      return { success: true };
    } catch (error) {
      console.error('Error ensuring default documents:', error);
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
