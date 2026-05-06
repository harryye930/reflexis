import React, { useState } from 'react';

const MAX_CONTENT_BYTES = 900 * 1024;
const byteSize = (str) => new Blob([str ?? '']).size;
const formatKB = (bytes) => `${(bytes / 1024).toFixed(1)} KB`;

const DocumentSelector = ({
  documents, 
  activeDocument, 
  onDocumentSwitch, 
  onAddDocument, 
  onMessage,
  currentUser 
}) => {
  const [isExpanded, setIsExpanded] = useState(false);
  const [showAddForm, setShowAddForm] = useState(false);
  const [newDocForm, setNewDocForm] = useState({ title: '', description: '', content: '' });

  const handleDocumentSwitch = (documentId) => {
    onDocumentSwitch(documentId);
    setIsExpanded(false);
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
      onMessage('Document added successfully!');
      setNewDocForm({ title: '', description: '', content: '' });
      setShowAddForm(false);
      // Switch to the newly created document
      onDocumentSwitch(result.id);
    } else {
      onMessage('Failed to add document', true);
    }
  };

  return (
    <div className="mb-6">
      <div className="flex items-center justify-between mb-3">
        <h3 className="text-sm font-medium text-gray-700">Active Document</h3>
        {currentUser && (
          <button
            onClick={() => setShowAddForm(!showAddForm)}
            className="text-xs text-blue-600 hover:text-blue-800 font-medium"
            title="Add new document"
          >
            {showAddForm ? 'Cancel' : '+ Add'}
          </button>
        )}
      </div>

      {/* Add Document Form */}
      {showAddForm && (
        <div className="mb-4 p-4 bg-gray-50 rounded-lg border">
          <form onSubmit={handleAddDocument} className="space-y-3">
            <div>
              <label className="block text-xs font-medium text-gray-700 mb-1">
                Title *
              </label>
              <input
                type="text"
                value={newDocForm.title}
                onChange={(e) => setNewDocForm(prev => ({ ...prev, title: e.target.value }))}
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
                onChange={(e) => setNewDocForm(prev => ({ ...prev, description: e.target.value }))}
                className="w-full px-3 py-2 border border-gray-300 rounded-md text-sm focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-transparent"
                placeholder="Brief description"
                maxLength={200}
              />
            </div>
            <div>
              <label className="block text-xs font-medium text-gray-700 mb-1">
                Content *
              </label>
              <textarea
                value={newDocForm.content}
                onChange={(e) => setNewDocForm(prev => ({ ...prev, content: e.target.value }))}
                className="w-full px-3 py-2 border border-gray-300 rounded-md text-sm focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-transparent resize-none"
                placeholder="Paste or type the text to analyze..."
                rows={6}
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

      {/* Document Selector */}
      <div className="relative">
        <button
          onClick={() => setIsExpanded(!isExpanded)}
          className="w-full text-left p-3 bg-white border border-gray-200 rounded-lg hover:bg-gray-50 focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-transparent transition-colors"
        >
          <div className="flex items-center justify-between">
            <div className="flex-1 min-w-0">
              <div className="text-sm font-medium text-gray-900 truncate">
                {activeDocument.title}
              </div>
              {activeDocument.description && (
                <div className="text-xs text-gray-500 truncate mt-1">
                  {activeDocument.description}
                </div>
              )}
            </div>
            <div className="flex items-center ml-2">
              {activeDocument.isDefault && (
                <span className="inline-flex items-center px-2 py-0.5 rounded text-xs font-medium bg-blue-100 text-blue-800 mr-2">
                  Default
                </span>
              )}
              <svg
                className={`h-4 w-4 text-gray-400 transition-transform ${isExpanded ? 'rotate-180' : ''}`}
                fill="none"
                stroke="currentColor"
                viewBox="0 0 24 24"
              >
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M19 9l-7 7-7-7" />
              </svg>
            </div>
          </div>
        </button>

        {isExpanded && (
          <div className="absolute top-full left-0 right-0 mt-1 bg-white border border-gray-200 rounded-lg shadow-lg z-50 max-h-64 overflow-y-auto">
            {documents.map((document) => (
              <button
                key={document.id}
                onClick={() => handleDocumentSwitch(document.id)}
                className={`w-full text-left p-3 hover:bg-gray-50 focus:outline-none focus:bg-gray-50 transition-colors ${
                  document.id === activeDocument.id ? 'bg-blue-50 border-r-2 border-blue-500' : ''
                }`}
              >
                <div className="flex items-center justify-between">
                  <div className="flex-1 min-w-0">
                    <div className={`text-sm font-medium truncate ${
                      document.id === activeDocument.id ? 'text-blue-900' : 'text-gray-900'
                    }`}>
                      {document.title}
                    </div>
                    {document.description && (
                      <div className={`text-xs truncate mt-1 ${
                        document.id === activeDocument.id ? 'text-blue-700' : 'text-gray-500'
                      }`}>
                        {document.description}
                      </div>
                    )}
                  </div>
                  {document.isDefault && (
                    <span className="inline-flex items-center px-2 py-0.5 rounded text-xs font-medium bg-blue-100 text-blue-800 ml-2">
                      Default
                    </span>
                  )}
                </div>
              </button>
            ))}
          </div>
        )}
      </div>
    </div>
  );
};

export default DocumentSelector;
