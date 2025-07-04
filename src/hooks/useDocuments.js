import { useState, useEffect } from 'react';
import { collection, onSnapshot, addDoc, doc, setDoc, deleteDoc, query, orderBy } from 'firebase/firestore';
import { db } from '../lib/firebase.js';
import { defaultDocuments } from '../constants/index.js';

export const useDocuments = (appId, currentUser) => {
  const [documents, setDocuments] = useState([]);
  const [activeDocumentId, setActiveDocumentId] = useState(defaultDocuments[0].id);
  const [documentsLoaded, setDocumentsLoaded] = useState(false);

  // Get the currently active document
  const activeDocument = documents.find(doc => doc.id === activeDocumentId) || defaultDocuments[0];

  useEffect(() => {
    if (!currentUser) {
      // When no user, just show default documents
      setDocuments(defaultDocuments);
      setDocumentsLoaded(true);
      return;
    }

    // Listen for documents in the system
    const documentsCollection = collection(db, `artifacts/${appId}/public/data/documents`);
    const documentsQuery = query(documentsCollection, orderBy('createdAt', 'asc'));
    
    const unsubscribe = onSnapshot(documentsQuery, async (snapshot) => {
      const userDocuments = snapshot.docs.map(doc => ({ 
        id: doc.id, 
        docId: doc.id,
        isDefault: false,
        ...doc.data() 
      }));

      // Ensure default documents exist in the database
      const existingIds = new Set(userDocuments.map(doc => doc.id));
      const missingDefaults = defaultDocuments.filter(doc => !existingIds.has(doc.id));
      
      // Add missing default documents to the database
      if (missingDefaults.length > 0 && currentUser) {
        try {
          const addPromises = missingDefaults.map(async (defaultDoc) => {
            const docRef = doc(db, `artifacts/${appId}/public/data/documents`, defaultDoc.id);
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
        } catch (error) {
          console.error('Error adding default documents:', error);
          // Continue without failing the entire hook
        }
      }

      // Combine all documents
      const allDocuments = [
        ...defaultDocuments.map(defaultDoc => {
          const userDoc = userDocuments.find(doc => doc.id === defaultDoc.id);
          return userDoc || defaultDoc;
        }),
        ...userDocuments.filter(doc => !defaultDocuments.some(defaultDoc => defaultDoc.id === doc.id))
      ];

      setDocuments(allDocuments);
      setDocumentsLoaded(true);
    });

    return () => unsubscribe();
  }, [appId, currentUser]);

  const addDocument = async ({ title, description, content }) => {
    if (!currentUser) return { success: false, error: 'User not authenticated' };

    try {
      const documentsCollection = collection(db, `artifacts/${appId}/public/data/documents`);
      const docRef = await addDoc(documentsCollection, {
        title,
        description,
        content,
        isDefault: false,
        createdAt: new Date(),
        createdBy: currentUser.uid
      });
      
      return { success: true, id: docRef.id };
    } catch (error) {
      console.error("Error adding document: ", error);
      return { success: false, error };
    }
  };

  const updateDocument = async (documentId, { title, description, content }) => {
    if (!currentUser) return { success: false, error: 'User not authenticated' };

    try {
      const docRef = doc(db, `artifacts/${appId}/public/data/documents`, documentId);
      await setDoc(docRef, {
        title,
        description,
        content,
        updatedAt: new Date(),
        updatedBy: currentUser.uid
      }, { merge: true });
      
      return { success: true };
    } catch (error) {
      console.error("Error updating document: ", error);
      return { success: false, error };
    }
  };

  const deleteDocument = async (documentId) => {
    if (!currentUser) return { success: false, error: 'User not authenticated' };

    // Prevent deletion of default documents
    const document = documents.find(doc => doc.id === documentId);
    if (document?.isDefault) {
      return { success: false, error: 'Cannot delete default documents' };
    }

    try {
      await deleteDoc(doc(db, `artifacts/${appId}/public/data/documents`, documentId));
      
      // Switch to default document if deleting active document
      if (activeDocumentId === documentId) {
        setActiveDocumentId(defaultDocuments[0].id);
      }
      
      return { success: true };
    } catch (error) {
      console.error("Error deleting document: ", error);
      return { success: false, error };
    }
  };

  const switchActiveDocument = (documentId) => {
    setActiveDocumentId(documentId);
  };

  return { 
    documents, 
    activeDocument, 
    activeDocumentId,
    documentsLoaded,
    addDocument, 
    updateDocument, 
    deleteDocument, 
    switchActiveDocument 
  };
};
