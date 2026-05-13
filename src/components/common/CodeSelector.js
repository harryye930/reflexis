import React, { useState } from 'react';
import { Close, Search } from '@mui/icons-material';
import { filterCodesBySearchQuery } from '../../lib/utils/codeSearchUtils.js';

const CodeSelector = ({ 
  codes, 
  selectedCodes = [], 
  onCodeSelect, 
  selectionMode = "multiple", // "single" or "multiple"
  showDescriptions = true,
  currentUser,
  userProfiles = {},
  title = "Select Codes",
  description = "Choose codes from the list below."
}) => {
  const [searchQuery, setSearchQuery] = useState('');
  const sourceCodes = Array.isArray(codes) ? codes : [];
  const selectedCodeList = Array.isArray(selectedCodes) ? selectedCodes : [];

  const getUserName = (userId) => {
    const profiles = userProfiles || {};
    if (userId === 'system') return 'System';
    if (userId && profiles[userId]) {
      const authorName = profiles[userId].name || 'Unknown';
      const isCurrentUser = currentUser && userId === currentUser.uid;
      return isCurrentUser ? `${authorName} (you)` : authorName;
    }
    return 'Unknown';
  };

  const visibleCodes = filterCodesBySearchQuery(sourceCodes, searchQuery, getUserName);

  const isCodeSelected = (code) => {
    if (selectionMode === "single") {
      return selectedCodes?.id === code.id;
    }
    return selectedCodeList.find(c => c.id === code.id);
  };

  return (
    <div>
      <h3 className="text-lg font-medium text-gray-900 mb-4">{title}</h3>
      <p className="text-sm text-gray-600 mb-4">
        {description}
      </p>

      <div className="relative mb-4">
        <Search
          className="absolute left-3 top-1/2 -translate-y-1/2 text-gray-400"
          sx={{ fontSize: 18 }}
        />
        <input
          type="text"
          value={searchQuery}
          onChange={(event) => setSearchQuery(event.target.value)}
          placeholder="Search codes"
          aria-label="Search codes"
          autoComplete="off"
          className="w-full rounded-lg border border-gray-200 bg-white py-2 pl-10 pr-10 text-sm text-gray-700 placeholder:text-gray-400 focus:border-blue-400 focus:outline-none focus:ring-2 focus:ring-blue-100"
        />
        {searchQuery && (
          <div className="absolute inset-y-0 right-2 flex items-center">
            <button
              type="button"
              onClick={() => setSearchQuery('')}
              aria-label="Clear code search"
              className="rounded-full p-1 text-gray-400 hover:bg-gray-100 hover:text-gray-600"
            >
              <Close sx={{ fontSize: 16 }} />
            </button>
          </div>
        )}
      </div>
      
      <div className="max-h-64 overflow-y-auto space-y-2 mb-6">
        {visibleCodes.map(code => (
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
        {sourceCodes.length === 0 && (
          <div className="rounded-lg border border-dashed border-gray-200 p-4 text-center text-sm text-gray-500">
            No codes available.
          </div>
        )}
        {sourceCodes.length > 0 && visibleCodes.length === 0 && (
          <div className="rounded-lg border border-dashed border-gray-200 p-4 text-center text-sm text-gray-500">
            No codes match your search.
          </div>
        )}
      </div>

      {selectionMode === "multiple" && (
        <div className="text-sm text-gray-600">
          Selected: {selectedCodeList.length} code{selectedCodeList.length !== 1 ? 's' : ''}
        </div>
      )}
    </div>
  );
};

export default CodeSelector;
