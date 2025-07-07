import React from 'react';

const LivingCodebookHeader = ({ 
  code, 
  onBack, 
  onEditCode, 
  currentUser 
}) => {
  return (
    <div className="border-b border-gray-200 bg-white">
      {/* Back button */}
      <div className="px-6 py-4">
        <button
          onClick={onBack}
          className="flex items-center text-sm text-gray-600 hover:text-gray-900 transition-colors"
        >
          <svg className="w-4 h-4 mr-2" fill="none" stroke="currentColor" viewBox="0 0 24 24">
            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M15 19l-7-7 7-7" />
          </svg>
          Back to all codes
        </button>
      </div>

      {/* Code header */}
      <div className="px-6 pb-6">
        <div className="flex items-start justify-between">
          <div className="flex-1">
            <h2 className="text-2xl font-bold text-gray-900 mb-2">{code.label}</h2>
            {code.isDefault && (
              <span className="inline-flex items-center px-2.5 py-0.5 rounded-full text-xs font-medium bg-blue-100 text-blue-800">
                DEFAULT
              </span>
            )}
            {code.isCustom && (
              <span className="inline-flex items-center px-2.5 py-0.5 rounded-full text-xs font-medium bg-green-100 text-green-800">
                CUSTOM
              </span>
            )}
          </div>
          
          {currentUser && (
            <button
              onClick={() => onEditCode(code)}
              className="flex items-center px-3 py-2 text-sm text-blue-600 hover:bg-blue-50 rounded-md transition-colors"
            >
              <svg className="w-4 h-4 mr-2" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M11 5H6a2 2 0 00-2 2v11a2 2 0 002 2h11a2 2 0 002-2v-5m-1.414-9.414a2 2 0 112.828 2.828L11.828 15H9v-2.828l8.586-8.586z" />
              </svg>
              Edit
            </button>
          )}
        </div>

        {/* Canonical Definition */}
        <div className="mt-6">
          <h3 className="text-sm font-medium text-gray-700 mb-2">CANONICAL DEFINITION</h3>
          <div className="bg-gray-50 rounded-lg p-4">
            <p className="text-sm text-gray-800 leading-relaxed">
              {code.description}
            </p>
          </div>
        </div>
      </div>
    </div>
  );
};

export default LivingCodebookHeader;
