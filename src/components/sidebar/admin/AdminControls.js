import React, { useState } from 'react';
import { DeleteForever } from '@mui/icons-material';
import { appId } from '../../../constants/index.js';
import AdminToggles from './AdminToggles.js';

const AdminControls = ({ 
  onMessage,
  showHoverTooltips,
  showAuthorInfo,
  onToggleHoverTooltips,
  onToggleAuthorInfo,
  disableHighlightManagement,
  onToggleDisableHighlightManagement,
  disableCodeDriftDetection,
  onToggleDisableCodeDriftDetection
}) => {
  const [isLoading, setIsLoading] = useState(false);

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

    setIsLoading(true);
    onMessage('Starting complete cleanup operation...', false);

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
        const deletedUsers = result.result?.usersDeleted || 0;
        const deletedHighlights = result.result?.highlightsDeleted || 0;
        
        onMessage(
          `✅ Complete cleanup successful! Removed ${deletedUsers} users and ${deletedHighlights} highlights. Refreshing...`, 
          false
        );
        
        // Force browser refresh immediately to register as new user
        setTimeout(() => {
          window.location.reload(true); // true forces reload from server, not cache
        }, 3000);
      } else {
        onMessage(`❌ Cleanup failed: ${result.error || 'Unknown error'}`, true);
      }
    } catch (error) {
      console.error('Cleanup error:', error);
      onMessage(`❌ Cleanup failed: ${error.message}`, true);
    } finally {
      setIsLoading(false);
    }
  };

  return (
    <div className="space-y-6">
      {/* Hover Settings */}
      <div>
        <AdminToggles
          showHoverTooltips={showHoverTooltips}
          showAuthorInfo={showAuthorInfo}
          onToggleHoverTooltips={onToggleHoverTooltips}
          onToggleAuthorInfo={onToggleAuthorInfo}
          disableHighlightManagement={disableHighlightManagement}
          onToggleDisableHighlightManagement={onToggleDisableHighlightManagement}
          disableCodeDriftDetection={disableCodeDriftDetection}
          onToggleDisableCodeDriftDetection={onToggleDisableCodeDriftDetection}
        />
      </div>
      
      {/* Reset Control */}
      <div className="pt-4 border-t border-gray-200">
        <h4 className="font-semibold text-gray-700 text-sm mb-3">System Reset</h4>
        <button
          onClick={handleManualCleanup}
          disabled={isLoading}
          className="w-full px-4 py-2 bg-red-600 hover:bg-red-700 disabled:bg-red-400 text-white text-sm font-medium rounded-lg transition-colors duration-200 flex items-center justify-center gap-2"
          title="Complete cleanup - removes ALL data and resets application"
        >
          <DeleteForever sx={{ fontSize: 16 }} />
          <span>{isLoading ? 'Cleaning...' : 'Complete Reset'}</span>
        </button>
        <p className="text-xs text-gray-500 mt-2">
          Immediately removes ALL users, highlights, and data. Resets the entire application.
        </p>
      </div>
      
      <div className="text-xs text-gray-400 mt-4 text-center">
        App ID: <span className="font-mono">{appId}</span>
      </div>
    </div>
  );
};

export default AdminControls;
