import React from 'react';
import CodeList from './CodeList.js';

const CodeSection = ({ 
  title,
  codes,
  deletedCodes = [], // New prop for deleted codes
  showDescriptions,
  onEdit,
  onDelete,
  currentUser,
  userProfiles,
  emptyMessage = "No codes available",
  sectionType = "default", // "default", "custom", or "selection"
  onCodeNameClick, // New prop for Living Codebook
  hideEditButtons = false // New prop to hide edit buttons
}) => {
  if (!codes || codes.length === 0) {
    return (
      <div className="mb-4">
        <h4 className="text-sm font-medium text-gray-600 mb-3">{title}</h4>
        <p className="text-xs text-gray-500 italic">{emptyMessage}</p>
      </div>
    );
  }

  return (
    <div className="mb-6">
      <h4 className="text-sm font-medium text-gray-600 mb-3">{title}</h4>
      <CodeList
        allCodes={codes}
        deletedCodes={deletedCodes}
        showDescriptions={showDescriptions}
        onEdit={onEdit}
        onDelete={onDelete}
        currentUser={currentUser}
        userProfiles={userProfiles}
        variant="management"
        onCodeNameClick={onCodeNameClick}
        hideEditButtons={hideEditButtons}
      />
    </div>
  );
};

export default CodeSection;
