import React from 'react';
import CodeChip from '../../../common/CodeChip.js';

const DeletedCodeItem = ({ 
  deletedCode, 
  userProfiles,
  onCodeNameClick, // For viewing history in Living Codebook
  showDescriptions = true
}) => {
  const getUserName = (userId) => {
    if (userId === 'system') return 'System';
    if (userId && userProfiles[userId]) {
      return userProfiles[userId].name;
    }
    return 'Unknown';
  };

  const formatTimestamp = (timestamp) => {
    if (!timestamp) return 'Unknown time';
    
    // Handle Firestore timestamp objects
    const date = timestamp.toDate ? timestamp.toDate() : new Date(timestamp);
    return date.toLocaleDateString() + ' at ' + date.toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' });
  };

  const handleClick = () => {
    if (onCodeNameClick) {
      // Pass the deleted code directly - it already contains all needed data
      onCodeNameClick(deletedCode);
    }
  };

  return (
    <div 
      className={`code-preview flex items-center justify-between p-3 bg-gray-50 rounded-lg border border-gray-200 opacity-60 ${onCodeNameClick ? 'cursor-pointer hover:bg-gray-100 transition-all' : ''}`}
      onClick={handleClick}
      title={onCodeNameClick ? "Click to view code history" : "Deleted code"}
    >
      <div className="flex-1">
        <div className="flex items-center gap-2 mb-2">
          {/* Grey badge for deleted code */}
          <CodeChip 
            code={{
              label: deletedCode.label,
              color: 'bg-gray-200',  // Keep explicit gray for deleted codes (not a fallback)
              textColor: 'text-gray-600'
            }}
            size="md"
          />
          {/* Deleted indicator */}
          <span className="text-xs text-gray-500 italic">
            (deleted)
          </span>
          {/* Connection indicator for Living Codebook */}
          {onCodeNameClick && (
            <span className="text-xs text-gray-400">→</span>
          )}
        </div>
        
        {showDescriptions && (
          <p className="text-xs text-gray-500 leading-relaxed mb-1">
            {deletedCode.description || 'No description available'}
          </p>
        )}
        
        <div className="text-xs text-gray-400 space-y-1">
          <p>
            <span className="font-medium">Deleted:</span> {formatTimestamp(deletedCode.deletedAt)} by {getUserName(deletedCode.deletedBy)}
          </p>
          <p>
            <span className="font-medium">Reason:</span> {deletedCode.deletionReason || 'No reason provided'}
          </p>
        </div>
      </div>
    </div>
  );
};

export default DeletedCodeItem;
