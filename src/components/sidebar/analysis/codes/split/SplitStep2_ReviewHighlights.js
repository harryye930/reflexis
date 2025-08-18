import React from 'react';
import { ContentCut, Add, FastForward } from '@mui/icons-material';
import CodeChip from '../../../../common/CodeChip.js';
import CodeForm from '../CodeForm.js';

const SplitStep2_ReviewHighlights = ({ 
  selectedCode,
  highlights,
  currentHighlightIndex,
  reassignments,
  availableCodes,
  highlightReflexiveCounts,
  onHighlightReassignment,
  onSkipHighlight,
  onCreateNewCode,
  showCodeForm,
  onCreateCodeSubmit,
  onCreateCodeCancel,
  onMessage,
  onNextHighlight,
  onPreviousHighlight,
  currentUser,
  userProfiles,
  pendingCodeCreations
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
          <h4 className="text-sm font-medium text-orange-900 mb-2 flex items-center gap-2">
            <ContentCut sx={{ fontSize: 16 }} />
            <span>Split Summary</span>
          </h4>
          <p className="text-sm text-orange-800">
            Code &ldquo;{selectedCode?.label}&rdquo; will be deleted as it has no associated highlights.
          </p>
        </div>
      </div>
    );
  }

  const currentHighlight = highlights[currentHighlightIndex];
  const assignment = reassignments[currentHighlight.id];
  const isSkipped = !assignment;
  const isCreatingNewCode = showCodeForm;
  
  // Determine the selected option type
  const getSelectedOption = () => {
    if (assignment?.newCodeId) {
      return assignment.newCodeId;
    }
    if (isCreatingNewCode) {
      return 'create_new';
    }
    return 'skip'; // Default to skip if nothing is selected
  };

  const selectedOption = getSelectedOption();

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
        <h4 className="text-sm font-medium text-gray-700 mb-2">Highlighted Text with Context</h4>
        <div className="bg-white rounded p-3 border">
          <p className="text-sm leading-relaxed">
            <span className="text-gray-500">
              {currentHighlight.contextBefore}
            </span>
            <span className="text-gray-800 font-medium bg-yellow-100 px-1 rounded italic">
              {currentHighlight.text}
            </span>
            <span className="text-gray-500">
              {currentHighlight.contextAfter}
            </span>
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
        
        {/* Available codes (original style) */}
        <div className="grid grid-cols-1 gap-2 max-h-48 overflow-y-auto">
          {availableCodes.map((code) => (
            <div
              key={code.id}
              onClick={() => {
                onHighlightReassignment(currentHighlight.id, code.id);
                // Cancel code form if it was open
                if (showCodeForm) {
                  onCreateCodeCancel();
                }
              }}
              className={`p-3 border rounded-lg cursor-pointer transition-all ${
                selectedOption === code.id
                  ? 'border-blue-500 bg-blue-50'
                  : 'border-gray-200 hover:border-gray-300'
              } ${code.isPending ? 'border-dashed border-green-300 bg-green-50' : ''}`}
            >
              <div className="flex items-center gap-3">
                <div 
                  className={`w-4 h-4 rounded-full border-2 ${
                    selectedOption === code.id
                      ? 'border-blue-500 bg-blue-500'
                      : 'border-gray-300'
                  }`}
                >
                  {selectedOption === code.id && (
                    <div className="w-2 h-2 bg-white rounded-full m-0.5"></div>
                  )}
                </div>
                <CodeChip 
                  code={code}
                  size="sm"
                  variant="unified"
                />
                {code.isPending && (
                  <span className="text-xs text-green-600 font-medium bg-green-100 px-2 py-1 rounded">
                    Will be created
                  </span>
                )}
              </div>
            </div>
          ))}
        </div>

        {/* Skip option */}
        <div
          onClick={() => {
            onSkipHighlight(currentHighlight.id);
            // Cancel code form if it was open
            if (showCodeForm) {
              onCreateCodeCancel();
            }
          }}
          className={`p-3 border rounded-lg cursor-pointer transition-all ${
            selectedOption === 'skip'
              ? 'border-gray-500 bg-gray-50'
              : 'border-gray-200 hover:border-gray-300'
          }`}
        >
          <div className="flex items-center gap-3">
            <div 
              className={`w-4 h-4 rounded-full border-2 ${
                selectedOption === 'skip'
                  ? 'border-gray-500 bg-gray-500'
                  : 'border-gray-300'
              }`}
            >
              {selectedOption === 'skip' && (
                <div className="w-2 h-2 bg-white rounded-full m-0.5"></div>
              )}
            </div>
            <div className="flex items-center gap-2">
              <FastForward sx={{ fontSize: 16, color: selectedOption === 'skip' ? '#6b7280' : '#9ca3af' }} />
              <span className={`text-sm font-medium ${selectedOption === 'skip' ? 'text-gray-700' : 'text-gray-600'}`}>
                Keep with original code {<CodeChip code={selectedCode} size="sm" variant="unified" />}
              </span>
            </div>
          </div>
        </div>

        {/* Create new code option */}
        <div
          onClick={() => {
            // If already creating, don't do anything
            if (!showCodeForm) {
              // Clear any existing assignment first
              onSkipHighlight(currentHighlight.id);
              // Then open the form
              onCreateNewCode();
            }
          }}
          className={`p-3 border border-dashed rounded-lg cursor-pointer transition-all ${
            selectedOption === 'create_new'
              ? 'border-green-500 bg-green-50'
              : 'border-green-300 hover:border-green-400 hover:bg-green-50'
          }`}
        >
          <div className="flex items-center gap-3">
            <div 
              className={`w-4 h-4 rounded-full border-2 ${
                selectedOption === 'create_new'
                  ? 'border-green-500 bg-green-500'
                  : 'border-green-400'
              }`}
            >
              {selectedOption === 'create_new' && (
                <div className="w-2 h-2 bg-white rounded-full m-0.5"></div>
              )}
            </div>
            <div className="flex items-center gap-2">
              <Add sx={{ fontSize: 16, color: selectedOption === 'create_new' ? '#10b981' : '#10b981' }} />
              <span className={`text-sm font-medium ${selectedOption === 'create_new' ? 'text-green-800' : 'text-green-700'}`}>
                Create new code for this highlight
              </span>
            </div>
          </div>
        </div>

        {/* CodeForm appears directly below when creating new code */}
        {selectedOption === 'create_new' && (
          <div className="mt-4 p-4 border border-green-200 rounded-lg bg-green-50">
            <CodeForm
              onSubmit={onCreateCodeSubmit}
              onCancel={onCreateCodeCancel}
              onMessage={onMessage}
            />
          </div>
        )}
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
          {highlights.length - Object.keys(reassignments).length > 0 && (
            <span className="text-gray-400 ml-1">
              ({highlights.length - Object.keys(reassignments).length} will remain with original)
            </span>
          )}
        </div>
        <div className="flex gap-2">
          <button
            onClick={onPreviousHighlight}
            disabled={currentHighlightIndex === 0}
            className="px-3 py-1 text-sm text-gray-600 hover:text-gray-800 disabled:opacity-50 disabled:cursor-not-allowed"
          >
            Previous
          </button>
          {/* Show Next/Review button always, no need to require all highlights to be assigned */}
          <button
            onClick={onNextHighlight}
            className="px-4 py-1 text-sm bg-orange-600 text-white rounded hover:bg-orange-700"
          >
            {currentHighlightIndex === highlights.length - 1 ? 'Review' : 'Next'}
          </button>
        </div>
      </div>
    </div>
  );
};

export default SplitStep2_ReviewHighlights;
