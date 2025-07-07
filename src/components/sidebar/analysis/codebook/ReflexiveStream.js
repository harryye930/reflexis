import React, { useState } from 'react';

const ReflexiveStream = ({ 
  responses, 
  currentUser, 
  userProfiles, 
  loading 
}) => {
  const [filterUser, setFilterUser] = useState('all');

  const formatTimestamp = (timestamp) => {
    const date = timestamp instanceof Date ? timestamp : new Date(timestamp);
    return date.toLocaleDateString() + ' ' + date.toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' });
  };

  const getUserName = (userId) => {
    if (currentUser && userId === currentUser.uid) {
      return userProfiles[userId]?.name ? `${userProfiles[userId].name} (you)` : 'You';
    }
    return userProfiles[userId]?.name || 'Unknown User';
  };

  const getUserPositionality = (userId) => {
    return userProfiles[userId]?.positionality || 'Not specified';
  };

  // Get unique users for filter
  const uniqueUsers = [...new Set(responses.map(r => r.userId))];
  const filteredResponses = filterUser === 'all' 
    ? responses 
    : responses.filter(r => r.userId === filterUser);

  const sortedResponses = [...filteredResponses].sort((a, b) => new Date(b.createdAt) - new Date(a.createdAt));

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

      {/* Reflexive Stream */}
      <div className="space-y-4">
        {sortedResponses.length === 0 ? (
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
          sortedResponses.map((response) => (
            <div key={response.id} className="bg-white border border-gray-200 rounded-lg p-4 shadow-sm">
              {/* Response Content */}
              <div className="mb-3">
                <blockquote className="text-sm text-gray-800 leading-relaxed border-l-4 border-blue-200 pl-4 italic">
                  &ldquo;{response.response}&rdquo;
                </blockquote>
              </div>

              {/* Metadata */}
              <div className="flex items-center justify-between text-xs text-gray-500">
                <div className="flex items-center space-x-3">
                  <span className="font-medium text-gray-700">
                    {getUserName(response.userId)}
                  </span>
                  <span>
                    Positionality: {getUserPositionality(response.userId)}
                  </span>
                </div>
                <span>{formatTimestamp(response.createdAt)}</span>
              </div>

              {/* Prompt Context */}
              <div className="mt-2 text-xs text-gray-400">
                <span className="font-medium">Question:</span> {response.prompt}
              </div>

              {/* Source Link */}
              <div className="mt-3 flex items-center justify-between">
                <div className="text-xs text-gray-600">
                  <span className="font-medium">Source:</span> &ldquo;{response.sourceText?.substring(0, 80)}...&rdquo;
                </div>
                <button className="text-xs text-blue-600 hover:text-blue-800 font-medium">
                  View Source
                </button>
              </div>
            </div>
          ))
        )}
      </div>

      {/* Summary Stats */}
      {sortedResponses.length > 0 && (
        <div className="mt-6 p-4 bg-gray-50 rounded-lg">
          <h4 className="text-sm font-medium text-gray-700 mb-2">Stream Summary</h4>
          <div className="grid grid-cols-3 gap-4 text-sm">
            <div>
              <span className="text-gray-500">Total Responses:</span>
              <span className="ml-1 font-medium">{responses.length}</span>
            </div>
            <div>
              <span className="text-gray-500">Contributors:</span>
              <span className="ml-1 font-medium">{uniqueUsers.length}</span>
            </div>
            <div>
              <span className="text-gray-500">Recent Activity:</span>
              <span className="ml-1 font-medium">
                {responses.filter(r => new Date() - new Date(r.createdAt) < 7 * 24 * 60 * 60 * 1000).length} this week
              </span>
            </div>
          </div>
        </div>
      )}
    </div>
  );
};

export default ReflexiveStream;
