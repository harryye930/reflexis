import React, { useRef, useState } from 'react';
import { normalizeTextFileContent } from '../../lib/utils/textFileUtils.js';

const MAX_CONTENT_BYTES = 900 * 1024;
const byteSize = (str) => new Blob([str ?? '']).size;
const formatKB = (bytes) => `${(bytes / 1024).toFixed(1)} KB`;

const DocumentBrowser = ({
  documents,
  activeDocument,
  onDocumentSwitch,
  onAddDocument,
  onDeleteDocument,
  onMessage,
  currentUser,
  isOwner = false
}) => {
  const [showAddForm, setShowAddForm] = useState(false);
  const [newDocForm, setNewDocForm] = useState({ title: '', description: '', content: '' });
  const [pendingDeleteId, setPendingDeleteId] = useState(null);
  const fileInputRef = useRef(null);

  const handleFileUpload = (e) => {
    const file = e.target.files?.[0];
    e.target.value = '';
    if (!file) return;

    const isTxt = file.type === 'text/plain' || /\.txt$/i.test(file.name);
    if (!isTxt) {
      onMessage('Only .txt files are supported.', true);
      return;
    }

    const reader = new FileReader();
    reader.onload = () => {
      const raw = typeof reader.result === 'string' ? reader.result : '';
      // Normalize CRLF/CR to LF so highlight offsets stay consistent across platforms.
      const content = normalizeTextFileContent(raw);
      if (byteSize(content) > MAX_CONTENT_BYTES) {
        onMessage(`File exceeds the ${formatKB(MAX_CONTENT_BYTES)} size limit.`, true);
        return;
      }
      const baseName = file.name.replace(/\.txt$/i, '').slice(0, 100);
      setNewDocForm((prev) => ({
        ...prev,
        title: prev.title.trim() ? prev.title : baseName,
        content
      }));
    };
    reader.onerror = () => onMessage('Could not read the file.', true);
    reader.readAsText(file);
  };

  const handleAddDocument = async (e) => {
    e.preventDefault();

    if (!newDocForm.title.trim() || !newDocForm.content.trim()) {
      onMessage('Please fill in title and content fields', true);
      return;
    }

    if (byteSize(newDocForm.content) > MAX_CONTENT_BYTES) {
      onMessage(`Content exceeds the ${formatKB(MAX_CONTENT_BYTES)} size limit.`, true);
      return;
    }

    const result = await onAddDocument(newDocForm);
    if (result.success) {
      onMessage('Document added.');
      setNewDocForm({ title: '', description: '', content: '' });
      setShowAddForm(false);
      onDocumentSwitch(result.id);
    } else {
      onMessage(result.error || 'Failed to add document', true);
    }
  };

  const handleDeleteDocument = async (documentId, title) => {
    if (!isOwner || !onDeleteDocument) return;
    const confirmed = window.confirm(
      `Delete "${title}" from the corpus?\n\nThis will only be allowed if the document has no annotations or reflexive notes. Delete those annotations and notes first, then return here to delete the document.\n\nThis cannot be undone.`
    );
    if (!confirmed) return;

    setPendingDeleteId(documentId);
    const result = await onDeleteDocument(documentId);
    setPendingDeleteId(null);

    if (result.success) {
      onMessage('Document deleted.');
    } else {
      onMessage(result.error || 'Failed to delete document.', true);
    }
  };

  const truncateContent = (content, maxLength = 100) => {
    if (!content) return '';
    if (content.length <= maxLength) return content;
    return content.substring(0, maxLength) + '...';
  };

  const getWordCount = (content) => {
    if (!content) return 0;
    return content.trim().split(/\s+/).filter((word) => word.length > 0).length;
  };

  return (
    <div className="h-full flex flex-col bg-gray-50 border-r border-gray-200">
      {/* Header */}
      <div className="flex-shrink-0 p-4 border-b border-gray-200 bg-white">
        <div className="flex items-center justify-between">
          <div>
            <h2 className="text-lg font-semibold text-gray-900">Corpus</h2>
            <p className="text-xs text-gray-500 mt-0.5">
              {isOwner ? 'You can add and delete documents.' : 'Members can add documents. Only project admins can delete.'}
            </p>
          </div>
          {currentUser && (
            <button
              onClick={() => setShowAddForm(!showAddForm)}
              className="inline-flex items-center px-3 py-1.5 border border-transparent text-xs font-medium rounded-md text-white bg-blue-600 hover:bg-blue-700 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-blue-500"
              title="Add new document"
            >
              <svg className="w-3 h-3 mr-1" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 4v16m8-8H4" />
              </svg>
              {showAddForm ? 'Cancel' : 'Add'}
            </button>
          )}
        </div>
      </div>

      {/* Add Document Form */}
      {showAddForm && (
        <div className="flex-shrink-0 p-4 bg-white border-b border-gray-200">
          <form onSubmit={handleAddDocument} className="space-y-3">
            <div>
              <label className="block text-xs font-medium text-gray-700 mb-1">
                Title *
              </label>
              <input
                type="text"
                value={newDocForm.title}
                onChange={(e) => setNewDocForm((prev) => ({ ...prev, title: e.target.value }))}
                className="w-full px-3 py-2 border border-gray-300 rounded-md text-sm focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-transparent"
                placeholder="Document title"
                maxLength={100}
              />
            </div>
            <div>
              <label className="block text-xs font-medium text-gray-700 mb-1">
                Description
              </label>
              <input
                type="text"
                value={newDocForm.description}
                onChange={(e) => setNewDocForm((prev) => ({ ...prev, description: e.target.value }))}
                className="w-full px-3 py-2 border border-gray-300 rounded-md text-sm focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-transparent"
                placeholder="Brief description"
                maxLength={200}
              />
            </div>
            <div>
              <div className="flex items-center justify-between mb-1">
                <label className="block text-xs font-medium text-gray-700">
                  Content *
                </label>
                <button
                  type="button"
                  onClick={() => fileInputRef.current?.click()}
                  className="text-xs font-medium text-blue-600 hover:text-blue-800 focus:outline-none"
                  title="Upload a .txt file (processed locally, file is not stored)"
                >
                  Upload .txt
                </button>
                <input
                  ref={fileInputRef}
                  type="file"
                  accept=".txt,text/plain"
                  onChange={handleFileUpload}
                  className="hidden"
                />
              </div>
              <textarea
                value={newDocForm.content}
                onChange={(e) => setNewDocForm((prev) => ({ ...prev, content: e.target.value }))}
                className="w-full px-3 py-2 border border-gray-300 rounded-md text-sm focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-transparent resize-none"
                placeholder="Paste or type the text to analyze, or upload a .txt file..."
                rows={4}
              />
              {(() => {
                const used = byteSize(newDocForm.content);
                const over = used > MAX_CONTENT_BYTES;
                return (
                  <div className={`text-xs mt-1 ${over ? 'text-red-600' : 'text-gray-500'}`}>
                    {formatKB(used)} / {formatKB(MAX_CONTENT_BYTES)}
                  </div>
                );
              })()}
            </div>
            <div className="flex space-x-2">
              <button
                type="submit"
                className="px-3 py-1.5 bg-blue-600 text-white text-xs font-medium rounded-md hover:bg-blue-700 focus:outline-none focus:ring-2 focus:ring-blue-500"
              >
                Add Document
              </button>
              <button
                type="button"
                onClick={() => setShowAddForm(false)}
                className="px-3 py-1.5 bg-gray-300 text-gray-700 text-xs font-medium rounded-md hover:bg-gray-400 focus:outline-none focus:ring-2 focus:ring-gray-500"
              >
                Cancel
              </button>
            </div>
          </form>
        </div>
      )}

      {/* Document List */}
      <div className="flex-1 overflow-y-auto">
        {documents.length === 0 ? (
          <div className="p-6 text-center text-gray-500 text-sm">
            <p className="mb-2">No documents in this project yet.</p>
            <p className="text-xs">
              {currentUser
                ? 'Use the Add button above to paste in a transcript or other text to analyze.'
                : 'Sign in to add documents.'}
            </p>
          </div>
        ) : (
          <div className="p-2">
            {documents.map((document) => {
              const isActive = document.id === activeDocument?.id;
              const canDelete = isOwner && onDeleteDocument;
              const isDeleting = pendingDeleteId === document.id;

              return (
                <div
                  key={document.id}
                  className={`relative group mb-2 rounded-lg border-l-4 border-y border-r transition-colors duration-150 ${
                    isActive
                      ? 'bg-blue-100 border-l-blue-500 border-y-blue-100 border-r-blue-100'
                      : 'bg-white border-l-transparent border-y-gray-200 border-r-gray-200 hover:bg-gray-50'
                  }`}
                >
                  <button
                    onClick={() => onDocumentSwitch(document.id)}
                    className="w-full text-left p-3 focus:outline-none focus:ring-2 focus:ring-blue-500 focus:ring-offset-1 rounded-lg"
                  >
                    <div className="space-y-2">
                      {/* Document Title */}
                      <div className="flex items-start justify-between gap-2">
                        <h3 className={`text-sm font-medium line-clamp-2 ${
                          isActive ? 'text-blue-900' : 'text-gray-900'
                        }`}>
                          {document.title}
                        </h3>
                        <div className="flex items-center gap-1 flex-shrink-0">
                          {document.isDefault && (
                            <span className="inline-flex items-center px-2 py-0.5 rounded text-xs font-medium bg-blue-100 text-blue-800">
                              Default
                            </span>
                          )}
                          {canDelete && <span className="w-6" aria-hidden="true" />}
                        </div>
                      </div>

                      {/* Document Description */}
                      {document.description && (
                        <div className={`text-xs line-clamp-2 ${
                          isActive ? 'text-blue-700' : 'text-gray-600'
                        }`}>
                          {document.description}
                        </div>
                      )}

                      {/* Document Preview */}
                      <div className={`text-xs line-clamp-3 ${
                        isActive ? 'text-blue-600' : 'text-gray-500'
                      }`}>
                        {truncateContent(document.content, 150)}
                      </div>

                      {/* Document Stats */}
                      <div className="flex items-center justify-between pt-1">
                        <div className={`text-xs ${
                          isActive ? 'text-blue-600' : 'text-gray-500'
                        }`}>
                          {getWordCount(document.content)} words
                        </div>
                        {document.createdAt && (
                          <div className={`text-xs ${
                            isActive ? 'text-blue-600' : 'text-gray-500'
                          }`}>
                            {new Date(document.createdAt.seconds ? document.createdAt.seconds * 1000 : document.createdAt).toLocaleDateString()}
                          </div>
                        )}
                      </div>
                    </div>
                  </button>

                  {canDelete && (
                    <button
                      type="button"
                      onClick={(e) => {
                        e.stopPropagation();
                        handleDeleteDocument(document.id, document.title);
                      }}
                      disabled={isDeleting}
                      title="Delete document (admin)"
                      className="absolute top-2 right-2 p-1 rounded text-slate-400 hover:text-red-600 hover:bg-red-50 opacity-0 group-hover:opacity-100 focus:opacity-100 transition-opacity disabled:opacity-50"
                      aria-label={`Delete ${document.title}`}
                    >
                      <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                        <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M19 7l-.867 12.142A2 2 0 0116.138 21H7.862a2 2 0 01-1.995-1.858L5 7m5 4v6m4-6v6M1 7h22M9 7V4a1 1 0 011-1h4a1 1 0 011 1v3" />
                      </svg>
                    </button>
                  )}
                </div>
              );
            })}
          </div>
        )}
      </div>

      {/* Footer with document count */}
      <div className="flex-shrink-0 p-3 border-t border-gray-200 bg-white">
        <div className="text-xs text-gray-500 text-center">
          {documents.length} document{documents.length !== 1 ? 's' : ''}
          {!isOwner && documents.length > 0 && (
            <span className="ml-1 text-slate-400">· delete restricted to admins</span>
          )}
        </div>
      </div>
    </div>
  );
};

export default DocumentBrowser;
