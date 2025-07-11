import React, { useState, useEffect, useRef } from 'react';
import { appId } from '../../../../constants/index.js';
import { CodeService } from '../../../../services/api/firebase/codeService.js';

// Error Boundary Component
class CodeHistoryErrorBoundary extends React.Component {
  constructor(props) {
    super(props);
    this.state = { hasError: false, error: null };
  }

  static getDerivedStateFromError(error) {
    return { hasError: true, error };
  }

  componentDidCatch(error, errorInfo) {
    console.error('CodeHistory Error Boundary caught an error:', error, errorInfo);
  }

  render() {
    if (this.state.hasError) {
      return (
        <div className="p-6">
          <div className="mb-6">
            <h3 className="text-lg font-medium text-gray-900 mb-2">Code History</h3>
          </div>
          <div className="bg-red-50 border border-red-200 rounded-lg p-4">
            <div className="flex items-center gap-2 mb-2">
              <span className="text-lg">⚠️</span>
              <h4 className="text-sm font-medium text-red-800">Error Loading History</h4>
            </div>
            <p className="text-sm text-red-600">
              There was an issue displaying the code history. Please try refreshing the page.
            </p>
            <button 
              onClick={() => this.setState({ hasError: false, error: null })}
              className="mt-3 px-3 py-1 bg-red-100 text-red-700 rounded text-sm hover:bg-red-200 transition-colors"
            >
              Try Again
            </button>
          </div>
        </div>
      );
    }

    return this.props.children;
  }
}

// Create code service instance outside component to avoid re-instantiation
const codeService = new CodeService(appId);

const CodeHistory = ({ code, userProfiles }) => {
  const [history, setHistory] = useState([]);
  const [loading, setLoading] = useState(true);
  const prevCodeIdRef = useRef(null);

  // Load code history when component mounts or code changes
  useEffect(() => {
    if (!code) {
      setHistory([]);
      setLoading(false);
      return;
    }

    const currentCodeId = code.id;
    const codeIdChanged = prevCodeIdRef.current !== currentCodeId;
    
    // Only show loading state if the code actually changed, not just tab switching
    if (codeIdChanged) {
      setLoading(true);
      prevCodeIdRef.current = currentCodeId;
    }
    
    try {
      console.log('CodeHistory: Loading history for code:', currentCodeId);
      
      const unsubscribe = codeService.onCodeHistorySnapshot(currentCodeId, (historyData) => {
        console.log('CodeHistory: Received history data:', historyData);
        setHistory(historyData);
        setLoading(false);
      });

      return () => {
        console.log('CodeHistory: Cleaning up listener for code:', currentCodeId);
        unsubscribe();
      };
    } catch (error) {
      console.error('CodeHistory: Error setting up listener:', error);
      setHistory([]);
      setLoading(false);
    }
  }, [code]);

  const formatTimestamp = (timestamp) => {
    if (!timestamp) return 'Unknown time';
    
    // Handle Firestore timestamp objects
    const date = timestamp.toDate ? timestamp.toDate() : new Date(timestamp);
    return date.toLocaleDateString() + ' ' + date.toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' });
  };

  const getUserName = (userId) => {
    if (userId === 'system') return 'System';
    if (userId && userProfiles && userProfiles[userId]) {
      return userProfiles[userId].name;
    }
    return 'Unknown User';
  };

  const getEventIcon = (type) => {
    switch (type) {
      case 'created':
        return '🎯';
      case 'updated':
        return '✏️';
      case 'deleted':
        return '🗑️';
      case 'applied':
        return '🏷️';
      case 'usage-milestone':
        return '🏆';
      case 'merged':
        return '🔀';
      default:
        return '📝';
    }
  };

  const getEventColor = (type) => {
    switch (type) {
      case 'created':
        return 'bg-green-100 text-green-800';
      case 'updated':
        return 'bg-blue-100 text-blue-800';
      case 'deleted':
        return 'bg-red-100 text-red-800';
      case 'applied':
        return 'bg-purple-100 text-purple-800';
      case 'usage-milestone':
        return 'bg-yellow-100 text-yellow-800';
      case 'merged':
        return 'bg-orange-100 text-orange-800';
      default:
        return 'bg-gray-100 text-gray-800';
    }
  };

  // Helper function to parse and style code names in text
  const parseAndStyleCodeNames = (text, event = null) => {
    if (!text) return text;
    
    // For "applied" events, we only want to style the code name, not document titles
    // The format is: Code "CodeName" applied to text in "DocumentTitle"
    if (event?.type === 'applied') {
      // Only style the first quoted item (which should be the code name)
      const codeNameMatch = text.match(/Code "([^"]+)"/);
      if (codeNameMatch) {
        const codeName = codeNameMatch[1];
        let codeColor = 'bg-blue-200';
        let textColor = 'text-blue-800';
        
        // If it matches the current code being viewed, use its colors
        if (codeName === code.label) {
          codeColor = code.color || 'bg-blue-200';
          textColor = code.textColor || 'text-blue-800';
        }
        
        // Split the text and create JSX elements
        const beforeCode = text.substring(0, text.indexOf(`"${codeName}"`));
        const afterCode = text.substring(text.indexOf(`"${codeName}"`) + codeName.length + 2);
        
        return (
          <>
            {beforeCode}
            <span className={`code-palette-unified inline-flex px-2 py-1 rounded-full font-medium text-xs ${codeColor} ${textColor} border border-gray-100 transition-all duration-200 mx-1`}>
              {codeName}
            </span>
            {afterCode}
          </>
        );
      }
      // If no code name pattern found, return as-is
      return text;
    }
    
    // For other event types, style all quoted text as before
    const codeNameRegex = /"([^"]+)"/g;
    const parts = [];
    let lastIndex = 0;
    let match;
    
    while ((match = codeNameRegex.exec(text)) !== null) {
      // Add text before the match
      if (match.index > lastIndex) {
        parts.push(text.slice(lastIndex, match.index));
      }
      
      // Add styled code name
      const codeName = match[1];
      
      // Try to find the actual code colors from merge source codes or use defaults
      let codeColor = 'bg-blue-200';
      let textColor = 'text-blue-800';
      
      if (event?.changes?.sourceCodes && Array.isArray(event.changes.sourceCodes)) {
        const matchingCode = event.changes.sourceCodes.find(sourceCode => 
          sourceCode && sourceCode.label === codeName
        );
        if (matchingCode) {
          codeColor = matchingCode.color || 'bg-blue-200';
          textColor = matchingCode.textColor || 'text-blue-800';
        }
      }
      
      // If it matches the current code being viewed, use its colors
      if (codeName === code.label) {
        codeColor = code.color || 'bg-blue-200';
        textColor = code.textColor || 'text-blue-800';
      }
      
      parts.push(
        <span 
          key={`code-${match.index}`}
          className={`code-palette-unified inline-flex px-2 py-1 rounded-full font-medium text-xs ${codeColor} ${textColor} border border-gray-100 transition-all duration-200 mx-1`}
        >
          {codeName}
        </span>
      );
      
      lastIndex = match.index + match[0].length;
    }
    
    // Add remaining text
    if (lastIndex < text.length) {
      parts.push(text.slice(lastIndex));
    }
    
    return parts.length > 1 ? parts : text;
  };

  // Helper function to render merge strategy in a user-friendly way
  const renderMergeStrategy = (strategy, event) => {
    if (strategy === 'create_new') {
      return (
        <p className="text-xs text-gray-700 mt-1">
          Create new merged code
        </p>
      );
    } else if (strategy.startsWith('merge_into_')) {
      // Extract the target code ID and find the corresponding code
      const targetCodeId = strategy.replace('merge_into_', '');
      let targetCode = null;
      
      // Try to find the target code from sourceCodes or use current code
      if (event?.changes?.sourceCodes && Array.isArray(event.changes.sourceCodes)) {
        targetCode = event.changes.sourceCodes.find(sourceCode => 
          sourceCode && sourceCode.id === targetCodeId
        );
      }
      
      // Fallback to current code if it matches
      if (!targetCode && code && code.id === targetCodeId) {
        targetCode = code;
      }
      
      return (
        <div className="mt-1">
          <span className="text-xs text-gray-700">Merge all into </span>
          {targetCode ? (
            <span className={`code-palette-unified inline-flex px-2 py-1 rounded-full font-medium text-xs ${targetCode.color || 'bg-blue-200'} ${targetCode.textColor || 'text-blue-800'} border border-gray-100 transition-all duration-200 mx-1`}>
              {targetCode.label}
            </span>
          ) : (
            <span className={`code-palette-unified inline-flex px-2 py-1 rounded-full font-medium text-xs bg-blue-200 text-blue-800 border border-gray-100 transition-all duration-200 mx-1`}>
              {targetCodeId.replace(/_/g, ' ').replace(/\b\w/g, l => l.toUpperCase())}
            </span>
          )}
        </div>
      );
    } else {
      // Fallback for unknown strategies
      return (
        <p className="text-xs text-gray-700 mt-1 capitalize">
          {strategy.replace('_', ' ')}
        </p>
      );
    }
  };

  const renderEventChanges = (event) => {
    if (!event || !event.changes) return null;

    try {
      switch (event.type) {
      case 'updated':
        return (
          <div className="mt-3 p-3 bg-gray-50 rounded-md">
            {event.changes.label && (
              <div className="space-y-2">
                <div>
                  <span className="text-xs font-medium text-red-600">From:</span>
                  <div className="mt-1">
                    <span className={`code-palette-unified inline-flex px-3 py-1 rounded-full font-medium text-sm ${event.changes.color?.from || code.color || 'bg-gray-200'} ${event.changes.textColor?.from || code.textColor || 'text-gray-800'} border border-gray-100 transition-all duration-200`}>
                      {event.changes.label.from}
                    </span>
                  </div>
                </div>
                <div>
                  <span className="text-xs font-medium text-green-600">To:</span>
                  <div className="mt-1">
                    <span className={`code-palette-unified inline-flex px-3 py-1 rounded-full font-medium text-sm ${event.changes.color?.to || code.color || 'bg-gray-200'} ${event.changes.textColor?.to || code.textColor || 'text-gray-800'} border border-gray-100 transition-all duration-200`}>
                      {event.changes.label.to}
                    </span>
                  </div>
                </div>
              </div>
            )}
            {event.changes.description && (
              <div className="space-y-2 mt-2">
                <div>
                  <span className="text-xs font-medium text-red-600">Description From:</span>
                  <p className="text-xs text-gray-700 mt-1 bg-white p-2 rounded border">{event.changes.description.from}</p>
                </div>
                <div>
                  <span className="text-xs font-medium text-green-600">Description To:</span>
                  <p className="text-xs text-gray-700 mt-1 bg-white p-2 rounded border">{event.changes.description.to}</p>
                </div>
              </div>
            )}
            {event.changes.color && (
              <div className="mt-2">
                <span className="text-xs font-medium text-purple-600">Color Theme Changed</span>
                <div className="mt-1 flex items-center gap-2">
                  <span className="text-xs text-gray-600">From:</span>
                  <span className={`inline-flex px-2 py-1 rounded text-xs ${event.changes.color.from || 'bg-gray-200'} ${event.changes.textColor?.from || 'text-gray-800'}`}>
                    Sample
                  </span>
                  <span className="text-xs text-gray-600">To:</span>
                  <span className={`inline-flex px-2 py-1 rounded text-xs ${event.changes.color.to || 'bg-gray-200'} ${event.changes.textColor?.to || 'text-gray-800'}`}>
                    Sample
                  </span>
                </div>
              </div>
            )}
          </div>
        );
      
      case 'usage-milestone':
        return (
          <div className="mt-3 p-3 bg-gray-50 rounded-md">
            <div className="space-y-2">
              <div>
                <span className="text-xs font-medium text-yellow-600">Milestone Achieved:</span>
                <p className="text-xs text-gray-700 mt-1 font-medium">
                  {event.changes.milestone} across {event.changes.documentCount} documents
                </p>
              </div>
              <div>
                <span className="text-xs font-medium text-yellow-600">Code:</span>
                <div className="mt-1">
                  <span className={`code-palette-unified inline-flex px-3 py-1 rounded-full font-medium text-sm ${code.color || 'bg-gray-200'} ${code.textColor || 'text-gray-800'} border border-gray-100 transition-all duration-200`}>
                    {code.label}
                  </span>
                </div>
              </div>
            </div>
          </div>
        );
      
      case 'merged':
        return (
          <div className="mt-3 p-3 bg-gray-50 rounded-md">
            <div className="space-y-2">
              {event.changes.strategy && (
                <div>
                  <span className="text-xs font-medium text-orange-600">Strategy:</span>
                  {renderMergeStrategy(event.changes.strategy, event)}
                </div>
              )}
              {event.changes.sourceCodes && Array.isArray(event.changes.sourceCodes) && (
                <div>
                  <span className="text-xs font-medium text-orange-600">Source Codes:</span>
                  <div className="mt-1 space-y-1">
                    {event.changes.sourceCodes.map((source, index) => {
                      // Safety checks for source code data
                      if (!source) return null;
                      return (
                        <div key={source.id || index} className="flex items-center gap-2">
                          <span className={`code-palette-unified inline-flex px-3 py-1 rounded-full font-medium text-sm ${source.color || 'bg-gray-200'} ${source.textColor || 'text-gray-800'} border border-gray-100 transition-all duration-200`}>
                            {source.label || 'Unknown Code'}
                          </span>
                        </div>
                      );
                    })}
                  </div>
                </div>
              )}
              {/* Always show highlight transfer information for merged events */}
              <div>
                <span className="text-xs font-medium text-orange-600">Highlights Transferred:</span>
                <p className="text-xs text-gray-700 mt-1">
                  {event.changes.highlightTransferCount || 0} highlight{(event.changes.highlightTransferCount || 0) !== 1 ? 's' : ''}
                  {(event.changes.highlightTransferCount || 0) === 0 && ' (no highlights to transfer)'}
                </p>
              </div>
              {/* Show reflexive response transfer information for merged events */}
              <div>
                <span className="text-xs font-medium text-orange-600">Reflexive Responses Transferred:</span>
                <p className="text-xs text-gray-700 mt-1">
                  {event.changes.reflexiveResponseTransferCount || 0} reflexive response{(event.changes.reflexiveResponseTransferCount || 0) !== 1 ? 's' : ''}
                  {(event.changes.reflexiveResponseTransferCount || 0) === 0 && ' (no reflexive responses to transfer)'}
                </p>
              </div>
            </div>
          </div>
        );
      
      default:
        return null;
    }
    } catch (error) {
      console.error('Error rendering event changes:', error, event);
      return (
        <div className="mt-3 p-3 bg-red-50 rounded-md">
          <p className="text-xs text-red-600">Error displaying event details</p>
        </div>
      );
    }
  };

  if (loading) {
    return (
      <div className="p-6">
        <div className="mb-6">
          <h3 className="text-lg font-medium text-gray-900 mb-2">Code History</h3>
          <p className="text-sm text-gray-600">
            Complete audit trail of how this code has evolved.
          </p>
        </div>
        
        <div className="text-center py-8">
          <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-blue-600 mx-auto"></div>
          <p className="text-gray-500 text-sm mt-2">Loading history...</p>
        </div>
      </div>
    );
  }

  return (
    <div className="p-6">
      <div className="mb-6">
        <h3 className="text-lg font-medium text-gray-900 mb-2">Code History</h3>
        <p className="text-sm text-gray-600">
          Complete audit trail of how this code has evolved.
        </p>
        
        {/* Special section for deleted codes */}
        {code.isDeleted && (
          <div className="mt-4 p-4 bg-red-50 border border-red-200 rounded-lg">
            <div className="flex items-center gap-3 mb-3">
              <span className="text-red-600">🗑️</span>
              <h4 className="text-sm font-medium text-red-800">This code has been deleted</h4>
              <span className={`code-palette-unified inline-flex px-3 py-1 rounded-full font-medium text-sm ${code.color || 'bg-gray-200'} ${code.textColor || 'text-gray-800'} border border-gray-100 opacity-60`}>
                {code.label}
              </span>
            </div>
            <div className="text-sm text-red-700 space-y-1">
              <p><strong>Deleted:</strong> {formatTimestamp(code.deletedAt)} by {getUserName(code.deletedBy)}</p>
              <p><strong>Reason:</strong> {code.deletionReason || 'No specific reason provided'}</p>
              {code.targetCodeId && (
                <p><strong>Note:</strong> This code was merged into another code as part of a merge operation.</p>
              )}
            </div>
          </div>
        )}
      </div>

      {history.length === 0 ? (
        <div className="text-center py-8">
          <div className="text-gray-400 mb-2">
            <svg className="w-12 h-12 mx-auto" fill="none" stroke="currentColor" viewBox="0 0 24 24">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={1} d="M12 8v4l3 3m6-3a9 9 0 11-18 0 9 9 0 0118 0z" />
            </svg>
          </div>
          <p className="text-gray-500 text-sm">No history yet</p>
          <p className="text-gray-400 text-xs mt-1">
            Changes to this code will appear here
          </p>
        </div>
      ) : (
        <div className="space-y-4">
          {history.map((event, index) => {
            try {
              if (!event || !event.id) {
                console.warn('Invalid event in history:', event);
                return null;
              }
              
              return (
                <div key={event.id} className="relative">
                  {/* Timeline line - extends from center of current icon to center of next icon */}
                  {index < history.length - 1 && (
                    <div className="absolute left-6 top-6 w-0.5 bg-gray-200 z-0" style={{ height: 'calc(100% + 1rem)' }}></div>
                  )}

                  <div className="flex items-start space-x-4 relative z-10">
                    {/* Event icon */}
                    <div className="flex-shrink-0 w-12 h-12 bg-white border-2 border-gray-200 rounded-full flex items-center justify-center relative z-20">
                      <span className="text-lg">{getEventIcon(event.type)}</span>
                    </div>

                    {/* Event content */}
                <div className="flex-1 bg-white border border-gray-200 rounded-lg p-4 shadow-sm">
                  <div className="flex items-center justify-between mb-2">
                    <span className={`inline-flex items-center px-2.5 py-0.5 rounded-full text-xs font-medium ${getEventColor(event.type)}`}>
                      {event.type.charAt(0).toUpperCase() + event.type.slice(1)}
                    </span>
                    <span className="text-xs text-gray-500">{formatTimestamp(event.timestamp)}</span>
                  </div>

                  <div className="flex items-center gap-2 mb-2">
                    <p className="text-sm text-gray-800">{parseAndStyleCodeNames(event.description, event)}</p>
                  </div>
                  
                  <div className="text-xs text-gray-600">
                    <span className="font-medium">By:</span> {getUserName(event.userId)}
                  </div>

                  {/* Show changes if available */}
                  {renderEventChanges(event)}
                </div>
              </div>
            </div>
              );
            } catch (error) {
              console.error('Error rendering history event:', error, event);
              return (
                <div key={event?.id || index} className="relative">
                  <div className="flex items-start space-x-4 relative z-10">
                    <div className="flex-shrink-0 w-12 h-12 bg-red-50 border-2 border-red-200 rounded-full flex items-center justify-center">
                      <span className="text-lg">⚠️</span>
                    </div>
                    <div className="flex-1 bg-red-50 border border-red-200 rounded-lg p-4">
                      <p className="text-sm text-red-600">Error displaying history event</p>
                    </div>
                  </div>
                </div>
              );
            }
          })}
        </div>
      )}

      {/* History stats */}
      {history.length > 0 && (
        <div className="mt-6 p-4 bg-gray-50 rounded-lg">
          <h4 className="text-sm font-medium text-gray-700 mb-2">History Summary</h4>
          <div className="grid grid-cols-2 gap-4 text-sm">
            <div>
              <span className="text-gray-500">Total Events:</span>
              <span className="ml-1 font-medium">{history.length}</span>
            </div>
            <div>
              <span className="text-gray-500">Last Updated:</span>
              <span className="ml-1 font-medium">
                {history.length > 0 ? formatTimestamp(history[0].timestamp) : 'Never'}
              </span>
            </div>
          </div>
        </div>
      )}
    </div>
  );
};

export default function CodeHistoryWrapper(props) {
  return (
    <CodeHistoryErrorBoundary>
      <CodeHistory {...props} />
    </CodeHistoryErrorBoundary>
  );
}
