import React from 'react';
import CodeChip from './CodeChip.js';

const CodeSelector = ({ 
  codes, 
  selectedCodes = [], 
  onCodeSelect, 
  selectionMode = "multiple", // "single" or "multiple"
  showDescriptions = true,
  currentUser,
  userProfiles,
  title = "Select Codes",
  description = "Choose codes from the list below."
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

  const isCodeSelected = (code) => {
    if (selectionMode === "single") {
      return selectedCodes?.id === code.id;
    }
    return selectedCodes.find(c => c.id === code.id);
  };

  return (
    <div>
      <h3 className="text-lg font-medium text-gray-900 mb-4">{title}</h3>
      <p className="text-sm text-gray-600 mb-4">
        {description}
      </p>
      
      <div className="max-h-64 overflow-y-auto space-y-2 mb-6">
        {codes.map(code => (
          <div
            key={code.id}
            onClick={() => onCodeSelect(code)}
            className={`p-3 border rounded-lg cursor-pointer transition-all ${
              isCodeSelected(code)
                ? 'border-blue-500 bg-blue-50'
                : 'border-gray-200 hover:border-gray-300 hover:bg-gray-50'
            }`}
          >
            <div className="flex items-center gap-3">
              <div 
                className={`w-4 h-4 rounded border-2 flex items-center justify-center ${
                  isCodeSelected(code)
                    ? 'border-blue-500 bg-blue-500'
                    : 'border-gray-300'
                }`}
              >
                {isCodeSelected(code) && (
                  <svg className="w-3 h-3 text-white" fill="currentColor" viewBox="0 0 20 20">
                    <path fillRule="evenodd" d="M16.707 5.293a1 1 0 010 1.414l-8 8a1 1 0 01-1.414 0l-4-4a1 1 0 011.414-1.414L8 12.586l7.293-7.293a1 1 0 011.414 0z" clipRule="evenodd" />
                  </svg>
                )}
              </div>
              
              <div className="flex-1">
                <div className={`code-palette-unified w-full text-left p-3 rounded-xl border border-gray-100 ${code.color} ${code.textColor} font-medium transition-all duration-200`}>
                  <div className="font-medium text-sm mb-1">
                    {code.label}
                  </div>
                  {/* Always show description */}
                  <p className="text-xs opacity-80">{code.description}</p>
                  {/* Show other info conditionally */}
                  {showDescriptions && (
                    <p className="text-xs opacity-60 mt-1">by {getUserName(code.createdBy)}</p>
                  )}
                </div>
              </div>
            </div>
          </div>
        ))}
      </div>

      {selectionMode === "multiple" && (
        <div className="text-sm text-gray-600">
          Selected: {selectedCodes.length} code{selectedCodes.length !== 1 ? 's' : ''}
        </div>
      )}
    </div>
  );
};

export default CodeSelector;
