import React, { useState } from 'react';

const DocumentBrowser = ({ 
  documents, 
  activeDocument, 
  onDocumentSwitch, 
  onAddDocument, 
  onMessage,
  currentUser 
}) => {
  const [showAddForm, setShowAddForm] = useState(false);
  const [newDocForm, setNewDocForm] = useState({ title: '', description: '', content: '' });

  const handleAddDocument = async (e) => {
    e.preventDefault();
    
    if (!newDocForm.title.trim() || !newDocForm.content.trim()) {
      onMessage('Please fill in title and content fields', true);
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

  const truncateContent = (content, maxLength = 100) => {
    if (content.length <= maxLength) return content;
    return content.substring(0, maxLength) + '...';
  };

  const getWordCount = (content) => {
    return content.trim().split(/\s+/).filter(word => word.length > 0).length;
  };

  return (
    <div className="h-full flex flex-col bg-gray-50 border-r border-gray-200">
      {/* Header */}
      <div className="flex-shrink-0 p-4 border-b border-gray-200 bg-white">
        <div className="flex items-center justify-between">
          <h2 className="text-lg font-semibold text-gray-900">Documents</h2>
          {currentUser && (
            <button
              onClick={() => setShowAddForm(!showAddForm)}
              className="inline-flex items-center px-3 py-1.5 border border-transparent text-xs font-medium rounded-md text-white bg-blue-600 hover:bg-blue-700 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-blue-500"
              title="Add new document"
            >
              <svg className="w-3 h-3 mr-1" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 4v16m8-8H4" />
              </svg>
              New
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
                rows={4}
                maxLength={10000}
              />
              <div className="text-xs text-gray-500 mt-1">
                {newDocForm.content.length}/10,000 characters
              </div>
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
          <div className="p-4 text-center text-gray-500 text-sm">
            No documents available
          </div>
        ) : (
          <div className="p-2">
            {documents.map((document) => (
              <button
                key={document.id}
                onClick={() => onDocumentSwitch(document.id)}
                className={`w-full text-left p-3 mb-2 rounded-lg transition-all duration-200 hover:shadow-sm focus:outline-none focus:ring-2 focus:ring-blue-500 focus:ring-offset-1 ${
                  document.id === activeDocument?.id 
                    ? 'bg-blue-100 border-l-4 border-blue-500 shadow-sm' 
                    : 'bg-white hover:bg-gray-50 border border-gray-200'
                }`}
              >
                <div className="space-y-2">
                  {/* Document Title */}
                  <div className="flex items-start justify-between">
                    <h3 className={`text-sm font-medium line-clamp-2 ${
                      document.id === activeDocument?.id ? 'text-blue-900' : 'text-gray-900'
                    }`}>
                      {document.title}
                    </h3>
                    {document.isDefault && (
                      <span className="ml-2 inline-flex items-center px-2 py-0.5 rounded text-xs font-medium bg-blue-100 text-blue-800 flex-shrink-0">
                        Default
                      </span>
                    )}
                  </div>

                  {/* Document Description */}
                  {document.description && (
                    <div className={`text-xs line-clamp-2 ${
                      document.id === activeDocument?.id ? 'text-blue-700' : 'text-gray-600'
                    }`}>
                      {document.description}
                    </div>
                  )}

                  {/* Document Preview */}
                  <div className={`text-xs line-clamp-3 ${
                    document.id === activeDocument?.id ? 'text-blue-600' : 'text-gray-500'
                  }`}>
                    {truncateContent(document.content, 150)}
                  </div>

                  {/* Document Stats */}
                  <div className="flex items-center justify-between pt-1">
                    <div className={`text-xs ${
                      document.id === activeDocument?.id ? 'text-blue-600' : 'text-gray-500'
                    }`}>
                      {getWordCount(document.content)} words
                    </div>
                    {document.createdAt && (
                      <div className={`text-xs ${
                        document.id === activeDocument?.id ? 'text-blue-600' : 'text-gray-500'
                      }`}>
                        {new Date(document.createdAt.seconds ? document.createdAt.seconds * 1000 : document.createdAt).toLocaleDateString()}
                      </div>
                    )}
                  </div>
                </div>
              </button>
            ))}
          </div>
        )}
      </div>

      {/* Footer with document count */}
      <div className="flex-shrink-0 p-3 border-t border-gray-200 bg-white">
        <div className="text-xs text-gray-500 text-center">
          {documents.length} document{documents.length !== 1 ? 's' : ''} available
        </div>
      </div>
    </div>
  );
};

export default DocumentBrowser;
