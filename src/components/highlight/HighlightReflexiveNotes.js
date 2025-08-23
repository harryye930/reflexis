import React from 'react';
import ReflexiveResponseCard from '../common/ReflexiveResponseCard.js';
import { getShortPromptText } from '../../constants/reflexivePrompts.js';

/**
 * Component to display reflexive notes for a highlight
 * Shows when there are reflexive responses for this highlight
 */
const HighlightReflexiveNotes = ({ reflexiveResponses, groupedReflexiveResponses, userProfiles }) => {
  if (!reflexiveResponses || reflexiveResponses.length === 0) {
    return null;
  }

  // Use the grouped responses passed from the hook
  const groupedResponses = groupedReflexiveResponses || [];
  
  // Sort groups by creation date (newest first)
  const sortedGroups = [...groupedResponses].sort((a, b) => {
    const aTime = a.createdAt?.toDate ? a.createdAt.toDate() : new Date(a.createdAt);
    const bTime = b.createdAt?.toDate ? b.createdAt.toDate() : new Date(b.createdAt);
    return bTime - aTime;
  });

  const getUserName = (userId) => {
    if (!userId || !userProfiles) return 'Anonymous';
    const user = userProfiles[userId];
    return user?.name || 'Anonymous';
  };

  const getUserColor = (userId) => {
    if (!userId || !userProfiles) return '#e5e7eb'; // gray-200 fallback
    const user = userProfiles[userId];
    return user?.color || '#e5e7eb';
  };

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

  return (
    <div className="mt-3 border-t border-gray-100 pt-3">
      <div className="flex items-center gap-2 mb-2">
        <svg className="w-4 h-4 text-indigo-600" fill="none" stroke="currentColor" viewBox="0 0 24 24">
          <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M8.228 9c.549-1.165 2.03-2 3.772-2 2.21 0 4 1.343 4 3 0 1.4-1.278 2.575-3.006 2.907-.542.104-.994.54-.994 1.093m0 3h.01M21 12a9 9 0 11-18 0 9 9 0 0118 0z" />
        </svg>
        <span className="text-xs font-medium text-gray-700">
          Reflexive Notes ({reflexiveResponses.length} responses, {sortedGroups.length} session{sortedGroups.length === 1 ? '' : 's'})
        </span>
      </div>
      
      <div className="space-y-3">
        {sortedGroups.map((group, groupIndex) => (
          <div key={`${group.reflexiveLensId}-${groupIndex}`} className="bg-gray-50 rounded-lg border border-gray-200">
            {/* Group Header */}
            <div className="px-3 py-2 border-b border-gray-200 bg-gray-100 rounded-t-lg">
              <div className="flex items-center justify-between">
                <div className="flex items-center gap-2">
                  <span 
                    className="w-3 h-3 rounded-full flex-shrink-0" 
                    style={{ backgroundColor: getUserColor(group.userId) }}
                  />
                  <span className="text-xs font-medium text-gray-700">
                    {getUserName(group.userId)}
                  </span>
                </div>
                <span className="text-xs text-gray-500">
                  {formatTimestamp(group.createdAt)}
                </span>
              </div>
            </div>
            
            {/* Group Responses */}
            <div className="p-2 space-y-2">
              {Object.entries(group.responses).map(([promptType, response]) => (
                <div key={promptType} className="bg-white rounded p-2 border border-gray-100">
                  <div className="text-xs font-medium text-gray-600 mb-1">
                    {getShortPromptText(promptType)}
                  </div>
                  <blockquote className="text-xs text-gray-800 leading-relaxed italic">
                    &ldquo;{response.response}&rdquo;
                  </blockquote>
                </div>
              ))}
            </div>
          </div>
        ))}
      </div>
    </div>
  );
};

export default HighlightReflexiveNotes;
