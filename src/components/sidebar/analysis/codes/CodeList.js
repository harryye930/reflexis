import React from 'react';
import CodeItem from './CodeItem.js';

const CodeList = ({ 
  allCodes, 
  showDescriptions, 
  onEdit, 
  onDelete,
  currentUser,
  userProfiles,
  variant = "selection",
  onCodeNameClick, // New prop for Living Codebook
  hideEditButtons = false // New prop to hide edit buttons
}) => {
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
    </div>
  );
};

export default CodeList;
