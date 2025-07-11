# Service Layer Architecture

This document describes the refactored service layer that provides a clean separation between React hooks and Firebase operations.

## Overview

The service layer abstracts all Firebase interactions into dedicated service classes, making the codebase more maintainable, testable, and following the separation of concerns principle.

## Architecture

```
src/
├── services/
│   └── api/
│       └── firebase/
│           ├── index.js              # Service factory
│           ├── authService.js        # Authentication operations
│           ├── documentService.js    # Document CRUD operations
│           ├── codeService.js        # Code management operations
│           ├── highlightService.js   # Highlight operations
│           └── notificationService.js # Notification operations
└── hooks/
    ├── useAuth.js                    # Uses AuthService
    ├── useDocuments.js               # Uses DocumentService
    ├── useCodes.js                   # Uses CodeService
    ├── useHighlights.js              # Uses HighlightService
    └── useNotifications.js           # Uses NotificationService
```

## Service Classes

### AuthService
Handles user authentication and profile management.

**Methods:**
- `onAuthStateChange(callback)` - Listen to auth state changes
- `signInAnonymously()` - Sign in anonymously
- `getUserDocument(userId)` - Get user document from Firestore
- `createUserDocument(userId, userData)` - Create new user document
- `updateUserDocument(userId, updateData)` - Update user document
- `completeProfile(userId, displayName, researchBackground)` - Complete user profile
- `setupNewUser(userId, isAnonymous)` - Setup new user with color assignment
- `updateLastSeen(userId)` - Update user's last seen timestamp

### DocumentService
Handles document CRUD operations.

**Methods:**
- `onDocumentsSnapshot(callback)` - Listen to documents collection
- `addDocument(documentData, userId)` - Add a new document
- `updateDocument(documentId, updateData, userId)` - Update an existing document
- `deleteDocument(documentId)` - Delete a document
- `ensureDefaultDocuments(defaultDocuments, userId)` - Ensure default documents exist
- `getDocument(documentId)` - Get a single document by ID

### CodeService
Handles code management operations.

**Methods:**
- `onCodesSnapshot(callback)` - Listen to codes collection
- `addCode(codeData, userId)` - Add a new code
- `updateCode(codeId, updateData, userId)` - Update an existing code
- `deleteCode(docId, userId, deletionReason, skipHistory)` - Delete a code (soft delete)
- `ensureDefaultCodes(defaultCodes, userId)` - Ensure default codes exist (one-time initialization)
- `getCode(codeId)` - Get a single code by ID

### HighlightService
Handles highlight operations.

**Methods:**
- `onHighlightsSnapshot(documentId, callback)` - Listen to highlights for a document
- `addHighlight(highlightData, userId)` - Add a new highlight
- `deleteHighlight(highlightId)` - Delete a highlight
- `getHighlights(documentId)` - Get highlights for a document
- `updateHighlight(highlightId, updateData)` - Update a highlight

### NotificationService
Handles notification operations.

**Methods:**
- `onNotificationsSnapshot(userId, callback)` - Listen to notifications for a user
- `addNotification(notification, userId)` - Add a new notification
- `markAsRead(notificationId)` - Mark notification as read
- `markAsUnread(notificationId)` - Mark notification as unread
- `deleteNotification(notificationId)` - Delete a notification
- `markAllAsRead(userId)` - Mark all notifications as read
- `getNotifications(userId)` - Get notifications for a user

## Service Factory

The `FirebaseServiceFactory` provides a convenient way to access all services:

```javascript
import { FirebaseServiceFactory } from '../services/api/firebase/index.js';

const services = new FirebaseServiceFactory(appId);

// Access individual services
const authService = services.auth;
const documentService = services.documents;
const codeService = services.codes;
const highlightService = services.highlights;
const notificationService = services.notifications;
```

## Usage Examples

### Using Individual Services

```javascript
import { AuthService } from '../services/api/firebase/authService.js';

const authService = new AuthService(appId);
const result = await authService.completeProfile(userId, name, background);
```

### Using Service Factory

```javascript
import { FirebaseServiceFactory } from '../services/api/firebase/index.js';

const services = new FirebaseServiceFactory(appId);

// Add a document
const result = await services.documents.addDocument({
  title: 'My Document',
  description: 'Document description',
  content: 'Document content'
}, userId);

// Add a notification
await services.notifications.addNotification({
  title: 'New highlight',
  message: 'Someone highlighted text in your document'
}, userId);
```

### In React Hooks

```javascript
import { useState, useEffect } from 'react';
import { DocumentService } from '../services/api/firebase/documentService.js';

export const useDocuments = (appId, currentUser) => {
  const [documents, setDocuments] = useState([]);
  const [documentService] = useState(() => new DocumentService(appId));

  useEffect(() => {
    if (!currentUser) return;

    const unsubscribe = documentService.onDocumentsSnapshot((documents) => {
      setDocuments(documents);
    });

    return () => unsubscribe();
  }, [appId, currentUser, documentService]);

  const addDocument = async (documentData) => {
    return await documentService.addDocument(documentData, currentUser.uid);
  };

  return { documents, addDocument };
};
```

## Benefits

1. **Separation of Concerns**: Firebase logic is separated from React hooks
2. **Testability**: Services can be easily mocked for testing
3. **Reusability**: Services can be used across different components
4. **Maintainability**: Changes to Firebase operations are centralized
5. **Type Safety**: Services provide consistent return formats
6. **Error Handling**: Centralized error handling in services

## Error Handling

All service methods return a consistent format:

```javascript
// Success case
{ success: true, data?: any, id?: string }

// Error case
{ success: false, error: string | Error }
```

## Migration Guide

To migrate existing code:

1. Replace direct Firebase imports with service imports
2. Replace Firebase operations with service method calls
3. Update error handling to use the consistent return format
4. Remove Firebase-specific logic from hooks

## Testing

Services can be easily mocked for testing:

```javascript
// Mock service
const mockDocumentService = {
  onDocumentsSnapshot: jest.fn(),
  addDocument: jest.fn().mockResolvedValue({ success: true, id: 'test-id' })
};

// Use in tests
jest.mock('../services/api/firebase/documentService.js', () => ({
  DocumentService: jest.fn().mockImplementation(() => mockDocumentService)
}));
``` 