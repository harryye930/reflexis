import React from 'react';

const CodePaletteHeader = ({ 
  showDescriptions, 
  onToggleDescriptions, 
  showAddForm, 
  onToggleAddForm,
  currentUser,
  title = "Available Codes",
  disabled = false
}) => {
  return (
    <>
      <div className="flex items-center justify-between mb-4">
        <h3 className="font-semibold text-gray-700">{title}</h3>
        <div className="flex gap-2">
          <button
            onClick={onToggleDescriptions}
            className="text-xs px-3 py-1 bg-gray-100 hover:bg-gray-200 text-gray-600 rounded-full transition-colors"
            title={showDescriptions ? 'Hide descriptions' : 'Show descriptions'}
          >
            {showDescriptions ? '👁️‍🗨️ Hide Info' : '👁️ Show Info'}
          </button>
          {currentUser && (
            <button
              onClick={onToggleAddForm}
              className="text-xs px-3 py-1 bg-blue-500 text-white rounded-full hover:bg-blue-600 transition-colors"
            >
              {showAddForm ? 'Cancel' : '+ Add'}
            </button>
          )}
        </div>
      </div>
      
      {disabled && (
        <div className="mb-4 p-3 bg-gradient-to-r from-blue-50 to-indigo-50 rounded-lg border border-blue-100">
          <div className="flex items-center gap-2">
            <span className="text-blue-500">💡</span>
            <div>
              <p className="text-xs text-blue-700 font-medium">
                Select text to activate codes
              </p>
              <p className="text-xs text-blue-600 opacity-75 mt-1">
                Hover over codes to preview them
              </p>
            </div>
          </div>
        </div>
      )}
    </>
  );
};

export default CodePaletteHeader;
