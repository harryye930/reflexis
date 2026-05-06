import React from 'react';
import { BarChart, Warning, Delete, History, GpsFixed, Edit, Label, MergeType, CallSplit } from '@mui/icons-material';
import CodeChip from '../../../../../common/CodeChip.js';

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
            <div className="flex items-center justify-between mb-4">
              <div>
                <h3 className="text-lg font-medium text-gray-900 mb-2">Code History</h3>
              </div>
              <button
                type="button"
                onClick={this.props.onOpenProjectHistory}
                className="inline-flex items-center px-3 py-2 bg-blue-600 hover:bg-blue-700 text-white text-sm font-medium rounded-lg transition-colors duration-200 ml-4"
              >
                <BarChart sx={{ fontSize: 16, marginRight: 1 }} />
                Full History Graph
              </button>
            </div>
          </div>
          <div className="bg-red-50 border border-red-200 rounded-lg p-4">
            <div className="flex items-center gap-2 mb-2">
              <Warning sx={{ fontSize: 18, color: '#dc2626' }} />
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

const CodeHistory = ({ code, userProfiles, history = [], loading = false, onOpenProjectHistory }) => {
  // Remove internal state management since data is now passed as props
  // const [history, setHistory] = useState([]);
  // const [loading, setLoading] = useState(true);
  // const prevCodeIdRef = useRef(null);

  // Remove the useEffect for loading data since it's now handled by parent
  /*
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
      const unsubscribe = codeService.onCodeHistorySnapshot(currentCodeId, (historyData) => {
        setHistory(historyData);
        setLoading(false);
      });

      return () => {
        unsubscribe();
      };
    } catch (error) {
      console.error('CodeHistory: Error setting up listener:', error);
      setHistory([]);
      setLoading(false);
    }
  }, [code]);
  */

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
      case 'create':
        return <GpsFixed sx={{ fontSize: 16 }} />;
      case 'update':
        return <Edit sx={{ fontSize: 16 }} />;
      case 'delete':
        return <Delete sx={{ fontSize: 16 }} />;
      case 'apply':
        return <Label sx={{ fontSize: 16 }} />;
      case 'merge':
        return <MergeType sx={{ fontSize: 16 }} />;
      case 'merge_and_delete':
        return <MergeType sx={{ fontSize: 16 }} />;
      case 'split':
        return <CallSplit sx={{ fontSize: 16 }} />;
      case 'split_and_delete':
        return <CallSplit sx={{ fontSize: 16 }} />;
      default:
        return <Edit sx={{ fontSize: 16 }} />;
    }
  };

  const getEventColor = (type) => {
    switch (type) {
  case 'create':
        return 'bg-green-100 text-green-800';
  case 'update':
        return 'bg-blue-100 text-blue-800';
  case 'delete':
        return 'bg-red-100 text-red-800';
  case 'apply':
        return 'bg-purple-100 text-purple-800';
  case 'merge':
        return 'bg-orange-100 text-orange-800';
      case 'merge_and_delete':
        return 'bg-orange-100 text-orange-800';
      case 'split':
        return 'bg-orange-100 text-orange-800';
      case 'split_and_delete':
        return 'bg-orange-100 text-orange-800';
      default:
        return 'bg-gray-100 text-gray-800';
    }
  };

  const formatTypeLabel = (type) => {
    if (type === 'merge_and_delete') return 'Merge and Delete';
    if (type === 'split_and_delete') return 'Split and Delete';
    return type.charAt(0).toUpperCase() + type.slice(1);
  };

  // Helper function to parse and style code names in text
  const parseAndStyleCodeNames = (text, event = null) => {
    if (!text) return text;
    
    // For split events, handle the special pattern "split into X codes: code1, code2, ..."
  if (event?.type === 'split' || event?.type === 'split_and_delete') {
      const splitPattern = /split into \d+ codes: (.+)$/;
      const splitMatch = text.match(splitPattern);
      
      if (splitMatch) {
        const codeNames = splitMatch[1].split(', ').map(name => name.trim());
        const beforeSplit = text.substring(0, splitMatch.index + "split into ".length + splitMatch[0].match(/\d+/)[0].length + " codes: ".length);
        
        const codeChips = codeNames.map((codeName, index) => {
          // Find the matching target code for colors
          let targetCode = null;
          if (event?.changes?.targetCodes && Array.isArray(event.changes.targetCodes)) {
            targetCode = event.changes.targetCodes.find(target => target && target.label === codeName);
          }
          
          return (
            <React.Fragment key={`split-code-${index}`}>
              <CodeChip 
                code={targetCode || { 
                  label: codeName, 
                  color: 'bg-gray-200',
                  textColor: 'text-gray-800'
                }}
                size="xs"
                className="mx-1"
              />
              {index < codeNames.length - 1 && <span>, </span>}
            </React.Fragment>
          );
        });
        
        return (
          <>
            {beforeSplit}
            {codeChips}
          </>
        );
      }
    }
    
  // For apply events, we only want to style the code name, not document titles
  // The format is: Code "CodeName" applied to text in "DocumentTitle"
  if (event?.type === 'apply') {
      // Only style the first quoted item (which should be the code name)
      const codeNameMatch = text.match(/Code "([^"]+)"/);
      if (codeNameMatch) {
        const codeName = codeNameMatch[1];
        let codeColor = null;
        let textColor = null;
        
        // First check if it matches the result/target code from a merge operation
        if (event?.changes?.resultConfig && event.changes.resultConfig.label === codeName) {
          codeColor = event.changes.resultConfig.color;
          textColor = event.changes.resultConfig.textColor;
        }
        // If it matches the current code being viewed, use its colors
        else if (codeName === code.label) {
          codeColor = code.color;
          textColor = code.textColor;
        }
        
        // Split the text and create JSX elements
        const beforeCode = text.substring(0, text.indexOf(`"${codeName}"`));
        const afterCode = text.substring(text.indexOf(`"${codeName}"`) + codeName.length + 2);
        
        return (
          <>
            {beforeCode}
            <CodeChip 
              code={{ 
                label: codeName, 
                color: codeColor,
                textColor: textColor
              }}
              size="xs"
              className="mx-1"
            />
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
      
      // Try to find the actual code colors
      let codeColor = null;
      let textColor = null;
      
      // First check if it matches the result/target code from a merge operation
      if (event?.changes?.resultConfig && event.changes.resultConfig.label === codeName) {
        codeColor = event.changes.resultConfig.color;
        textColor = event.changes.resultConfig.textColor;
      }
      // Then check source codes from merge operations
      else if (event?.changes?.sourceCodes && Array.isArray(event.changes.sourceCodes)) {
        const matchingCode = event.changes.sourceCodes.find(sourceCode => 
          sourceCode && sourceCode.label === codeName
        );
        if (matchingCode) {
          codeColor = matchingCode.color;
          textColor = matchingCode.textColor;
        }
      }
      // Check source code from split operations (for receiver codes)
      else if (event?.changes?.sourceCode && event.changes.sourceCode.label === codeName) {
        codeColor = event.changes.sourceCode.color;
        textColor = event.changes.sourceCode.textColor;
      }
      // Check target codes from split operations (for giver codes) 
      else if (event?.changes?.targetCodes && Array.isArray(event.changes.targetCodes)) {
        const matchingCode = event.changes.targetCodes.find(targetCode => 
          targetCode && targetCode.label === codeName
        );
        if (matchingCode) {
          codeColor = matchingCode.color;
          textColor = matchingCode.textColor;
        }
      }
      
      // If it matches the current code being viewed, use its colors
      if (codeName === code.label) {
        codeColor = code.color;
        textColor = code.textColor;
      }
      
      parts.push(
        <CodeChip 
          key={`code-${match.index}`}
          code={{ 
            label: codeName, 
            color: codeColor,
            textColor: textColor
          }}
          size="xs"
          className="mx-1"
        />
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
            <CodeChip 
              code={targetCode}
              size="xs"
              className="mx-1"
            />
          ) : (
            <CodeChip 
              code={{ 
                label: targetCodeId.replace(/_/g, ' ').replace(/\b\w/g, l => l.toUpperCase())
              }}
              size="xs"
              className="mx-1"
            />
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

  const getColorClass = (colorChange, fallback) => (
    typeof colorChange === 'string' ? colorChange : colorChange?.bg || fallback
  );

  const getTextColorClass = (colorChange, fallback) => (
    typeof colorChange === 'string' ? fallback : colorChange?.text || fallback
  );

  const renderEventChanges = (event) => {
    if (!event || !event.changes) return null;

    try {
      switch (event.type) {
  case 'update':
        return (
          <div className="mt-3 p-3 bg-gray-50 rounded-md">
            {event.changes.label && (
              <div className="space-y-2">
                <div>
                  <span className="text-xs font-medium text-red-600">From:</span>
                  <div className="mt-1">
                    <CodeChip 
                      code={{
                        label: event.changes.label.from,
                        color: getColorClass(event.changes.color?.from, code.color),
                        textColor: getTextColorClass(event.changes.color?.from, code.textColor)
                      }}
                      size="md"
                    />
                  </div>
                </div>
                <div>
                  <span className="text-xs font-medium text-green-600">To:</span>
                  <div className="mt-1">
                    <CodeChip 
                      code={{
                        label: event.changes.label.to,
                        color: getColorClass(event.changes.color?.to, code.color),
                        textColor: getTextColorClass(event.changes.color?.to, code.textColor)
                      }}
                      size="md"
                    />
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
                  <span className={`inline-flex px-2 py-1 rounded text-xs ${getColorClass(event.changes.color.from, code.color)} ${getTextColorClass(event.changes.color.from, code.textColor)}`}>
                    Sample
                  </span>
                  <span className="text-xs text-gray-600">To:</span>
                  <span className={`inline-flex px-2 py-1 rounded text-xs ${getColorClass(event.changes.color.to, code.color)} ${getTextColorClass(event.changes.color.to, code.textColor)}`}>
                    Sample
                  </span>
                </div>
              </div>
            )}
          </div>
        );
      
  case 'merge':
  case 'merge_and_delete':
        return (
          <div className="mt-3 p-3 bg-gray-50 rounded-md">
            <div className="space-y-2">
              {event.changes.strategy && (
                <div>
                  <span className="text-xs font-medium text-orange-600">Strategy:</span>
                  {renderMergeStrategy(event.changes.strategy, event)}
                </div>
              )}
              {/* For source-side merged events, show the destination */}
              {event.changes.targetCode && (
                <div>
                  <span className="text-xs font-medium text-orange-600">Merged Into:</span>
                  <div className="mt-1">
                    <CodeChip 
                      code={event.changes.targetCode}
                      size="md"
                      variant="unified"
                    />
                  </div>
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
                          <CodeChip 
                            code={source}  // Pass source code directly
                            size="md"
                            variant="unified"
                          />
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
      
  case 'split':
  case 'split_and_delete':
        return (
          <div className="mt-3 p-3 bg-gray-50 rounded-md">
            <div className="space-y-2">
              {/* Show source code for receiver codes (split operation) */}
              {event.changes.sourceCode && event.changes.splitOperation && (
                <div>
                  <span className="text-xs font-medium text-orange-600">Received From:</span>
                  <div className="mt-1">
                    <CodeChip 
                      code={event.changes.sourceCode}  // Pass source code directly
                      size="md"
                      variant="unified"
                    />
                  </div>
                </div>
              )}
              {/* Show target codes for giver codes (split operation) */}
              {event.changes.targetCodes && Array.isArray(event.changes.targetCodes) && (
                <div>
                  <span className="text-xs font-medium text-orange-600">Split Into:</span>
                  <div className="mt-1 space-y-1">
                    {event.changes.targetCodes.map((target, index) => {
                      // Safety checks for target code data
                      if (!target) return null;
                      return (
                        <div key={target.id || index} className="flex items-center gap-2">
                          <CodeChip 
                            code={target}  // Pass target code directly
                            size="md"
                            variant="unified"
                          />
                        </div>
                      );
                    })}
                  </div>
                </div>
              )}
              {/* Show highlight information */}
              <div>
                <span className="text-xs font-medium text-orange-600">
                  {event.changes.splitOperation ? 'Highlights Received:' : 'Highlights Reassigned:'}
                </span>
                <p className="text-xs text-gray-700 mt-1">
                  {event.changes.highlightsReceived || event.changes.highlightTransferCount || 0} highlight{((event.changes.highlightsReceived || event.changes.highlightTransferCount || 0) !== 1) ? 's' : ''} 
                  {event.changes.splitOperation ? ' received' : ' reassigned'}
                  {((event.changes.highlightsReceived || event.changes.highlightTransferCount || 0) === 0) && (event.changes.splitOperation ? ' (no highlights received)' : ' (no highlights to reassign)')}
                </p>
              </div>
              {/* Show reflexive information if present */}
              {(event.changes.reflexiveResponseTransferCount != null || event.changes.reflexiveResponsesReceived != null) && (
                <div>
                  <span className="text-xs font-medium text-orange-600">
                    {event.changes.splitOperation ? 'Reflexive Responses Received:' : 'Reflexive Responses Transferred:'}
                  </span>
                  <p className="text-xs text-gray-700 mt-1">
                    {(event.changes.reflexiveResponsesReceived != null ? event.changes.reflexiveResponsesReceived : (event.changes.reflexiveResponseTransferCount || 0))} reflexive response{((event.changes.reflexiveResponsesReceived != null ? event.changes.reflexiveResponsesReceived : (event.changes.reflexiveResponseTransferCount || 0)) !== 1) ? 's' : ''}
                    {((event.changes.reflexiveResponsesReceived != null ? event.changes.reflexiveResponsesReceived : (event.changes.reflexiveResponseTransferCount || 0)) === 0) && (event.changes.splitOperation ? ' (no reflexive responses received)' : ' (no reflexive responses to transfer)')}
                  </p>
                </div>
              )}
              {/* Show if original code was deleted */}
              {event.changes.codeDeleted && (
                <div>
                  <span className="text-xs font-medium text-red-600">Original Code:</span>
                  <p className="text-xs text-gray-700 mt-1">
                    Original code was deleted after split
                  </p>
                </div>
              )}
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
          <div className="flex items-center justify-between mb-4">
            <div>
              <h3 className="text-lg font-medium text-gray-900 mb-2">Code History</h3>
              <p className="text-sm text-gray-600">
                Complete audit trail of how this code has evolved.
              </p>
            </div>
            <button
              type="button"
              onClick={onOpenProjectHistory}
              className="inline-flex items-center px-3 py-2 bg-blue-600 hover:bg-blue-700 text-white text-sm font-medium rounded-lg transition-colors duration-200 ml-4"
            >
              <BarChart sx={{ fontSize: 16, marginRight: 1 }} />
              Full History Graph
            </button>
          </div>
          <p className="text-xs text-gray-500 mb-4">Chronological, connected view of code evolution (merge/split included).</p>
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
        <div className="flex items-center justify-between mb-4">
          <div>
            <h3 className="text-lg font-medium text-gray-900 mb-2">Code History</h3>
            <p className="text-sm text-gray-600">
              Complete audit trail of how this code has evolved.
            </p>
          </div>
          <button
            type="button"
            onClick={onOpenProjectHistory}
            className="inline-flex items-center px-3 py-2 bg-blue-600 hover:bg-blue-700 text-white text-sm font-medium rounded-lg transition-colors duration-200 ml-4"
          >
            <BarChart sx={{ fontSize: 16, marginRight: 1 }} />
            Full History Graph
          </button>
        </div>
        <p className="text-xs text-gray-500 mb-4">Chronological, connected view of code evolution (merge/split included).</p>
        
        {/* Special section for deleted codes */}
        {code.isDeleted && (
          <div className="mt-4 p-4 bg-red-50 border border-red-200 rounded-lg">
            <div className="flex items-center gap-3 mb-3">
              <Delete sx={{ fontSize: 18, color: '#dc2626' }} />
              <h4 className="text-sm font-medium text-red-800">This code has been deleted</h4>
              <CodeChip 
                code={code}  // Pass code directly
                size="md"
                variant="unified"
                opacity={0.6}
              />
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
            <History sx={{ fontSize: 48, margin: '0 auto', display: 'block' }} />
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
                      {getEventIcon(event.type)}
                    </div>

                    {/* Event content */}
                <div className="flex-1 bg-white border border-gray-200 rounded-lg p-4 shadow-sm">
                  <div className="flex items-center justify-between mb-2">
                    <span className={`inline-flex items-center px-2.5 py-0.5 rounded-full text-xs font-medium ${getEventColor(event.type)}`}>
                      {formatTypeLabel(event.type)}
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
                      <Warning sx={{ fontSize: 18, color: '#dc2626' }} />
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
    <CodeHistoryErrorBoundary onOpenProjectHistory={props.onOpenProjectHistory}>
      <CodeHistory {...props} />
    </CodeHistoryErrorBoundary>
  );
}
