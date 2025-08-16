import { useState, useEffect } from 'react';
import { DocumentService } from '../services/api/firebase/documentService.js';
import { defaultDocuments } from '../constants/defaultDocuments.js';

export const useDocuments = (appId, currentUser) => {
  const [documents, setDocuments] = useState([]);
  const [activeDocumentId, setActiveDocumentId] = useState(defaultDocuments[0].id);
  const [documentsLoaded, setDocumentsLoaded] = useState(false);
  const [documentService] = useState(() => new DocumentService(appId));

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
    const unsubscribe = documentService.onDocumentsSnapshot(async (userDocuments) => {
      // Ensure default documents exist in the database
      await documentService.ensureDefaultDocuments(defaultDocuments, currentUser.uid);

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
  }, [appId, currentUser, documentService]);

  const addDocument = async ({ title, description, content }) => {
    if (!currentUser) return { success: false, error: 'User not authenticated' };

    return await documentService.addDocument({ title, description, content }, currentUser.uid);
  };

  const updateDocument = async (documentId, { title, description, content }) => {
    if (!currentUser) return { success: false, error: 'User not authenticated' };

    return await documentService.updateDocument(documentId, { title, description, content }, currentUser.uid);
  };

  const deleteDocument = async (documentId) => {
    if (!currentUser) return { success: false, error: 'User not authenticated' };

    // Prevent deletion of default documents
    const document = documents.find(doc => doc.id === documentId);
    if (document?.isDefault) {
      return { success: false, error: 'Cannot delete default documents' };
    }

    const result = await documentService.deleteDocument(documentId);
    
    // Switch to default document if deleting active document
    if (result.success && activeDocumentId === documentId) {
      setActiveDocumentId(defaultDocuments[0].id);
    }
    
    return result;
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
