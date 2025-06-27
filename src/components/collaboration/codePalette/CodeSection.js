import React from 'react';
import CodeItem from './CodeItem.js';

const CodeSection = ({ 
  title,
  codes,
  showDescriptions,
  disabled,
  onCodeSelect,
  onEdit,
  onDelete,
  currentUser,
  userProfiles,
  emptyMessage = "No codes available",
  sectionType = "default" // "default", "custom", or "selection"
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
            disabled={disabled}
            showDescriptions={showDescriptions}
            onCodeSelect={onCodeSelect}
            onEdit={onEdit}
            onDelete={onDelete}
            currentUser={currentUser}
            userProfiles={userProfiles}
            variant="management"
          />
        ))}
      </div>
    </div>
  );
};

export default CodeSection;
