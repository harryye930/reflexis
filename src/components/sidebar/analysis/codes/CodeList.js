import React, { useState } from 'react';
import CodeItem from './CodeItem.js';
import DeletedCodeItem from './DeletedCodeItem.js';

const CodeList = ({ 
  allCodes, 
  deletedCodes = [], // New prop for deleted codes
  showDescriptions, 
  onEdit, 
  onDelete,
  currentUser,
  userProfiles,
  variant = "selection",
  onCodeNameClick, // New prop for Living Codebook
  hideEditButtons = false // New prop to hide edit buttons
}) => {
  const [showDeletedCodes, setShowDeletedCodes] = useState(false);
  if (!allCodes || allCodes.length === 0) {
    return (
      <div className="mb-6">
        <h3 className="font-semibold text-gray-700 mb-3">Available Codes</h3>
        <p className="text-sm text-gray-500">Loading codes...</p>
      </div>
    );
  }

  return (
    <div id="codes-list" className="space-y-3">
      {/* Active Codes */}
      {allCodes.map(code => (
        <CodeItem
          key={code.id}
          code={code}
          showDescriptions={showDescriptions}
          onEdit={onEdit}
          onDelete={onDelete}
          currentUser={currentUser}
          userProfiles={userProfiles}
          variant={variant}
          onCodeNameClick={onCodeNameClick}
          hideEditButtons={hideEditButtons}
        />
      ))}

      {/* Deleted Codes Section */}
      {deletedCodes.length > 0 && (
        <div className="mt-6 pt-4 border-t border-gray-200">
          <button
            onClick={() => setShowDeletedCodes(!showDeletedCodes)}
            className="flex items-center justify-between w-full p-2 text-left text-sm font-medium text-gray-600 hover:text-gray-800 hover:bg-gray-50 rounded-md transition-colors"
          >
            <div className="flex items-center gap-2">
              <svg 
                className={`w-4 h-4 transition-transform ${showDeletedCodes ? 'rotate-90' : ''}`}
                fill="none" 
                stroke="currentColor" 
                viewBox="0 0 24 24"
              >
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 5l7 7-7 7" />
              </svg>
              <span>Deleted Codes</span>
            </div>
            <span className="text-xs text-gray-500 bg-gray-100 px-2 py-1 rounded-full">
              {deletedCodes.length}
            </span>
          </button>
          
          {showDeletedCodes && (
            <div className="mt-3 space-y-2">
              {deletedCodes.map(deletedCode => (
                <DeletedCodeItem
                  key={deletedCode.id}
                  deletedCode={deletedCode}
                  userProfiles={userProfiles}
                  onCodeNameClick={onCodeNameClick}
                  showDescriptions={showDescriptions}
                />
              ))}
            </div>
          )}
        </div>
      )}
    </div>
  );
};

export default CodeList;
