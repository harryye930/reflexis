import React from 'react';

const CodeExemplars = ({ code, onNavigateToHighlight }) => {
  // [PLACEHOLDER] Exemplar data - requires pinning infrastructure from highlights
  const mockExemplars = [
    {
      id: 'ex1',
      text: 'Many families in rural areas couldn\'t afford WiFi connections, forcing students to complete assignments on their phones.',
      author: 'Sarah Johnson',
      date: '2024-10-26',
      documentTitle: 'Rural Education Study',
      documentId: 'doc1',
      highlightId: 'highlight1',
      votes: 5,
      isPinned: true
    },
    {
      id: 'ex2', 
      text: 'The digital divide became starkly apparent during remote learning, with some students unable to participate in video calls.',
      author: 'Michael Chen',
      date: '2024-10-25',
      documentTitle: 'COVID-19 Education Impact',
      documentId: 'doc2',
      highlightId: 'highlight2',
      votes: 3,
      isPinned: false
    }
  ];

  return (
    <div className="p-6">
      <div className="mb-6">
        <h3 className="text-lg font-medium text-gray-900 mb-2">Exemplars [PLACEHOLDER]</h3>
        <p className="text-sm text-gray-600">
          Curated examples of the best applications of this code. These highlight particularly clear or insightful uses.
        </p>
      </div>

      {mockExemplars.length === 0 ? (
        <div className="text-center py-8">
          <div className="text-gray-400 mb-2">
            <svg className="w-12 h-12 mx-auto" fill="none" stroke="currentColor" viewBox="0 0 24 24">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={1} d="M5 3a2 2 0 00-2 2v2a2 2 0 002 2h2a2 2 0 002-2V5a2 2 0 00-2-2H5zM5 11a2 2 0 00-2 2v2a2 2 0 002 2h2a2 2 0 002-2v-2a2 2 0 00-2-2H5zM11 5a2 2 0 012-2h2a2 2 0 012 2v2a2 2 0 01-2 2h-2a2 2 0 01-2-2V5zM11 13a2 2 0 012-2h2a2 2 0 012 2v2a2 2 0 01-2 2h-2a2 2 0 01-2-2v-2z" />
            </svg>
          </div>
          <p className="text-gray-500 text-sm">No exemplars yet [PLACEHOLDER]</p>
          <p className="text-gray-400 text-xs mt-1">
            Pin highlights to create exemplars for this code (requires pinning infrastructure)
          </p>
        </div>
      ) : (
        <div className="space-y-4">
          {mockExemplars.map((exemplar) => (
            <div key={exemplar.id} className="bg-white border border-gray-200 rounded-lg p-4 shadow-sm">
              {/* Exemplar badge */}
              {exemplar.isPinned && (
                <div className="flex items-center mb-3">
                  <span className="inline-flex items-center px-2.5 py-0.5 rounded-full text-xs font-medium bg-yellow-100 text-yellow-800">
                    📌 Pinned Exemplar
                  </span>
                </div>
              )}

              {/* Quote */}
              <blockquote className="text-sm text-gray-800 leading-relaxed border-l-4 border-indigo-200 pl-4 mb-4">
                &ldquo;{exemplar.text}&rdquo;
              </blockquote>

              {/* Metadata */}
              <div className="flex items-center justify-between text-xs text-gray-500 mb-3">
                <div className="flex items-center space-x-3">
                  <span className="font-medium text-gray-700">{exemplar.author}</span>
                  <span>{exemplar.date}</span>
                  <span>{exemplar.documentTitle}</span>
                </div>
                <div className="flex items-center space-x-2">
                  <span className="flex items-center">
                    ⭐ {exemplar.votes}
                  </span>
                </div>
              </div>

              {/* Actions */}
              <div className="flex items-center justify-between">
                <button 
                  className="text-xs text-blue-600 hover:text-blue-800 font-medium"
                  onClick={() => {
                    if (onNavigateToHighlight && exemplar.highlightId && exemplar.documentId) {
                      onNavigateToHighlight(exemplar.documentId, exemplar.highlightId);
                    }
                  }}
                >
                  View in Context
                </button>
                <div className="flex items-center space-x-2">
                  <button className="text-xs text-gray-600 hover:text-gray-800">
                    ⭐ Upvote
                  </button>
                  <button className="text-xs text-gray-600 hover:text-gray-800">
                    📌 {exemplar.isPinned ? 'Unpin' : 'Pin'}
                  </button>
                </div>
              </div>
            </div>
          ))}
        </div>
      )}

      {/* Instructions */}
      <div className="mt-6 p-4 bg-blue-50 rounded-lg">
        <h4 className="text-sm font-medium text-blue-800 mb-2">Creating Exemplars</h4>
        <p className="text-sm text-blue-700">
          To add an exemplar, find a particularly good application of this code in the document and click the pin icon 📌 in the highlight tooltip.
        </p>
      </div>
    </div>
  );
};

export default CodeExemplars;
