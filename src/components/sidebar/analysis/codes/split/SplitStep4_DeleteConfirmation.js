import React from 'react';

const SplitStep4_DeleteConfirmation = ({ 
  selectedCode,
  highlights,
  reassignments,
  deleteSourceCode,
  onDeleteChoice
}) => {
  const allHighlightsReassigned = highlights.length > 0 && Object.keys(reassignments).length === highlights.length;

  return (
    <div>
      <h3 className="text-lg font-medium text-gray-900 mb-4">Delete Original Code?</h3>
      <p className="text-sm text-gray-600 mb-6">
        {allHighlightsReassigned 
          ? `All highlights from "${selectedCode?.label}" have been reassigned. Would you like to delete the original code?`
          : `Some highlights will remain with "${selectedCode?.label}". You can choose to keep or delete the original code.`
        }
      </p>

      <div className="space-y-3 mb-6">
        <div
          onClick={() => onDeleteChoice(false)}
          className={`p-4 border rounded-lg cursor-pointer transition-all ${
            !deleteSourceCode
              ? 'border-green-500 bg-green-50'
              : 'border-gray-200 hover:border-gray-300'
          }`}
        >
          <div className="flex items-start gap-3">
            <div 
              className={`w-4 h-4 rounded-full border-2 mt-1 ${
                !deleteSourceCode
                  ? 'border-green-500 bg-green-500'
                  : 'border-gray-300'
              }`}
            >
              {!deleteSourceCode && (
                <div className="w-2 h-2 bg-white rounded-full m-0.5"></div>
              )}
            </div>
            <div>
              <h4 className="font-medium text-gray-900 mb-1">Keep Original Code</h4>
              <p className="text-sm text-gray-600">
                The code &ldquo;{selectedCode?.label}&rdquo; will remain in your codebook.
                {!allHighlightsReassigned && ' Remaining highlights will stay with this code.'}
              </p>
            </div>
          </div>
        </div>

        <div
          onClick={() => onDeleteChoice(true)}
          className={`p-4 border rounded-lg cursor-pointer transition-all ${
            deleteSourceCode
              ? 'border-red-500 bg-red-50'
              : 'border-gray-200 hover:border-gray-300'
          }`}
        >
          <div className="flex items-start gap-3">
            <div 
              className={`w-4 h-4 rounded-full border-2 mt-1 ${
                deleteSourceCode
                  ? 'border-red-500 bg-red-500'
                  : 'border-gray-300'
              }`}
            >
              {deleteSourceCode && (
                <div className="w-2 h-2 bg-white rounded-full m-0.5"></div>
              )}
            </div>
            <div>
              <h4 className="font-medium text-gray-900 mb-1">Delete Original Code</h4>
              <p className="text-sm text-gray-600">
                The code &ldquo;{selectedCode?.label}&rdquo; will be permanently deleted from your codebook.
                {!allHighlightsReassigned && ' ⚠️ Warning: This will also delete any remaining highlights that weren\'t reassigned.'}
              </p>
            </div>
          </div>
        </div>
      </div>

      <div className={`rounded-lg p-4 ${deleteSourceCode ? 'bg-red-50' : 'bg-blue-50'}`}>
        <h4 className={`text-sm font-medium mb-2 ${deleteSourceCode ? 'text-red-900' : 'text-blue-900'}`}>
          Final Summary
        </h4>
        <p className={`text-sm ${deleteSourceCode ? 'text-red-800' : 'text-blue-800'}`}>
          {Object.keys(reassignments).length} highlight{Object.keys(reassignments).length !== 1 ? 's' : ''} will be reassigned to new codes.
          {deleteSourceCode 
            ? ` The original code "${selectedCode?.label}" will be deleted.`
            : ` The original code "${selectedCode?.label}" will be kept.`
          }
        </p>
      </div>
    </div>
  );
};

export default SplitStep4_DeleteConfirmation;
