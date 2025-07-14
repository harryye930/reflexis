/*
 * ReflexiveStream Component - FULLY IMPLEMENTED
 * 
 * This component displays reflexive responses for a specific code in the Living Codebook.
 * It connects to real Firebase data through ReflexiveService.onReflexiveResponsesByCodeSnapshot()
 * 
 * Connected Features:
 * - Real-time reflexive response data from Firebase
 * - User filtering (by userId)
 * - User profiles with positionality information
 * - Grouped responses by user and highlight for better readability
 * - Simplified prompt display for sidebar context
 * - "View Source" button - navigates to document and highlights the source text
 */

import React, { useState } from 'react';
import { 
  groupResponsesByUserAndHighlight, 
  getShortPromptText, 
  getPromptByType,
  PROMPT_SEQUENCE 
} from '../../../../constants/reflexivePrompts.js';

const ReflexiveStream = ({ 
  responses, 
  currentUser, 
  userProfiles, 
  loading,
  onNavigateToHighlight
}) => {
  const [filterUser, setFilterUser] = useState('all');
  const [expandedGroups, setExpandedGroups] = useState(new Set());

  const formatTimestamp = (timestamp) => {
    if (!timestamp) return 'Unknown time';
    
    let date;
    if (timestamp.toDate) {
      // Firestore Timestamp object
      date = timestamp.toDate();
    } else {
      date = new Date(timestamp);
    }
    
    if (isNaN(date.getTime())) {
      return 'Invalid date';
    }
    
    return date.toLocaleDateString() + ' ' + date.toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' });
  };

  const getUserName = (userId) => {
    if (currentUser && userId === currentUser.uid) {
      return userProfiles[userId]?.name ? `${userProfiles[userId].name} (you)` : 'You';
    }
    return userProfiles[userId]?.name || 'Unknown User';
  };

  const getUserPositionality = (userId) => {
    return userProfiles[userId]?.researchBackground || 'Not specified';
  };

  const toggleGroupExpansion = (groupKey) => {
    const newExpanded = new Set(expandedGroups);
    if (newExpanded.has(groupKey)) {
      newExpanded.delete(groupKey);
    } else {
      newExpanded.add(groupKey);
    }
    setExpandedGroups(newExpanded);
  };

  // Group responses by user and highlight
  const groupedResponses = groupResponsesByUserAndHighlight(responses);
  
  // Get unique users for filter
  const uniqueUsers = [...new Set(responses.map(r => r.userId))].filter(Boolean);
  
  const filteredGroups = filterUser === 'all' 
    ? groupedResponses 
    : groupedResponses.filter(group => group.userId === filterUser);

  const sortedGroups = [...filteredGroups].sort((a, b) => {
    const aTime = new Date(a.createdAt);
    const bTime = new Date(b.createdAt);
    return bTime - aTime;
  });

  if (loading) {
    return (
      <div className="p-6">
        <div className="flex items-center justify-center py-8">
          <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-blue-500"></div>
        </div>
      </div>
    );
  }

  return (
    <div className="p-6">
      {/* Filter Controls */}
      <div className="mb-6">
        <label className="block text-sm font-medium text-gray-700 mb-2">
          Filter by User
        </label>
        <select
          value={filterUser}
          onChange={(e) => setFilterUser(e.target.value)}
          className="block w-full px-3 py-2 border border-gray-300 rounded-md shadow-sm focus:outline-none focus:ring-blue-500 focus:border-blue-500 sm:text-sm"
        >
          <option value="all">All users</option>
          {uniqueUsers.map(userId => (
            <option key={userId} value={userId}>
              {getUserName(userId)}
            </option>
          ))}
        </select>
      </div>

      {/* Reflexive Stream - Grouped by User and Highlight */}
      <div className="space-y-4">
        {sortedGroups.length === 0 ? (
          <div className="text-center py-8">
            <div className="text-gray-400 mb-2">
              <svg className="w-12 h-12 mx-auto" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={1} d="M8 12h.01M12 12h.01M16 12h.01M21 12c0 4.418-4.03 8-9 8a9.863 9.863 0 01-4.255-.949L3 20l1.395-3.72C3.512 15.042 3 13.574 3 12c0-4.418 4.03-8 9-8s9 3.582 9 8z" />
              </svg>
            </div>
            <p className="text-gray-500 text-sm">No reflexive responses yet</p>
            <p className="text-gray-400 text-xs mt-1">
              Responses will appear here when users reflect on their coding decisions
            </p>
            {loading && (
              <p className="text-blue-500 text-xs mt-2">
                Note: If this is the first time accessing the Living Codebook, you may need to create a Firestore index. Check the console for instructions.
              </p>
            )}
          </div>
        ) : (
          sortedGroups.map((group, index) => {
            const groupKey = `${group.userId}-${group.highlightId}`;
            const isExpanded = expandedGroups.has(groupKey);
            const responseCount = Object.keys(group.responses).length;
            const hasAllResponses = responseCount === PROMPT_SEQUENCE.length;
            
            return (
              <div 
                key={groupKey} 
                className="reflexive-group-card reflexive-stream-item bg-white border border-gray-200 rounded-lg shadow-sm overflow-hidden"
                style={{ animationDelay: `${index * 0.1}s` }}
              >
                {/* Group Header - Always Visible */}
                <div 
                  className="reflexive-group-header p-4 bg-gradient-to-r from-slate-50 to-blue-50 border-b border-gray-100 cursor-pointer hover:from-slate-100 hover:to-blue-100 transition-colors"
                  onClick={() => toggleGroupExpansion(groupKey)}
                >
                  <div className="flex items-center justify-between">
                    <div className="flex-1">
                      <div className="flex items-center gap-3 mb-2">
                        <span className="font-medium text-gray-800">
                          {getUserName(group.userId)}
                        </span>
                        <div className="flex items-center gap-1">
                          {hasAllResponses ? (
                            <span className="completion-badge-complete inline-flex items-center px-2 py-0.5 rounded-full text-xs font-medium text-green-800">
                              ✓ Complete Reflection
                            </span>
                          ) : (
                            <span className="completion-badge-partial inline-flex items-center px-2 py-0.5 rounded-full text-xs font-medium text-orange-800">
                              {responseCount}/3 responses
                            </span>
                          )}
                        </div>
                      </div>
                      
                      <div className="text-sm text-gray-600 mb-2">
                        <span className="font-medium">Source:</span> 
                        <span className="ml-1 italic">
                          &ldquo;{group.sourceText?.substring(0, 60) || '[No source text]'}...&rdquo;
                        </span>
                      </div>
                      
                      <div className="flex items-center justify-between text-xs text-gray-500">
                        <span>Positionality: {getUserPositionality(group.userId)}</span>
                        <span>{formatTimestamp(group.createdAt)}</span>
                      </div>
                    </div>
                    
                    <div className="flex items-center gap-2 ml-4">
                      <button 
                        className={`text-xs font-medium px-2 py-1 rounded transition-all duration-200 ${
                          onNavigateToHighlight && group.highlightId && group.documentId
                            ? 'text-blue-600 hover:text-blue-800 hover:bg-blue-50 cursor-pointer'
                            : 'text-gray-400 cursor-not-allowed'
                        }`}
                        disabled={!onNavigateToHighlight || !group.highlightId || !group.documentId}
                        onClick={(e) => {
                          e.stopPropagation();
                          if (!onNavigateToHighlight) {
                            console.error('onNavigateToHighlight function not provided');
                            return;
                          }
                          
                          if (!group.highlightId || !group.documentId) {
                            console.error('Missing highlightId or documentId');
                            return;
                          }
                          
                          onNavigateToHighlight(group.documentId, group.highlightId);
                        }}
                      >
                        View Source
                      </button>
                      
                      <svg 
                        className={`w-4 h-4 text-gray-400 transition-transform duration-200 ${isExpanded ? 'rotate-180' : ''}`} 
                        fill="none" 
                        stroke="currentColor" 
                        viewBox="0 0 24 24"
                      >
                        <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M19 9l-7 7-7-7" />
                      </svg>
                    </div>
                  </div>
                </div>

                {/* Expanded Content - Individual Responses */}
                {isExpanded && (
                  <div className="reflexive-expansion p-4 space-y-4">
                    {PROMPT_SEQUENCE.map((promptTemplate) => {
                      const response = group.responses[promptTemplate.type];
                      
                      return (
                        <div key={promptTemplate.type} className="reflexive-response-card response-type-indicator border border-gray-100 rounded-lg p-3">
                          <div className="flex items-center gap-2 mb-2">
                            <span className="text-lg">{promptTemplate.icon}</span>
                            <span className="text-sm font-medium text-gray-700">
                              {getShortPromptText(promptTemplate.type)}
                            </span>
                            {response && (
                              <span className="inline-flex items-center px-1.5 py-0.5 rounded-full text-xs font-medium bg-blue-100 text-blue-800">
                                ✓
                              </span>
                            )}
                          </div>
                          
                          {response ? (
                            <div>
                              <blockquote className="text-sm text-gray-800 leading-relaxed border-l-2 border-blue-200 pl-3 italic mb-2">
                                &ldquo;{response.response}&rdquo;
                              </blockquote>
                              <div className="text-xs text-gray-500">
                                {formatTimestamp(response.createdAt)}
                              </div>
                            </div>
                          ) : (
                            <div className="text-sm text-gray-400 italic">
                              No response provided
                            </div>
                          )}
                        </div>
                      );
                    })}
                  </div>
                )}
              </div>
            );
          })
        )}
      </div>

      {/* Summary Stats */}
      {sortedGroups.length > 0 && (
        <div className="mt-6 p-4 bg-gray-50 rounded-lg">
          <h4 className="text-sm font-medium text-gray-700 mb-2">Stream Summary</h4>
          <div className="grid grid-cols-2 gap-4 text-sm">
            <div>
              <span className="text-gray-500">Reflection Sessions:</span>
              <span className="ml-1 font-medium">{groupedResponses.length}</span>
            </div>
            <div>
              <span className="text-gray-500">Contributors:</span>
              <span className="ml-1 font-medium">{uniqueUsers.length}</span>
            </div>
            <div>
              <span className="text-gray-500">Total Responses:</span>
              <span className="ml-1 font-medium">{responses.length}</span>
            </div>
            <div>
              <span className="text-gray-500">Complete Reflections:</span>
              <span className="ml-1 font-medium">
                {groupedResponses.filter(g => Object.keys(g.responses).length === PROMPT_SEQUENCE.length).length}
              </span>
            </div>
          </div>
        </div>
      )}
    </div>
  );
};

export default ReflexiveStream;
