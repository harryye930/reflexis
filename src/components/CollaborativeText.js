import { useState, useEffect, useRef } from 'react';
import { db, auth } from '../lib/firebase';
import { collection, onSnapshot, addDoc, deleteDoc, doc, query, setDoc, getDocs, getDoc } from 'firebase/firestore';
import { signInAnonymously, onAuthStateChanged } from 'firebase/auth';

const appId = 'scholarmate-collab';

const availableCodes = [
  { id: 'key_insight', label: 'Key Insight', color: 'bg-blue-200', textColor: 'text-blue-800' },
  { id: 'question', label: 'Question', color: 'bg-yellow-200', textColor: 'text-yellow-800' },
  { id: 'agreement', label: 'Agreement', color: 'bg-green-200', textColor: 'text-green-800' },
  { id: 'disagreement', label: 'Disagreement', color: 'bg-red-200', textColor: 'text-red-800' },
  { id: 'important_quote', label: 'Important Quote', color: 'bg-purple-200', textColor: 'text-purple-800' }
];

const userColors = ['#fdba74', '#6ee7b7', '#93c5fd', '#f9a8d4', '#c4b5fd', '#fde047'];

const sourceText = `The rise of remote work has fundamentally altered the landscape of modern business operations. A recent study indicates that over 60% of companies plan to maintain some form of remote work policy post-pandemic, citing benefits such as increased employee satisfaction and reduced overhead costs. However, this shift is not without its challenges. Managers often express concerns about maintaining a cohesive company culture and ensuring equitable opportunities for career advancement among remote and in-office employees. Another key area of discussion revolves around cybersecurity. With employees accessing company data from various networks, the risk of security breaches has escalated, prompting significant investment in new security protocols and employee training programs. Furthermore, the long-term psychological effects of reduced social interaction in a professional setting are still not fully understood, representing a critical area for future research. The digital divide also presents a significant hurdle, as not all employees have access to reliable high-speed internet, potentially creating a new form of workplace inequality. Addressing these multifaceted issues requires a proactive and adaptable approach from leadership.`;

export default function CollaborativeText() {
  const [highlights, setHighlights] = useState([]);
  const [currentUser, setCurrentUser] = useState(null);
  const [currentSelection, setCurrentSelection] = useState(null);
  const [modalPosition, setModalPosition] = useState({ x: 0, y: 0 });
  const [showModal, setShowModal] = useState(false);
  const [userProfiles, setUserProfiles] = useState({});
  const [userProfilesLoaded, setUserProfilesLoaded] = useState(false);
  const [message, setMessage] = useState({ text: '', isError: false, show: false });
  const [loading, setLoading] = useState(true);
  
  const textContainerRef = useRef(null);

  // Authentication effect
  useEffect(() => {
    const unsubscribe = onAuthStateChanged(auth, async user => {
      if (user) {
        try {
          // Check if user document already exists to avoid overwriting existing data
          const userDocRef = doc(db, `artifacts/${appId}/public/data/users`, user.uid);
          const userDoc = await getDoc(userDocRef);
          
          if (!userDoc.exists()) {
            // Only create new user document if it doesn't exist
            const randomColor = userColors[Math.floor(Math.random() * userColors.length)];
            const randomName = `User-${user.uid.substring(0, 4)}`;
            await setDoc(userDocRef, {
              userId: user.uid,
              name: randomName,
              color: randomColor,
              lastSeen: new Date(),
              isAnonymous: user.isAnonymous
            });
          } else {
            const existingData = userDoc.data();
            
            // Check if existing document has all required fields
            if (!existingData.userId || !existingData.name || !existingData.color) {
              // Document exists but is incomplete, recreate it properly
              const randomColor = userColors[Math.floor(Math.random() * userColors.length)];
              const randomName = `User-${user.uid.substring(0, 4)}`;
              await setDoc(userDocRef, {
                userId: user.uid,
                name: randomName,
                color: randomColor,
                lastSeen: new Date(),
                isAnonymous: user.isAnonymous
              });
            } else {
              // User exists with complete data, just update lastSeen
              await setDoc(userDocRef, {
                lastSeen: new Date()
              }, { merge: true });
            }
          }
          
          // Only set current user AFTER the user document is ready
          setCurrentUser(user);
          setLoading(false);
        } catch (error) {
          console.error('Error setting up user:', error);
          setLoading(false);
        }
      } else {
        signInAnonymously(auth).catch(error => {
          console.error(error);
          setLoading(false);
        });
      }
    });
    return () => unsubscribe();
  }, []);

  // Listen for highlights
  useEffect(() => {
    if (!currentUser) return;

    const highlightsCollection = collection(db, `artifacts/${appId}/public/data/highlights`);
    const unsubscribe = onSnapshot(highlightsCollection, (snapshot) => {
      const highlightsData = snapshot.docs.map(doc => ({ id: doc.id, ...doc.data() }));
      setHighlights(highlightsData);
    });

    return () => unsubscribe();
  }, [currentUser]);

  // Listen for user profiles
  useEffect(() => {
    if (!currentUser) return;

    const usersCollection = collection(db, `artifacts/${appId}/public/data/users`);
    const unsubscribe = onSnapshot(query(usersCollection), (snapshot) => {
      const profiles = {};
      snapshot.docs.forEach(doc => {
        const data = doc.data();
        
        // Ensure we have valid user data before adding to profiles
        if (data.userId && data.name && data.color) {
          profiles[data.userId] = { name: data.name, color: data.color };
        }
      });
      setUserProfiles(profiles);
      setUserProfilesLoaded(true);
    });

    return () => unsubscribe();
  }, [currentUser]);

  // Update user activity periodically
  useEffect(() => {
    if (!currentUser) return;

    const updateActivity = async () => {
      try {
        const userDocRef = doc(db, `artifacts/${appId}/public/data/users`, currentUser.uid);
        // Only update lastSeen, don't accidentally overwrite other fields
        await setDoc(userDocRef, {
          lastSeen: new Date()
        }, { merge: true });
      } catch (error) {
        console.error('Error updating user activity:', error);
      }
    };

    // Update immediately and then every 30 seconds
    updateActivity();
    const interval = setInterval(updateActivity, 30000);
    return () => clearInterval(interval);
  }, [currentUser]);

  // Manual cleanup function
  const handleManualCleanup = async () => {
    const confirmCleanup = window.confirm(
      '⚠️ COMPLETE CLEANUP WARNING ⚠️\n\n' +
      'This will IMMEDIATELY delete:\n' +
      '• ALL anonymous users (regardless of age)\n' +
      '• ALL highlights and annotations\n' +
      '• ALL user authentication records\n' +
      '• ALL user profiles and data\n\n' +
      'This will reset the entire application state!\n' +
      'This action cannot be undone!\n\n' +
      'Are you sure you want to proceed with the COMPLETE cleanup?'
    );

    if (!confirmCleanup) return;

    const doubleConfirm = window.confirm(
      'FINAL CONFIRMATION - COMPLETE RESET\n\n' +
      'You are about to COMPLETELY RESET the application.\n' +
      'This will delete ALL data for ALL users.\n' +
      'The application will be returned to a clean state.\n\n' +
      'Click OK to RESET EVERYTHING or Cancel to abort.'
    );

    if (!doubleConfirm) return;

    setMessage({ text: 'Starting complete cleanup operation...', isError: false, show: true });

    try {
      // Call the backend cleanup function which has admin privileges
      const response = await fetch('https://us-central1-scholarmate-collab.cloudfunctions.net/manualCleanup', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json'
        },
        body: JSON.stringify({ completeCleanup: true })
      });

      if (!response.ok) {
        throw new Error(`HTTP error! status: ${response.status}`);
      }

      const result = await response.json();

      if (result.success) {
        const deletedUsers = result.result?.deletedCount || 0;
        const deletedHighlights = result.result?.highlightsDeleted || 0;
        
        setMessage({ 
          text: `✅ Complete cleanup successful! Removed ${deletedUsers} users and ${deletedHighlights} highlights. Refreshing...`, 
          isError: false, 
          show: true 
        });
        
        // Reset local state immediately
        setHighlights([]);
        setUserProfiles({});
        
        // Force browser refresh immediately to register as new user
        setTimeout(() => {
          window.location.reload(true); // true forces reload from server, not cache
        }, 1500);
      } else {
        setMessage({ 
          text: `❌ Cleanup failed: ${result.error || 'Unknown error'}`, 
          isError: true, 
          show: true 
        });
      }
    } catch (error) {
      console.error('Cleanup error:', error);
      setMessage({ 
        text: `❌ Cleanup failed: ${error.message}`, 
        isError: true, 
        show: true 
      });
    }

    // Hide message after 8 seconds
    setTimeout(() => {
      setMessage({ ...message, show: false });
    }, 8000);
  };

  // Handle clicking outside to close modal
  useEffect(() => {
    const handleClickOutside = (e) => {
      if (!textContainerRef.current?.contains(e.target) && 
          !e.target.closest('#coding-modal')) {
        setShowModal(false);
      }
    };

    if (showModal) {
      document.addEventListener('mousedown', handleClickOutside);
      return () => document.removeEventListener('mousedown', handleClickOutside);
    }
  }, [showModal]);

  const showMessage = (text, isError = false) => {
    setMessage({ text, isError, show: true });
    setTimeout(() => {
      setMessage(prev => ({ ...prev, show: false }));
    }, 3000);
  };

  const getTextPosition = (textContainer, targetIndex) => {
    let currentIndex = 0;
    const walker = document.createTreeWalker(
      textContainer,
      NodeFilter.SHOW_TEXT,
      null,
      false
    );

    while (walker.nextNode()) {
      const textLength = walker.currentNode.textContent.length;
      if (currentIndex + textLength >= targetIndex) {
        return {
          node: walker.currentNode,
          offset: targetIndex - currentIndex
        };
      }
      currentIndex += textLength;
    }
    return null;
  };

  const getAbsoluteIndex = (container, node, offset) => {
    let index = 0;
    const walker = document.createTreeWalker(
      container,
      NodeFilter.SHOW_TEXT,
      null,
      false
    );

    while (walker.nextNode()) {
      if (walker.currentNode === node) {
        return index + offset;
      }
      index += walker.currentNode.textContent.length;
    }
    return index;
  };

  const handleTextSelection = (e) => {
    const selection = window.getSelection();
    
    // Hide modal if clicking without selecting text
    if (selection.isCollapsed) {
      setShowModal(false);
      return;
    }

    // Don't show modal if clicking on a delete button
    if (e.target.classList.contains('delete-highlight')) {
      return;
    }

    // Show modal near the selection
    const range = selection.getRangeAt(0);
    const rect = range.getBoundingClientRect();
    
    setModalPosition({
      x: window.scrollX + rect.left,
      y: window.scrollY + rect.bottom + 5
    });
    setCurrentSelection(selection);
    setShowModal(true);
  };

  const handleAddHighlight = async (code) => {
    if (!currentSelection || !currentUser || !textContainerRef.current) return;

    const range = currentSelection.getRangeAt(0);
    const startIndex = getAbsoluteIndex(textContainerRef.current, range.startContainer, range.startOffset);
    const endIndex = getAbsoluteIndex(textContainerRef.current, range.endContainer, range.endOffset);

    if (startIndex === endIndex) return;

    try {
      const highlightsCollection = collection(db, `artifacts/${appId}/public/data/highlights`);
      await addDoc(highlightsCollection, {
        userId: currentUser.uid,
        code,
        startIndex: Math.min(startIndex, endIndex),
        endIndex: Math.max(startIndex, endIndex),
        text: sourceText.substring(Math.min(startIndex, endIndex), Math.max(startIndex, endIndex)),
        createdAt: new Date()
      });
      showMessage('Highlight added!');
    } catch (error) {
      console.error("Error adding highlight: ", error);
      showMessage('Failed to add highlight.', true);
    }

    setShowModal(false);
    window.getSelection().removeAllRanges();
    setCurrentSelection(null);
  };

  const handleDeleteHighlight = async (id) => {
    if (!confirm("Are you sure you want to delete this highlight?")) return;

    try {
      await deleteDoc(doc(db, `artifacts/${appId}/public/data/highlights`, id));
      showMessage('Highlight deleted.');
    } catch (error) {
      console.error("Error deleting highlight: ", error);
      showMessage('Failed to delete highlight.', true);
    }
  };

  const renderTextWithHighlights = () => {
    if (highlights.length === 0) {
      return <span>{sourceText}</span>;
    }

    // Create an array to track highlight coverage at each character position
    const highlightMap = new Array(sourceText.length).fill(null).map(() => []);
    
    // Populate the highlight map
    highlights.forEach(highlight => {
      for (let i = highlight.startIndex; i < highlight.endIndex; i++) {
        highlightMap[i].push(highlight);
      }
    });

    let elements = [];
    let i = 0;

    while (i < sourceText.length) {
      const currentHighlights = highlightMap[i];
      
      if (currentHighlights.length === 0) {
        // No highlights at this position, find the next position with highlights
        let nextHighlight = i + 1;
        while (nextHighlight < sourceText.length && highlightMap[nextHighlight].length === 0) {
          nextHighlight++;
        }
        
        elements.push(
          <span key={`text-${i}`}>
            {sourceText.substring(i, nextHighlight)}
          </span>
        );
        i = nextHighlight;
      } else {
        // Find the end of this highlight segment (where the highlight combination changes)
        let segmentEnd = i + 1;
        while (segmentEnd < sourceText.length && 
               highlightMap[segmentEnd].length > 0 &&
               arraysEqual(highlightMap[i].map(h => h.id), highlightMap[segmentEnd].map(h => h.id))) {
          segmentEnd++;
        }

        // Render this segment with multiple highlights
        const segmentText = sourceText.substring(i, segmentEnd);
        const sortedHighlights = currentHighlights.sort((a, b) => {
          // Prioritize current user's highlights first
          if (currentUser) {
            if (a.userId === currentUser.uid && b.userId !== currentUser.uid) return -1;
            if (b.userId === currentUser.uid && a.userId !== currentUser.uid) return 1;
          }
          // Then sort by creation time
          return new Date(a.createdAt) - new Date(b.createdAt);
        });

        const primaryHighlight = sortedHighlights[0];
        const userColor = userProfiles[primaryHighlight.userId]?.color || '#e5e7eb';
        const codeInfo = availableCodes.find(c => c.id === primaryHighlight.code);
        const codeLabel = codeInfo ? codeInfo.label : 'Unknown';
        const isOwner = currentUser && primaryHighlight.userId === currentUser.uid;
        
        // Build tooltip showing all highlights
        const tooltipParts = sortedHighlights.map(h => {
          const user = userProfiles[h.userId]?.name || '...';
          const code = availableCodes.find(c => c.id === h.code)?.label || 'Unknown';
          return `${user}: ${code}`;
        });
        const tooltip = tooltipParts.join('\n');

        // Create blended background for multiple highlights
        let backgroundColor;
        let opacity = 1;
        
        if (currentHighlights.length === 1) {
          backgroundColor = userColor;
          opacity = 0.7; // Make single highlights slightly translucent
        } else {
          // Blend colors for multiple highlights with increased translucency
          const colors = sortedHighlights.slice(0, 3).map(h => 
            userProfiles[h.userId]?.color || '#e5e7eb'
          );
          
          // Create a more subtle blended effect
          if (colors.length === 2) {
            backgroundColor = `linear-gradient(45deg, ${colors[0]} 50%, ${colors[1]} 50%)`;
            opacity = 0.5;
          } else {
            backgroundColor = `linear-gradient(45deg, ${colors[0]} 33%, ${colors[1]} 33%, ${colors[1]} 67%, ${colors[2] || colors[1]} 67%)`;
            opacity = 0.4;
          }
        }

        elements.push(
          <mark
            key={`highlight-${i}-${segmentEnd}`}
            className={`highlight ${currentHighlights.length > 1 ? 'multiple-highlights' : ''}`}
            style={{ 
              background: backgroundColor,
              opacity: opacity,
              position: 'relative',
              border: currentHighlights.length > 1 ? '1px dotted rgba(0,0,0,0.2)' : 'none'
            }}
            title={tooltip}
          >
            {/* Small discrete indicator for multiple highlights */}
            {currentHighlights.length > 1 && (
              <span 
                className="multiple-indicator"
                style={{
                  position: 'absolute',
                  top: '-6px',
                  right: '-2px',
                  backgroundColor: 'rgba(0,0,0,0.8)',
                  color: 'white',
                  fontSize: '8px',
                  borderRadius: '6px',
                  padding: '1px 3px',
                  lineHeight: '1',
                  zIndex: 5,
                  fontWeight: 'bold'
                }}
              >
                {currentHighlights.length}
              </span>
            )}

            {/* Delete button for current user's highlight */}
            {isOwner && (
              <span
                className="delete-highlight"
                data-id={primaryHighlight.id}
                onClick={() => handleDeleteHighlight(primaryHighlight.id)}
                title="Delete your highlight"
              >
                ×
              </span>
            )}
            {segmentText}
          </mark>
        );

        i = segmentEnd;
      }
    }

    return elements;
  };

  // Helper function to compare arrays
  const arraysEqual = (a, b) => {
    if (a.length !== b.length) return false;
    return a.every((val, index) => val === b[index]);
  };

  const currentUserProfile = currentUser && userProfiles[currentUser.uid];

  return (
    <div className="flex flex-col md:flex-row h-screen">
      {/* Main Content Area */}
      <main className="w-full md:w-2/3 lg:w-3/4 p-6 md:p-8 overflow-y-auto">
        <div className="max-w-4xl mx-auto">
          <h1 className="text-3xl font-bold text-gray-900 mb-2">Research Document</h1>
          <p className="text-gray-500 mb-6">Select text with your mouse to apply a code.</p>

          {loading && (
            <div id="loading-text" className="text-center p-8">
              <p className="text-gray-500">Connecting to the collaborative session...</p>
            </div>
          )}

          <div
            id="text-container"
            ref={textContainerRef}
            className="text-lg leading-relaxed bg-white p-8 rounded-lg shadow-sm prose max-w-none"
            onMouseUp={handleTextSelection}
          >
            {renderTextWithHighlights()}
          </div>
        </div>
      </main>

      {/* Sidebar / Control Panel */}
      <aside className="w-full md:w-1/3 lg:w-1/4 bg-white border-l border-gray-200 p-6 flex flex-col">
        <div className="flex-grow">
          <h2 className="text-xl font-bold text-gray-900 mb-4">Analysis Tools</h2>

          {/* User Info */}
          {currentUser && !currentUserProfile && !userProfilesLoaded && (
            <div id="user-info-loading" className="mb-6 p-4 rounded-lg bg-gray-100 text-center">
              <p className="text-sm text-gray-600">Initializing user...</p>
            </div>
          )}
          {currentUser && !currentUserProfile && userProfilesLoaded && (
            <div id="user-info-error" className="mb-6 p-4 rounded-lg bg-red-100 text-center">
              <p className="text-sm text-red-600">User profile not found. Please refresh the page.</p>
            </div>
          )}
          {currentUserProfile && (
            <div 
              id="user-info" 
              className="mb-6 p-4 rounded-lg"
              style={{ backgroundColor: currentUserProfile.color }}
            >
              <h3 className="font-bold text-white text-sm mb-1">Your Session:</h3>
              <p id="user-id-display" className="text-xs text-white break-all">ID: {currentUserProfile.name}</p>
            </div>
          )}

          {/* Codes */}
          <div className="mb-6">
            <h3 className="font-semibold text-gray-700 mb-3">Available Codes</h3>
            <div id="codes-list" className="flex flex-wrap gap-2">
              {availableCodes.map(code => (
                <button
                  key={code.id}
                  className={`code-btn px-3 py-1 rounded-full text-sm font-medium ${code.color} ${code.textColor}`}
                  data-code={code.id}
                  onClick={() => handleAddHighlight(code.id)}
                >
                  {code.label}
                </button>
              ))}
            </div>
          </div>

          {/* Legend */}
          <div>
            <h3 className="font-semibold text-gray-700 mb-3">Collaborator Legend</h3>
            <div id="legend-container" className="space-y-2">
              {Object.entries(userProfiles).map(([userId, profile]) => (
                <div key={userId} className="flex items-center">
                  <span className="w-4 h-4 rounded-full mr-2" style={{ backgroundColor: profile.color || '#e5e7eb' }}></span>
                  <span className="text-sm text-gray-600">{profile.name || 'Loading...'} (Active)</span>
                </div>
              ))}
            </div>
          </div>
        </div>
        
        {/* Admin Controls - Moved to bottom */}
        <div className="mt-6 pt-4 border-t border-gray-200">
          <h3 className="font-semibold text-gray-700 mb-3">Admin Controls</h3>
          <button
            onClick={handleManualCleanup}
            className="w-full px-4 py-2 bg-red-600 hover:bg-red-700 text-white text-sm font-medium rounded-lg transition-colors duration-200 flex items-center justify-center gap-2"
            title="Complete cleanup - removes ALL data and resets application"
          >
            <span>🗑️</span>
            <span>Complete Reset</span>
          </button>
          <p className="text-xs text-gray-500 mt-2">
            Immediately removes ALL users, highlights, and data. Resets the entire application.
          </p>
        </div>
        
        <div className="text-xs text-gray-400 mt-4 text-center">
          App ID: <span className="font-mono">{appId}</span>
        </div>
      </aside>

      {/* Coding Modal */}
      {showModal && (
        <div
          id="coding-modal"
          className="coding-modal bg-white rounded-lg shadow-xl border border-gray-200 p-2"
          style={{ left: modalPosition.x, top: modalPosition.y }}
        >
          <p className="text-xs text-gray-500 mb-2 px-1">Apply code:</p>
          <div id="modal-codes-list" className="flex flex-wrap gap-2">
            {availableCodes.map(code => (
              <button
                key={code.id}
                className={`code-btn px-3 py-1 rounded-full text-sm font-medium ${code.color} ${code.textColor}`}
                data-code={code.id}
                onClick={() => handleAddHighlight(code.id)}
              >
                {code.label}
              </button>
            ))}
          </div>
        </div>
      )}

      {/* Custom Message Box */}
      {message.show && (
        <div className={`message-box text-white py-2 px-4 rounded-lg shadow-md transition-opacity duration-300 ${message.isError ? 'bg-red-500' : 'bg-green-500'}`}>
          <p id="message-text">{message.text}</p>
        </div>
      )}
    </div>
  );
}