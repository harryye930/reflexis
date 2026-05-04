import React, { useState, useEffect, useMemo } from 'react';
import { Warning, Search, Person, Autorenew, NoteAlt } from '@mui/icons-material';
import { groupResponsesByUserAndHighlight } from '../../../../../../constants/reflexivePrompts.js';
import { authFetch } from '../../../../../../lib/authFetch.js';

const ReflexiveSummary = ({ 
  responses, 
  currentUser, 
  userProfiles, 
  filterUser,
  loading 
}) => {
  const [summary, setSummary] = useState(null);
  const [metadata, setMetadata] = useState(null);
  const [summaryLoading, setSummaryLoading] = useState(false);
  const [error, setError] = useState(null);
  const [isExpanded, setIsExpanded] = useState(false);

  // Filter responses based on current filter
  const filteredResponses = filterUser === 'all' 
    ? responses 
    : responses.filter(r => r.userId === filterUser);

  // Use filtered responses for summary generation (supports both single user and all users)
  const responsesForSummary = useMemo(() => {
    return filteredResponses;
  }, [filteredResponses]);

  const getUserName = (userId) => {
    if (currentUser && userId === currentUser.uid) {
      return userProfiles[userId]?.name ? `${userProfiles[userId].name} (you)` : 'You';
    }
    return userProfiles[userId]?.name || 'Unknown User';
  };

  const getSummaryTitle = () => {
    if (filterUser === 'all') {
      const uniqueUsers = [...new Set(responses.map(r => r.userId))];
      return `All Researchers (${uniqueUsers.length} contributors)`;
    } else {
      return getUserName(filterUser);
    }
  };

  // Helper function to get response counts by type
  const getResponseCounts = () => {
    const counts = {
      justification: 0,
      positionality: 0,
      alternative: 0,
      note: 0
    };
    
    responsesForSummary.forEach(response => {
      if (response.promptType in counts) {
        counts[response.promptType]++;
      }
    });
    
    return counts;
  };

  const responseCounts = getResponseCounts();

  // Reset summary when filter changes
  useEffect(() => {
    setSummary(null);
    setMetadata(null);
    setError(null);
  }, [filterUser]);

  const handleGenerateSummary = async () => {
    if (!responsesForSummary || responsesForSummary.length === 0) {
      setError('No responses available for summary generation');
      return;
    }

    setSummaryLoading(true);
    setError(null);

    try {
      const response = await authFetch('/api/reflexive/summary', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({
          responses: responsesForSummary,
          userId: filterUser === 'all' ? 'all_users' : filterUser
        }),
      });

      if (!response.ok) {
        throw new Error(`HTTP error! status: ${response.status}`);
      }

      const data = await response.json();
      
      if (data.success) {
        setSummary(data.summary);
        setMetadata(data.metadata);
        // Open the summary panel when results are ready
        setIsExpanded(true);
      } else {
        throw new Error(data.error || 'Failed to generate summary');
      }
    } catch (err) {
      console.error('Error generating reflexive summary:', err);
      setError(err.message || 'Failed to generate summary');
    } finally {
      setSummaryLoading(false);
    }
  };

  const handleRegenerateSummary = async () => {
    await handleGenerateSummary();
  };

  if (loading) {
    return null; // Don't show while main data is loading
  }

  // Don't show if no responses for filtered selection
  if (responsesForSummary.length === 0) {
    return null;
  }

  return (
    <div className="reflexive-summary bg-white border border-slate-200 rounded-xl shadow-sm mb-6 overflow-hidden">
      {/* Header */}
      <div className="px-4 sm:px-6 py-4 bg-teal-50 border-b border-teal-100">
        {/* Title Row */}
        <div className="flex items-center justify-between mb-3">
          <div className="flex items-center gap-3 min-w-0 flex-1">
            <div className="min-w-0 flex-1">
              <h3 className="text-lg font-medium text-slate-800">
                Reflexive Analysis
              </h3>
              <p className="text-sm text-slate-600 leading-relaxed">
                AI-powered insights for {getSummaryTitle()}
              </p>
            </div>
          </div>
          
          <button
            onClick={() => setIsExpanded(!isExpanded)}
            className="p-2 hover:bg-slate-100 rounded-lg transition-colors flex-shrink-0 ml-2"
          >
            <svg 
              className={`w-5 h-5 text-slate-600 transition-transform duration-200 ${isExpanded ? 'rotate-180' : ''}`} 
              fill="none" 
              stroke="currentColor" 
              viewBox="0 0 24 24"
            >
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M19 9l-7 7-7-7" />
            </svg>
          </button>
        </div>
        
        {/* Controls Row */}
        <div className="flex items-center justify-between gap-3">
          <div className="flex items-center gap-2">
            <span className="text-xs text-slate-600 bg-slate-200 px-2.5 py-1 rounded-full whitespace-nowrap">
              {responsesForSummary.length} responses
            </span>
          </div>

          <div className="flex items-center gap-2">
            {summary ? (
              <button
                onClick={handleRegenerateSummary}
                disabled={summaryLoading}
                className="px-3 py-1.5 bg-teal-600 text-white text-xs font-medium rounded-md hover:bg-teal-700 disabled:opacity-50 disabled:cursor-not-allowed transition-all duration-200 flex items-center gap-1.5 whitespace-nowrap"
              >
        {summaryLoading ? (
                  <>
                    <div className="w-3 h-3 border-2 border-white/60 border-t-white rounded-full animate-spin"></div>
                    <span className="hidden sm:inline">Regenerating...</span>
                    <span className="sm:hidden">...</span>
                  </>
                ) : (
                  <>
          <Autorenew sx={{ fontSize: 16 }} />
                    <span className="hidden sm:inline">Regenerate</span>
                  </>
                )}
              </button>
            ) : (
              <button
                onClick={handleGenerateSummary}
                disabled={summaryLoading}
                className="px-3 py-1.5 bg-teal-600 text-white text-xs font-medium rounded-md hover:bg-teal-700 disabled:opacity-50 disabled:cursor-not-allowed transition-all duration-200 flex items-center gap-1.5 whitespace-nowrap"
              >
                {summaryLoading ? (
                  <>
                    <div className="w-3 h-3 border-2 border-white/60 border-t-white rounded-full animate-spin"></div>
                    <span className="hidden sm:inline">Generating...</span>
                    <span className="sm:hidden">...</span>
                  </>
                ) : (
                  <>
                    <span className="hidden sm:inline">Generate Analysis</span>
                    <span className="sm:hidden">Generate</span>
                  </>
                )}
              </button>
            )}
          </div>
        </div>
      </div>

      {/* Content */}
      {isExpanded && (
        <div className="p-4 sm:p-6">
          {error && (
            <div className="mb-4 p-3 bg-red-50 border border-red-200 rounded-lg">
              <div className="flex items-center gap-2 text-red-800">
                <Warning sx={{ fontSize: 18 }} />
                <span className="text-sm font-medium">Error generating summary</span>
              </div>
              <p className="text-sm text-red-600 mt-1">{error}</p>
              <button
                onClick={handleGenerateSummary}
                className="mt-2 text-sm text-red-700 hover:text-red-900 underline"
              >
                Try again
              </button>
            </div>
          )}

          {summaryLoading && (
            <div className="text-center py-8">
              <div className="w-8 h-8 border-2 border-teal-300 border-t-teal-600 rounded-full animate-spin mx-auto mb-3"></div>
              <p className="text-sm text-slate-600">Generating reflexive insights...</p>
            </div>
          )}

          {summary && !summaryLoading && (
            <div className="space-y-5">
              {/* Linguistic Patterns - Only show if there are justification responses */}
              {summary.linguisticPatterns && responseCounts.justification > 0 && (
                <div className="analysis-section">
                  <div className="flex items-center gap-2 mb-3">
                    <Search sx={{ fontSize: 18 }} />
                    <h4 className="text-sm font-semibold text-slate-800">Linguistic Patterns</h4>
                    <span className="text-xs text-slate-600 bg-slate-100 px-2 py-0.5 rounded-full">
                      {responseCounts.justification} response{responseCounts.justification === 1 ? '' : 's'}
                    </span>
                  </div>
                  <div className="bg-slate-50 border border-slate-200 rounded-lg p-3">
                    <p className="text-sm text-slate-700 leading-relaxed">{summary.linguisticPatterns}</p>
                  </div>
                </div>
              )}

              {/* Positionality Narrative - Only show if there are positionality responses */}
              {summary.positionalityNarrative && responseCounts.positionality > 0 && (
                <div className="analysis-section">
                  <div className="flex items-center gap-2 mb-3">
                    <Person sx={{ fontSize: 18 }} />
                    <h4 className="text-sm font-semibold text-slate-800">Positionality Narrative</h4>
                    <span className="text-xs text-slate-600 bg-slate-100 px-2 py-0.5 rounded-full">
                      {responseCounts.positionality} response{responseCounts.positionality === 1 ? '' : 's'}
                    </span>
                  </div>
                  <div className="bg-slate-50 border border-slate-200 rounded-lg p-3">
                    <p className="text-sm text-slate-700 leading-relaxed">{summary.positionalityNarrative}</p>
                  </div>
                </div>
              )}

              {/* Alternative Thinking Patterns - Only show if there are alternative responses */}
              {summary.alternativeThinkingPatterns && responseCounts.alternative > 0 && (
                <div className="analysis-section">
                  <div className="flex items-center gap-2 mb-3">
                    <Autorenew sx={{ fontSize: 18 }} />
                    <h4 className="text-sm font-semibold text-slate-800">Alternative Thinking Patterns</h4>
                    <span className="text-xs text-slate-600 bg-slate-100 px-2 py-0.5 rounded-full">
                      {responseCounts.alternative} response{responseCounts.alternative === 1 ? '' : 's'}
                    </span>
                  </div>
                  <div className="bg-slate-50 border border-slate-200 rounded-lg p-3">
                    <p className="text-sm text-slate-700 leading-relaxed">{summary.alternativeThinkingPatterns}</p>
                  </div>
                </div>
              )}

              {/* Notes - Only show if there are note responses */}
              {summary.notes && responseCounts.note > 0 && (
                <div className="analysis-section">
                  <div className="flex items-center gap-2 mb-3">
                    <NoteAlt sx={{ fontSize: 18 }} />
                    <h4 className="text-sm font-semibold text-slate-800">Notes</h4>
                    <span className="text-xs text-slate-600 bg-slate-100 px-2 py-0.5 rounded-full">
                      {responseCounts.note} response{responseCounts.note === 1 ? '' : 's'}
                    </span>
                  </div>
                  <div className="bg-slate-50 border border-slate-200 rounded-lg p-3">
                    <p className="text-sm text-slate-700 leading-relaxed">{summary.notes}</p>
                  </div>
                </div>
              )}
            </div>
          )}

          {!summary && !summaryLoading && !error && (
            <div className="text-center py-8 text-slate-500">
              <p className="text-sm leading-relaxed">
                Click <strong>&ldquo;Generate Analysis&rdquo;</strong> above to create AI-powered insights from the reflexive responses.
              </p>
              <p className="text-xs mt-2 text-slate-400">
                Analysis will synthesize patterns across {responsesForSummary.length} response{responsesForSummary.length === 1 ? '' : 's'}
              </p>
            </div>
          )}
        </div>
      )}
    </div>
  );
};

export default ReflexiveSummary;
