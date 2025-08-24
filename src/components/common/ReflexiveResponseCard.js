import React from 'react';
import { getShortPromptText } from '../../constants/reflexivePrompts.js';

/**
 * Reusable component for displaying a single reflexive response
 */
const ReflexiveResponseCard = ({ 
  response, 
  promptType, 
  userProfiles,
  showTimestamp = false,
  showCheckmark = false,
  hideUserName = false,
  className = ""
}) => {
  const formatTimestamp = (timestamp) => {
    if (!timestamp) return 'Unknown time';
    
    let date;
    if (timestamp.toDate) {
      // Firestore Timestamp object
      date = timestamp.toDate();
    } else {
      // JavaScript Date object or string
      date = new Date(timestamp);
    }
    
    const now = new Date();
    const diffMs = now - date;
    const diffMinutes = Math.floor(diffMs / (1000 * 60));
    const diffHours = Math.floor(diffMs / (1000 * 60 * 60));
    const diffDays = Math.floor(diffMs / (1000 * 60 * 60 * 24));
    
    if (diffMinutes < 1) return 'Just now';
    if (diffMinutes < 60) return `${diffMinutes}m ago`;
    if (diffHours < 24) return `${diffHours}h ago`;
    if (diffDays < 30) return `${diffDays}d ago`;
    
    return date.toLocaleDateString();
  };

  const getUserName = () => {
    if (!response.userId || !userProfiles) return 'Anonymous';
    const user = userProfiles[response.userId];
    return user?.name || 'Anonymous';
  };

  return (
    <div className={`bg-gray-50 rounded-lg p-2 ${className}`}>
      <div className="flex items-center gap-1 mb-1">
        <span className="text-xs font-medium text-gray-600">
          {getShortPromptText(promptType)}
        </span>
        {showCheckmark && (
          <span className="inline-flex items-center px-1.5 py-0.5 rounded-full text-xs font-medium bg-blue-100 text-blue-800">
            ✓
          </span>
        )}
      </div>
      <blockquote className="text-xs text-gray-800 leading-relaxed italic">
        &ldquo;{response.response}&rdquo;
      </blockquote>
      {showTimestamp && (
        <div className="text-xs text-gray-500 mt-1">
          {!hideUserName && (
            <>
              <span className="font-medium">{getUserName()}</span>
              <span className="mx-1">•</span>
            </>
          )}
          <span>{formatTimestamp(response.createdAt)}</span>
        </div>
      )}
    </div>
  );
};

export default ReflexiveResponseCard;
