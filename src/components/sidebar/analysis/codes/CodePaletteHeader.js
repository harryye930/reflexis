import React from 'react';

const CodePaletteHeader = ({ 
  showDescriptions, 
  onToggleDescriptions, 
  showAddForm, 
  onToggleAddForm,
  onToggleMergeModal, // New prop for merge functionality
  onToggleSplitModal, // New prop for split functionality
  currentUser,
  title = "Available Codes"
}) => {
  return (
    <>
      <div className="flex items-center justify-between mb-4">
        <h3 className="font-semibold text-gray-700">{title}</h3>
        <div className="flex gap-2">
          <button
            onClick={onToggleDescriptions}
            className="text-xs px-3 py-1 bg-gray-100 hover:bg-gray-200 text-gray-600 rounded-full transition-colors"
            title={showDescriptions ? 'Hide metadata (author info, disagreement metrics)' : 'Show metadata (author info, disagreement metrics)'}
          >
            {showDescriptions ? 'Hide Metadata' : 'Show Metadata'}
          </button>
          {currentUser && (
            <div className="flex gap-2">
              <button
                onClick={onToggleSplitModal}
                className="text-xs px-3 py-1 bg-orange-500 text-white rounded-full hover:bg-orange-600 transition-colors"
                title="Split code"
              >
                Split
              </button>
              <button
                onClick={onToggleMergeModal}
                className="text-xs px-3 py-1 bg-purple-500 text-white rounded-full hover:bg-purple-600 transition-colors"
                title="Merge codes"
              >
                Merge
              </button>
              <button
                onClick={onToggleAddForm}
                className="text-xs px-3 py-1 bg-blue-500 text-white rounded-full hover:bg-blue-600 transition-colors"
              >
                {showAddForm ? 'Cancel' : 'Add'}
              </button>
            </div>
          )}
        </div>
      </div>
    </>
  );
};

export default CodePaletteHeader;
