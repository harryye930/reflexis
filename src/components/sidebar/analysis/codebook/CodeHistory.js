import React, { useState, useEffect } from 'react';
import { appId } from '../../../../constants/index.js';
import { CodeService } from '../../../../services/api/firebase/codeService.js';

// Create code service instance outside component to avoid re-instantiation
const codeService = new CodeService(appId);

const CodeHistory = ({ code, userProfiles }) => {
  const [history, setHistory] = useState([]);
  const [loading, setLoading] = useState(true);

  // Load code history when component mounts or code changes
  useEffect(() => {
    if (!code) {
      setHistory([]);
      setLoading(false);
      return;
    }

    setLoading(true);
    
    // Use code.id as the primary identifier for history
    const codeId = code.id;
    
    const unsubscribe = codeService.onCodeHistorySnapshot(codeId, (historyData) => {
      setHistory(historyData);
      setLoading(false);
    });

    return () => unsubscribe();
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
      default:
        return 'bg-gray-100 text-gray-800';
    }
  };

  const renderEventChanges = (event) => {
    if (!event.changes) return null;

    switch (event.type) {
      case 'updated':
        return (
          <div className="mt-3 p-3 bg-gray-50 rounded-md">
            {event.changes.label && (
              <div className="space-y-2">
                <div>
                  <span className="text-xs font-medium text-red-600">From:</span>
                  <p className="text-xs text-gray-700 mt-1">{event.changes.label.from}</p>
                </div>
                <div>
                  <span className="text-xs font-medium text-green-600">To:</span>
                  <p className="text-xs text-gray-700 mt-1">{event.changes.label.to}</p>
                </div>
              </div>
            )}
            {event.changes.description && (
              <div className="space-y-2 mt-2">
                <div>
                  <span className="text-xs font-medium text-red-600">Description From:</span>
                  <p className="text-xs text-gray-700 mt-1">{event.changes.description.from}</p>
                </div>
                <div>
                  <span className="text-xs font-medium text-green-600">Description To:</span>
                  <p className="text-xs text-gray-700 mt-1">{event.changes.description.to}</p>
                </div>
              </div>
            )}
            {event.changes.color && (
              <div className="mt-2">
                <span className="text-xs font-medium text-purple-600">Color changed</span>
              </div>
            )}
          </div>
        );
      
      case 'applied':
        return (
          <div className="mt-3 p-3 bg-gray-50 rounded-md">
            <div>
              <span className="text-xs font-medium text-purple-600">Document:</span>
              <p className="text-xs text-gray-700 mt-1">{event.changes.documentTitle}</p>
            </div>
          </div>
        );
      
      case 'usage-milestone':
        return (
          <div className="mt-3 p-3 bg-gray-50 rounded-md">
            <div>
              <span className="text-xs font-medium text-yellow-600">Milestone:</span>
              <p className="text-xs text-gray-700 mt-1">
                {event.changes.milestone} across {event.changes.documentCount} documents
              </p>
            </div>
          </div>
        );
      
      default:
        return null;
    }
  };

  if (loading) {
    return (
      <div className="p-6">
        <div className="mb-6">
          <h3 className="text-lg font-medium text-gray-900 mb-2">Code History</h3>
          <p className="text-sm text-gray-600">
            Complete audit trail of how this code has evolved. Answers &ldquo;When and why did we change this?&rdquo;
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
          Complete audit trail of how this code has evolved. Answers &ldquo;When and why did we change this?&rdquo;
        </p>
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
          {history.map((event, index) => (
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

                  <p className="text-sm text-gray-800 mb-2">{event.description}</p>
                  
                  <div className="text-xs text-gray-600">
                    <span className="font-medium">By:</span> {getUserName(event.userId)}
                  </div>

                  {/* Show changes if available */}
                  {renderEventChanges(event)}
                </div>
              </div>
            </div>
          ))}
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

export default CodeHistory;
