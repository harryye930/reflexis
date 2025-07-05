import React from 'react';

const CodeItem = ({ 
  code, 
  disabled, 
  onCodeSelect, 
  onEdit, 
  onDelete,
  currentUser,
  userProfiles,
  showDescriptions,
  variant = "selection" // "selection" or "management"
}) => {
  const getAuthorName = (code) => {
    if (code.isDefault) return null;
    if (code.createdBy && userProfiles[code.createdBy]) {
      const authorName = userProfiles[code.createdBy].name;
      const isCurrentUser = currentUser && code.createdBy === currentUser.uid;
      return isCurrentUser ? `${authorName} (you)` : authorName;
    }
    return 'Unknown';
  };

  const isManagementMode = variant === "management";
  const containerClass = isManagementMode 
    ? "code-preview flex items-center justify-between p-3 bg-white rounded-lg border border-gray-200 hover:border-gray-300 transition-all"
    : "code-palette-card group";
  
  const codeClass = isManagementMode
    ? `px-3 py-1 text-sm rounded-full ${code.color} ${code.textColor} font-medium`
    : `code-palette-unified w-full text-left p-4 rounded-xl border border-gray-100 ${code.color} ${code.textColor} ${
        disabled 
          ? 'opacity-50 cursor-not-allowed' 
          : 'cursor-pointer hover:shadow-md hover:scale-[1.02]'
      } transition-all duration-200`;

  return (
    <div className={containerClass}>
      {isManagementMode ? (
        // Management mode layout
        <>
          <div className="flex-1">
            <div className="flex items-center gap-2 mb-2">
              <span className={codeClass}>
                {code.label}
              </span>
              {code.isCustomized ? (
                <span className="customized-default-badge">CUSTOMIZED</span>
              ) : code.isDefault ? (
                <span className="default-code-badge">DEFAULT</span>
              ) : (
                <span className="custom-code-badge">CUSTOM</span>
              )}
            </div>
            <p className="text-xs text-gray-600 leading-relaxed">{code.description}</p>
          </div>
          {currentUser && (
            <div className="flex gap-1 ml-3">
              <button
                onClick={() => onEdit(code)}
                className="text-sm px-3 py-1 text-blue-600 hover:bg-blue-50 rounded-md transition-colors"
                title={code.isCustomized ? "Edit your customized version" : code.isDefault ? "Customize this default code" : "Edit code"}
              >
                ✏️ {code.isCustomized ? 'Edit' : code.isDefault ? 'Customize' : 'Edit'}
              </button>
              {code.isCustom && (
                <button
                  onClick={() => onDelete(code)}
                  className="text-sm px-3 py-1 text-red-600 hover:bg-red-50 rounded-md transition-colors"
                  title="Delete code"
                >
                  🗑️ Delete
                </button>
              )}
            </div>
          )}
        </>
      ) : (
        // Selection mode layout (original)
        <div
          className={codeClass}
          data-code={code.id}
          onClick={() => !disabled && onCodeSelect && onCodeSelect(code.id)}
        >
          <div className="flex items-start justify-between mb-2">
            <div className="flex-1">
              <div className="flex items-center gap-2">
                <span className="font-medium text-sm">{code.label}</span>
                {code.isDefault ? (
                  <span className="default-code-badge">DEFAULT</span>
                ) : (
                  <span className="custom-code-badge">CUSTOM</span>
                )}
              </div>
              {!code.isDefault && getAuthorName(code) && (
                <p className="text-xs opacity-60 mt-1">by {getAuthorName(code)}</p>
              )}
            </div>
            
            {currentUser && (
              <div className="flex gap-1 ml-3">
                <button
                  onClick={(e) => {
                    e.stopPropagation();
                    onEdit(code);
                  }}
                  className="text-xs px-2 py-1 text-blue-600 hover:bg-blue-50 rounded-md transition-colors opacity-0 group-hover:opacity-100"
                  title="Edit code"
                >
                  ✏️
                </button>
                {(code.canDelete || code.isDefault) && (
                  <button
                    onClick={(e) => {
                      e.stopPropagation();
                      onDelete(code);
                    }}
                    className="text-xs px-2 py-1 text-red-600 hover:bg-red-50 rounded-md transition-colors opacity-0 group-hover:opacity-100"
                    title="Delete code"
                  >
                    🗑️
                  </button>
                )}
              </div>
            )}
          </div>
          
          {showDescriptions && (
            <p className="text-xs opacity-80 leading-relaxed">
              {code.description}
            </p>
          )}
        </div>
      )}
    </div>
  );
};

export default CodeItem;
