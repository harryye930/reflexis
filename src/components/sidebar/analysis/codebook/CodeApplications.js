import React, { useState, useEffect } from 'react';
import { collection, query, where, onSnapshot } from 'firebase/firestore';
import { db } from '../../../../lib/firebase.js';
import { getUserDisplayName } from '../../../../lib/utils/hoverUtils.js';

const CodeApplications = ({ projectId, code, userProfiles, onNavigateToHighlight }) => {
  const [highlights, setHighlights] = useState([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);

  useEffect(() => {
    if (!projectId || !code?.id) {
      setHighlights([]);
      setLoading(false);
      return;
    }

    setLoading(true);
    setError(null);

    // Listen to highlights for this specific code
    const highlightsCollection = collection(db, `projects/${projectId}/highlights`);
    const highlightsQuery = query(highlightsCollection, where('code', '==', code.id));
    
    const unsubscribe = onSnapshot(highlightsQuery, 
      (snapshot) => {
        try {
          const highlightsData = snapshot.docs.map(doc => ({ 
            id: doc.id, 
            ...doc.data() 
          }));
          
          // Sort by creation time (newest first)
          const sortedHighlights = highlightsData.sort((a, b) => {
            const aTime = a.createdAt?.toDate?.() || new Date(0);
            const bTime = b.createdAt?.toDate?.() || new Date(0);
            return bTime - aTime;
          });
          
          setHighlights(sortedHighlights);
          setLoading(false);
        } catch (err) {
          console.error('Error processing highlights:', err);
          setError('Failed to load highlights');
          setLoading(false);
        }
      },
      (err) => {
        console.error('Error listening to highlights:', err);
        setError('Failed to load highlights');
        setLoading(false);
      }
    );

    return () => unsubscribe();
  }, [projectId, code?.id]);

  const formatTimestamp = (timestamp) => {
    if (!timestamp) return 'Unknown time';
    
    try {
      const date = timestamp.toDate ? timestamp.toDate() : new Date(timestamp);
      const now = new Date();
      const diffInMs = now - date;
      const diffInHours = diffInMs / (1000 * 60 * 60);
      const diffInDays = diffInMs / (1000 * 60 * 60 * 24);

      if (diffInHours < 1) {
        const minutes = Math.floor(diffInMs / (1000 * 60));
        return `${minutes}m ago`;
      } else if (diffInHours < 24) {
        const hours = Math.floor(diffInHours);
        return `${hours}h ago`;
      } else if (diffInDays < 7) {
        const days = Math.floor(diffInDays);
        return `${days}d ago`;
      } else {
        return date.toLocaleDateString('en-US', { 
          month: 'short', 
          day: 'numeric',
          year: date.getFullYear() !== now.getFullYear() ? 'numeric' : undefined
        });
      }
    } catch (error) {
      console.error('Error formatting timestamp:', error);
      return 'Unknown time';
    }
  };

  const getUserName = (userId) => {
    const profile = userProfiles[userId];
    return getUserDisplayName(profile, true, null, userId) || 'Unknown User';
  };

  const truncateText = (text, maxLength = 120) => {
    if (!text || text.length <= maxLength) return text;
    return text.substring(0, maxLength) + '...';
  };

  const handleHighlightClick = (highlight) => {
    if (onNavigateToHighlight) {
      onNavigateToHighlight(highlight.documentId, highlight.id);
    }
  };

  if (loading) {
    return (
      <div className="px-6 py-4 border-b border-gray-200">
        <h3 className="text-sm font-medium text-gray-700 mb-3">Applied Text</h3>
        <div className="flex items-center justify-center py-8">
          <div className="animate-spin rounded-full h-6 w-6 border-b-2 border-blue-500"></div>
          <span className="ml-2 text-sm text-gray-500">Loading applications...</span>
        </div>
      </div>
    );
  }

  if (error) {
    return (
      <div className="px-6 py-4 border-b border-gray-200">
        <h3 className="text-sm font-medium text-gray-700 mb-3">Applied Text</h3>
        <div className="text-center py-6">
          <p className="text-sm text-red-600">{error}</p>
        </div>
      </div>
    );
  }

  if (highlights.length === 0) {
    return (
      <div className="px-6 py-4 border-b border-gray-200">
        <h3 className="text-sm font-medium text-gray-700 mb-3">Applied Text</h3>
        <div className="text-center py-6">
          <p className="text-sm text-gray-500">No text has been coded with &ldquo;{code.label}&rdquo; yet.</p>
        </div>
      </div>
    );
  }

  return (
    <div className="px-6 py-4 border-b border-gray-200">
      <h3 className="text-sm font-medium text-gray-700 mb-3">
        Applied Text ({highlights.length})
      </h3>
      
      <div className="max-h-80 overflow-y-auto space-y-3">
        {highlights.map((highlight) => (
          <div
            key={highlight.id}
            onClick={() => handleHighlightClick(highlight)}
            className="p-3 bg-gray-50 hover:bg-gray-100 rounded-lg border border-gray-200 cursor-pointer transition-colors group"
          >
            {/* Header with user and time */}
            <div className="flex items-center justify-between mb-2">
              <div className="flex items-center space-x-2">
                <span className="text-xs font-medium text-gray-700">
                  {getUserName(highlight.userId)}
                </span>
                {highlight.documentTitle && (
                  <>
                    <span className="text-xs text-gray-400">•</span>
                    <span className="text-xs text-gray-600 truncate max-w-32">
                      {highlight.documentTitle}
                    </span>
                  </>
                )}
              </div>
              <span className="text-xs text-gray-500">
                {formatTimestamp(highlight.createdAt)}
              </span>
            </div>
            
            {/* Highlighted text */}
            <div className="text-sm text-gray-800 leading-relaxed">
              &ldquo;{truncateText(highlight.text)}&rdquo;
            </div>
            
            {/* View source indicator */}
            <div className="mt-2 opacity-0 group-hover:opacity-100 transition-opacity">
              <span className="text-xs text-blue-600 font-medium">
                Click to view in document →
              </span>
            </div>
          </div>
        ))}
      </div>
    </div>
  );
};

export default CodeApplications;
