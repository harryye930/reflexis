import React from 'react';
import ReflexiveResponseCard from '../common/ReflexiveResponseCard.js';

/**
 * Component to display reflexive notes for a highlight
 * Shows when there are reflexive responses for this highlight
 */
const HighlightReflexiveNotes = ({ reflexiveResponses }) => {
  if (!reflexiveResponses || reflexiveResponses.length === 0) {
    return null;
  }

  // Group responses by prompt type for better display
  const responsesByType = {};
  reflexiveResponses.forEach(response => {
    responsesByType[response.promptType] = response;
  });

  return (
    <div className="mt-3 border-t border-gray-100 pt-3">
      <div className="flex items-center gap-2 mb-2">
        <svg className="w-4 h-4 text-indigo-600" fill="none" stroke="currentColor" viewBox="0 0 24 24">
          <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M8.228 9c.549-1.165 2.03-2 3.772-2 2.21 0 4 1.343 4 3 0 1.4-1.278 2.575-3.006 2.907-.542.104-.994.54-.994 1.093m0 3h.01M21 12a9 9 0 11-18 0 9 9 0 0118 0z" />
        </svg>
        <span className="text-xs font-medium text-gray-700">
          Reflexive Notes
        </span>
      </div>
      
      <div className="space-y-2">
        {Object.entries(responsesByType).map(([promptType, response]) => (
          <ReflexiveResponseCard
            key={promptType}
            response={response}
            promptType={promptType}
            showTimestamp={false}
            showCheckmark={false}
          />
        ))}
      </div>
    </div>
  );
};

export default HighlightReflexiveNotes;
