import React from 'react';
import CodeChip from '../../../../common/CodeChip.js';

const SplitStep2_ReviewHighlights = ({ 
  selectedCode,
  highlights,
  currentHighlightIndex,
  reassignments,
  availableCodes,
  highlightReflexiveCounts,
  onHighlightReassignment,
  onNextHighlight,
  onPreviousHighlight,
  currentUser,
  userProfiles
}) => {
  const getUserName = (userId) => {
    if (userId === 'system') return 'System';
    if (userId && userProfiles[userId]) {
      const authorName = userProfiles[userId].name;
      const isCurrentUser = currentUser && userId === currentUser.uid;
      return isCurrentUser ? `${authorName} (you)` : authorName;
    }
    return 'Unknown';
  };

  if (highlights.length === 0) {
    return (
      <div>
        <h3 className="text-lg font-medium text-gray-900 mb-4">No Highlights Found</h3>
        <p className="text-sm text-gray-600 mb-4">
          The selected code &ldquo;{selectedCode?.label}&rdquo; has no highlights to reassign. 
          The code can be deleted without affecting any content.
        </p>
        <div className="bg-orange-50 rounded-lg p-4">
          <h4 className="text-sm font-medium text-orange-900 mb-2">✂️ Split Summary</h4>
          <p className="text-sm text-orange-800">
            Code &ldquo;{selectedCode?.label}&rdquo; will be deleted as it has no associated highlights.
          </p>
        </div>
      </div>
    );
  }

  const currentHighlight = highlights[currentHighlightIndex];
  const assignment = reassignments[currentHighlight.id];

  return (
    <div>
      <h3 className="text-lg font-medium text-gray-900 mb-4">
        Reassign Highlights ({currentHighlightIndex + 1} of {highlights.length})
      </h3>
      <p className="text-sm text-gray-600 mb-4">
        For each highlight coded as &ldquo;{selectedCode?.label}&rdquo;, choose a new code or action.
      </p>

      {/* Current highlight context */}
      <div className="bg-gray-50 rounded-lg p-4 mb-6">
        <h4 className="text-sm font-medium text-gray-700 mb-2">Highlighted Text</h4>
        <div className="bg-white rounded p-3 border">
          <p className="text-sm text-gray-800 leading-relaxed">
            &ldquo;{currentHighlight.text}&rdquo;
          </p>
        </div>
        <div className="mt-2 text-xs text-gray-500">
          <span>Author: {getUserName(currentHighlight.userId)}</span>
          <span className="mx-2">•</span>
          <span>Document: {currentHighlight.documentTitle || currentHighlight.documentId}</span>
        </div>
      </div>

      {/* Code selection */}
      <div className="space-y-3 mb-6">
        <h4 className="text-sm font-medium text-gray-700">Reassign to:</h4>
        
        {/* Available codes */}
        <div className="grid grid-cols-1 gap-2 max-h-48 overflow-y-auto">
          {availableCodes.map((code) => (
            <div
              key={code.id}
              onClick={() => onHighlightReassignment(currentHighlight.id, code.id)}
              className={`p-3 border rounded-lg cursor-pointer transition-all ${
                assignment?.newCodeId === code.id
                  ? 'border-blue-500 bg-blue-50'
                  : 'border-gray-200 hover:border-gray-300'
              }`}
            >
              <div className="flex items-center gap-3">
                <div 
                  className={`w-4 h-4 rounded-full border-2 ${
                    assignment?.newCodeId === code.id
                      ? 'border-blue-500 bg-blue-500'
                      : 'border-gray-300'
                  }`}
                >
                  {assignment?.newCodeId === code.id && (
                    <div className="w-2 h-2 bg-white rounded-full m-0.5"></div>
                  )}
                </div>
                <CodeChip 
                  code={code}
                  size="sm"
                  variant="unified"
                />
              </div>
            </div>
          ))}
        </div>
      </div>

      {/* Option to transfer reflexive responses if this highlight has any */}
      {assignment?.newCodeId && highlightReflexiveCounts[currentHighlight.id] > 0 && (
        <div className="mt-4 p-3 bg-indigo-50 rounded-lg">
          <label className="flex items-center gap-2">
            <input
              type="checkbox"
              checked={assignment.transferReflexive || false}
              onChange={(e) => onHighlightReassignment(
                currentHighlight.id, 
                assignment.newCodeId, 
                e.target.checked
              )}
              className="rounded"
            />
            <span className="text-sm text-indigo-800">
              Transfer {highlightReflexiveCounts[currentHighlight.id]} reflexive response{highlightReflexiveCounts[currentHighlight.id] !== 1 ? 's' : ''} to the new code
            </span>
          </label>
          <p className="text-xs text-indigo-600 mt-1">
            The reflexive Q&A responses for this highlight will be moved to &ldquo;{availableCodes.find(c => c.id === assignment.newCodeId)?.label}&rdquo;
          </p>
        </div>
      )}

      {/* Navigation */}
      <div className="flex justify-between items-center">
        <div className="text-sm text-gray-500">
          {Object.keys(reassignments).length} of {highlights.length} highlights assigned
        </div>
        <div className="flex gap-2">
          <button
            onClick={onPreviousHighlight}
            disabled={currentHighlightIndex === 0}
            className="px-3 py-1 text-sm text-gray-600 hover:text-gray-800 disabled:opacity-50 disabled:cursor-not-allowed"
          >
            Previous
          </button>
          <button
            onClick={onNextHighlight}
            disabled={!assignment?.newCodeId}
            className="px-4 py-1 text-sm bg-orange-600 text-white rounded hover:bg-orange-700 disabled:opacity-50 disabled:cursor-not-allowed"
          >
            {currentHighlightIndex === highlights.length - 1 ? 'Review' : 'Next'}
          </button>
        </div>
      </div>
    </div>
  );
};

export default SplitStep2_ReviewHighlights;
