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

import React, { useState, useEffect } from 'react';
import { People, ChatBubbleOutline } from '@mui/icons-material';
import { 
  getShortPromptText, 
  getPromptByType,
  PROMPT_SEQUENCE 
} from '../../../../../../constants/reflexivePrompts.js';
import { groupResponsesByReflexiveLensId } from '../../../../../../hooks/useReflexiveResponses.js';
import ReflexiveSummary from './ReflexiveSummary.js';
import ResearchBackgroundDisplay from '../../../../../common/ResearchBackgroundDisplay.js';
import ReflexiveResponseCard from '../../../../../common/ReflexiveResponseCard.js';

const ReflexiveStream = ({ 
  responses, 
  currentUser, 
  userProfiles, 
  loading,
  onNavigateToHighlight
}) => {
  const [filterUser, setFilterUser] = useState('all');
  const [expandedGroups, setExpandedGroups] = useState(new Set());

  // Group responses by session (reflexiveLensId)
  const groupedResponses = groupResponsesByReflexiveLensId(responses);
  
  // Expand all groups by default when responses change
  useEffect(() => {
    const groups = groupResponsesByReflexiveLensId(responses);
    if (groups.length > 0) {
      const allGroupKeys = groups.map(group => group.reflexiveLensId);
      setExpandedGroups(new Set(allGroupKeys));
    }
  }, [responses]); // Re-run when responses change

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

  const toggleGroupExpansion = (groupKey) => {
    const newExpanded = new Set(expandedGroups);
    if (newExpanded.has(groupKey)) {
      newExpanded.delete(groupKey);
    } else {
      newExpanded.add(groupKey);
    }
    setExpandedGroups(newExpanded);
  };

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
    <div className="p-4 sm:p-6">
      {/* Reflexive Summary - AI-powered meta-analysis */}
      <ReflexiveSummary 
        responses={responses}
        currentUser={currentUser}
        userProfiles={userProfiles}
        filterUser={filterUser}
        loading={loading}
      />

      {/* Filter Controls */}
      <div className="mb-6">
        <div className="filter-control bg-white border border-slate-200 rounded-lg p-4">
          <label className="block text-sm font-medium text-slate-700 mb-3 flex items-center gap-2">
            <People sx={{ fontSize: 18 }} />
            Filter by User
          </label>
          <select
            value={filterUser}
            onChange={(e) => setFilterUser(e.target.value)}
            className="block w-full px-3 py-2 border border-slate-300 rounded-lg shadow-sm focus:outline-none focus:ring-2 focus:ring-teal-500 focus:border-teal-500 text-sm bg-white transition-all duration-200 hover:border-slate-400"
          >
            <option value="all">All users ({uniqueUsers.length} contributors)</option>
            {uniqueUsers.map(userId => (
              <option key={userId} value={userId}>
                {getUserName(userId)}
              </option>
            ))}
          </select>
        </div>
      </div>

  {/* Reflexive Stream - Grouped by Session (Reflexive Lens) */}
      <div className="space-y-4">
        {sortedGroups.length === 0 ? (
          <div className="text-center py-12 bg-slate-50 border border-slate-200 rounded-lg">
            <div className="mb-4">
              <ChatBubbleOutline sx={{ fontSize: 28, opacity: 0.4 }} />
            </div>
            <h3 className="text-gray-600 text-base font-medium mb-2">No reflexive responses yet</h3>
            <p className="text-gray-500 text-sm leading-relaxed max-w-sm mx-auto">
              Responses will appear here when users reflect on their coding decisions
            </p>
            {loading && (
              <div className="mt-4 p-3 bg-blue-50 border border-blue-200 rounded-lg mx-4">
                <p className="text-blue-700 text-xs">
                  <strong>Note:</strong> If this is the first time accessing the Living Codebook, you may need to create a Firestore index. Check the console for instructions.
                </p>
              </div>
            )}
          </div>
        ) : (
          sortedGroups.map((group, index) => {
            const groupKey = group.reflexiveLensId || `${group.userId}-${group.highlightId}`;
            const isExpanded = expandedGroups.has(groupKey);
            const responseCount = Object.keys(group.responses).length;
            const hasAllResponses = responseCount === PROMPT_SEQUENCE.length;
            
            return (
              <div 
                key={groupKey} 
                className="reflexive-group-card reflexive-stream-item bg-white border border-gray-200 rounded-lg shadow-sm overflow-hidden"
                style={{ animationDelay: `${index * 0.1}s` }}
              >
                {/* Group Header - Always Visible (stacked top-down) */}
                <div 
                  className="reflexive-group-header p-4 bg-gradient-to-r from-slate-50 to-blue-50 border-b border-gray-100 cursor-pointer hover:from-slate-100 hover:to-blue-100 transition-colors"
                  onClick={() => toggleGroupExpansion(groupKey)}
                >
                  <div className="flex flex-col">
                    <div className="flex-1">
                      <div className="flex items-center gap-3 mb-2">
                        <span className="font-medium text-gray-800">
                          {getUserName(group.userId)}
                        </span>
                      </div>
                      
                      <div className="text-sm text-gray-600 mb-2">
                        <span className="font-medium">Source:</span> 
                        <span className="ml-1 italic">
                          &ldquo;{group.sourceText?.substring(0, 60) || '[No source text]'}...&rdquo;
                        </span>
                      </div>
                      
                      <div className="flex items-center justify-between text-xs text-gray-500">
                        <div className="flex-1 min-w-0">
                          <ResearchBackgroundDisplay
                            researchBackground={userProfiles[group.userId]?.researchBackground}
                            reducedResearchBackground={userProfiles[group.userId]?.reducedResearchBackground}
                            variant="inline"
                            size="xs"
                            showHeaders={true}
                            useShortHeaders={true}
                            className="text-xs text-gray-500"
                          />
                        </div>
                      </div>
                    </div>

                    <div className="flex items-center gap-2 mt-3">
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
                    {(() => {
                      // Show only answered prompts, in the default order, and include NOTE at the end if present
                      const answeredCore = PROMPT_SEQUENCE.filter(t => !!group.responses[t.type]);
                      const noteTemplate = getPromptByType('note');
                      const includeNote = !!group.responses['note'];
                      const displayTemplates = includeNote ? [...answeredCore, noteTemplate] : answeredCore;

                      return displayTemplates.map((promptTemplate) => {
                        const response = group.responses[promptTemplate.type];
                        if (!response) return null; // safety
                        return (
                          <ReflexiveResponseCard
                            key={promptTemplate.type}
                            response={response}
                            promptType={promptTemplate.type}
                            showTimestamp={true}
                            showCheckmark={true}
                            hideUserName={true}
                            className="border border-gray-100 p-3"
                          />
                        );
                      });
                    })()}
                  </div>
                )}
              </div>
            );
          })
        )}
      </div>
    </div>
  );
};

export default ReflexiveStream;
