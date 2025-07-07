import React from 'react';

const CodeHistory = ({ code }) => {
  // Mock history data - in real implementation this would track actual changes
  const mockHistory = [
    {
      id: 'h1',
      type: 'created',
      timestamp: '2024-10-20T10:00:00Z',
      user: 'System',
      description: 'Code created as part of default set',
      changes: null
    },
    {
      id: 'h2',
      type: 'definition-updated',
      timestamp: '2024-10-22T14:30:00Z',
      user: 'Dr. Sarah Wilson',
      description: 'Updated definition to emphasize economic barriers',
      changes: {
        from: 'The gap in access to technology between different groups',
        to: 'The gap in access to and use of information and communication technologies, primarily due to economic and geographic barriers'
      }
    },
    {
      id: 'h3',
      type: 'link-created',
      timestamp: '2024-10-24T09:15:00Z',
      user: 'Michael Chen',
      description: 'Linked to "Socioeconomic Status" code',
      changes: {
        linkedCode: 'Socioeconomic Status',
        relationship: 'frequently co-occurs'
      }
    },
    {
      id: 'h4',
      type: 'usage-milestone',
      timestamp: '2024-10-25T16:45:00Z',
      user: 'System',
      description: 'Reached 50 applications across documents',
      changes: {
        milestone: '50 applications',
        documents: 12
      }
    }
  ];

  const formatTimestamp = (timestamp) => {
    const date = new Date(timestamp);
    return date.toLocaleDateString() + ' ' + date.toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' });
  };

  const getEventIcon = (type) => {
    switch (type) {
      case 'created':
        return '🎯';
      case 'definition-updated':
        return '✏️';
      case 'link-created':
        return '🔗';
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
      case 'definition-updated':
        return 'bg-blue-100 text-blue-800';
      case 'link-created':
        return 'bg-purple-100 text-purple-800';
      case 'usage-milestone':
        return 'bg-yellow-100 text-yellow-800';
      default:
        return 'bg-gray-100 text-gray-800';
    }
  };

  return (
    <div className="p-6">
      <div className="mb-6">
        <h3 className="text-lg font-medium text-gray-900 mb-2">Code History</h3>
        <p className="text-sm text-gray-600">
          Complete audit trail of how this code has evolved. Answers &ldquo;When and why did we change this?&rdquo;
        </p>
      </div>

      {mockHistory.length === 0 ? (
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
          {mockHistory.map((event, index) => (
            <div key={event.id} className="relative">
              {/* Timeline line */}
              {index < mockHistory.length - 1 && (
                <div className="absolute left-6 top-12 w-0.5 h-12 bg-gray-200"></div>
              )}

              <div className="flex items-start space-x-4">
                {/* Event icon */}
                <div className="flex-shrink-0 w-12 h-12 bg-white border-2 border-gray-200 rounded-full flex items-center justify-center">
                  <span className="text-lg">{getEventIcon(event.type)}</span>
                </div>

                {/* Event content */}
                <div className="flex-1 bg-white border border-gray-200 rounded-lg p-4 shadow-sm">
                  <div className="flex items-center justify-between mb-2">
                    <span className={`inline-flex items-center px-2.5 py-0.5 rounded-full text-xs font-medium ${getEventColor(event.type)}`}>
                      {event.type.replace('-', ' ').replace(/\b\w/g, l => l.toUpperCase())}
                    </span>
                    <span className="text-xs text-gray-500">{formatTimestamp(event.timestamp)}</span>
                  </div>

                  <p className="text-sm text-gray-800 mb-2">{event.description}</p>
                  
                  <div className="text-xs text-gray-600">
                    <span className="font-medium">By:</span> {event.user}
                  </div>

                  {/* Show changes if available */}
                  {event.changes && (
                    <div className="mt-3 p-3 bg-gray-50 rounded-md">
                      {event.type === 'definition-updated' && (
                        <div className="space-y-2">
                          <div>
                            <span className="text-xs font-medium text-red-600">From:</span>
                            <p className="text-xs text-gray-700 mt-1">{event.changes.from}</p>
                          </div>
                          <div>
                            <span className="text-xs font-medium text-green-600">To:</span>
                            <p className="text-xs text-gray-700 mt-1">{event.changes.to}</p>
                          </div>
                        </div>
                      )}
                      {event.type === 'link-created' && (
                        <div>
                          <span className="text-xs font-medium text-purple-600">Linked Code:</span>
                          <p className="text-xs text-gray-700 mt-1">{event.changes.linkedCode} ({event.changes.relationship})</p>
                        </div>
                      )}
                      {event.type === 'usage-milestone' && (
                        <div>
                          <span className="text-xs font-medium text-yellow-600">Milestone:</span>
                          <p className="text-xs text-gray-700 mt-1">{event.changes.milestone} across {event.changes.documents} documents</p>
                        </div>
                      )}
                    </div>
                  )}
                </div>
              </div>
            </div>
          ))}
        </div>
      )}

      {/* History stats */}
      {mockHistory.length > 0 && (
        <div className="mt-6 p-4 bg-gray-50 rounded-lg">
          <h4 className="text-sm font-medium text-gray-700 mb-2">History Summary</h4>
          <div className="grid grid-cols-2 gap-4 text-sm">
            <div>
              <span className="text-gray-500">Total Events:</span>
              <span className="ml-1 font-medium">{mockHistory.length}</span>
            </div>
            <div>
              <span className="text-gray-500">Last Updated:</span>
              <span className="ml-1 font-medium">
                {formatTimestamp(mockHistory[0].timestamp)}
              </span>
            </div>
          </div>
        </div>
      )}
    </div>
  );
};

export default CodeHistory;
