import { useState, useEffect, useMemo } from 'react';
import { DocumentService } from '../services/api/firebase/documentService.js';

// Firestore is the source of truth for a project's corpus. Default documents
// are written once when a project is created, so admins can delete or replace
// them without the client silently restoring prototype sample content.

export const useDocuments = (projectId, currentUser, isOwner = false) => {
  const [documents, setDocuments] = useState([]);
  const [activeDocumentId, setActiveDocumentId] = useState(null);
  const [documentsLoaded, setDocumentsLoaded] = useState(false);
  const documentService = useMemo(() => (
    projectId ? new DocumentService(projectId) : null
  ), [projectId]);

  const activeDocument = documents.find((doc) => doc.id === activeDocumentId) || null;

  useEffect(() => {
    if (!currentUser || !projectId || !documentService) {
      setDocuments([]);
      setActiveDocumentId(null);
      setDocumentsLoaded(true);
      return;
    }

    const unsubscribe = documentService.onDocumentsSnapshot((userDocuments) => {
      setDocuments(userDocuments);
      setDocumentsLoaded(true);
      // Keep activeDocumentId valid as documents come and go (e.g. after
      // an admin deletes the currently-open doc).
      setActiveDocumentId((current) => {
        if (current && userDocuments.some((d) => d.id === current)) return current;
        return userDocuments[0]?.id ?? null;
      });
    });

    return () => unsubscribe();
  }, [projectId, currentUser, documentService]);

  const addDocument = async ({ title, description, content }) => {
    if (!currentUser) return { success: false, error: 'User not authenticated' };
    if (!documentService) return { success: false, error: 'No project selected' };

    return await documentService.addDocument({ title, description, content }, currentUser.uid);
  };

  const updateDocument = async (documentId, { title, description, content }) => {
    if (!currentUser) return { success: false, error: 'User not authenticated' };
    if (!documentService) return { success: false, error: 'No project selected' };

    return await documentService.updateDocument(documentId, { title, description, content }, currentUser.uid);
  };

  const deleteDocument = async (documentId) => {
    if (!currentUser) return { success: false, error: 'User not authenticated' };
    if (!documentService) return { success: false, error: 'No project selected' };
    // Mirror the Firestore rule so non-admins get a clear message instead
    // of a permission-denied surprise from the network.
    if (!isOwner) return { success: false, error: 'Only project admins can delete documents.' };

    const result = await documentService.deleteDocument(documentId);

    if (result.success && activeDocumentId === documentId) {
      const next = documents.find((doc) => doc.id !== documentId);
      setActiveDocumentId(next?.id ?? null);
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
