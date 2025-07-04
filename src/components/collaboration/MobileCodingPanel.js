import React from 'react';

const MobileCodingPanel = ({ allCodes, currentSelection, onCodeSelect }) => {
  return (
    <div className="md:hidden fixed bottom-0 left-0 right-0 bg-white border-t border-gray-200 p-4 max-h-96 overflow-y-auto">
      <div className="flex items-center justify-between mb-3">
        <h3 className="text-lg font-semibold text-gray-900">Analysis Tools</h3>
        <button 
          className="text-gray-500 hover:text-gray-700"
          onClick={() => {/* Toggle mobile panel */}}
        >
          <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M6 18L18 6M6 6l12 12" />
          </svg>
        </button>
      </div>
      
      <div className="space-y-4">
        <div className="grid grid-cols-2 gap-2">
          {allCodes.slice(0, 6).map((code) => (
            <button
              key={code.id}
              onClick={() => onCodeSelect(code)}
              disabled={!currentSelection}
              className={`p-2 rounded-md text-xs font-medium transition-colors ${code.color} ${code.textColor} ${
                !currentSelection ? 'opacity-50 cursor-not-allowed' : 'hover:opacity-80'
              }`}
            >
              {code.label}
            </button>
          ))}
        </div>
      </div>
    </div>
  );
};

export default MobileCodingPanel;
