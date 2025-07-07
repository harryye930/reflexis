import React from 'react';
import CodeItem from './CodeItem.js';

const CodeSection = ({ 
  title,
  codes,
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
      <div className="space-y-2">
        {codes.map(code => (
          <CodeItem
            key={code.id}
            code={code}
            showDescriptions={showDescriptions}
            onEdit={onEdit}
            onDelete={onDelete}
            currentUser={currentUser}
            userProfiles={userProfiles}
            variant="management"
            onCodeNameClick={onCodeNameClick}
            hideEditButtons={hideEditButtons}
          />
        ))}
      </div>
    </div>
  );
};

export default CodeSection;
