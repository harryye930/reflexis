import React, { useState } from 'react';
import { AuthService } from '../../../services/api/firebase/authService.js';
import { appId } from '../../../constants/appId.js';
import { 
  RESEARCH_BACKGROUND_SECTIONS,
  parseResearchBackgroundFromStorage,
  formatResearchBackgroundForStorage,
  validateResearchBackgroundSection
} from '../../../constants/researchBackground.js';
import ResearchBackgroundDisplay from '../../common/ResearchBackgroundDisplay.js';

const ResearcherProfile = ({ currentUser, currentUserProfile, onMessage }) => {
  const [isEditing, setIsEditing] = useState(false);
  // Separate background components for editing
  const [editQualitativeHistory, setEditQualitativeHistory] = useState('');
  const [editBackgroundExperience, setEditBackgroundExperience] = useState('');
  const [editInitialDataView, setEditInitialDataView] = useState('');
  const [loading, setLoading] = useState(false);
  const [errors, setErrors] = useState({});

  const [authService] = useState(() => new AuthService(appId));

    // Function to parse existing research background into separate sections
  const parseResearchBackground = (researchBackground) => {
    return parseResearchBackgroundFromStorage(researchBackground);
  };

  // Display handled by ResearchBackgroundDisplay component

  const handleEditClick = () => {
    const parsed = parseResearchBackground(currentUserProfile?.researchBackground || '');
    setEditQualitativeHistory(parsed.qualitativeHistory);
    setEditBackgroundExperience(parsed.backgroundExperience);
    setEditInitialDataView(parsed.initialDataView);
    setIsEditing(true);
    setErrors({});
  };

  const handleCancelEdit = () => {
    setIsEditing(false);
    setEditQualitativeHistory('');
    setEditBackgroundExperience('');
    setEditInitialDataView('');
    setErrors({});
  };

  const validateForm = () => {
    const newErrors = {};
    
    // Validate each background component using constants
    const qualitativeError = validateResearchBackgroundSection('QUALITATIVE_HISTORY', editQualitativeHistory);
    if (qualitativeError) {
      newErrors.qualitativeHistory = qualitativeError;
    }
    
    const backgroundError = validateResearchBackgroundSection('BACKGROUND_EXPERIENCE', editBackgroundExperience);
    if (backgroundError) {
      newErrors.backgroundExperience = backgroundError;
    }
    
    const initialViewError = validateResearchBackgroundSection('INITIAL_DATA_VIEW', editInitialDataView);
    if (initialViewError) {
      newErrors.initialDataView = initialViewError;
    }
    
    setErrors(newErrors);
    return Object.keys(newErrors).length === 0;
  };

  const handleSaveChanges = async () => {
    if (!validateForm()) {
      return;
    }

    setLoading(true);
    
    try {
      // Use the helper function from constants to format research background
      const mergedResearchBackground = formatResearchBackgroundForStorage(
        editQualitativeHistory,
        editBackgroundExperience,
        editInitialDataView
      );

      console.log('Updating user profile...', currentUser.uid, mergedResearchBackground);
      const result = await authService.updateUserDocument(currentUser.uid, {
        researchBackground: mergedResearchBackground,
        lastSeen: new Date()
      });

      console.log('Update result:', result);
      if (result.success) {
        setIsEditing(false);
        setEditQualitativeHistory('');
        setEditBackgroundExperience('');
        setEditInitialDataView('');
        setErrors({});
        if (onMessage) {
          onMessage('Profile updated successfully', false);
        }
      } else {
        throw new Error(result.error || 'Failed to update profile');
      }
    } catch (error) {
      console.error('Error updating profile:', error);
      setErrors({ submit: 'Failed to save changes. Please try again.' });
      if (onMessage) {
        onMessage('Failed to update profile. Please try again.', true);
      }
    } finally {
      setLoading(false);
    }
  };

  if (!currentUser || !currentUserProfile) {
    return (
      <div className="mb-6">
        <h3 className="font-semibold text-gray-700 mb-3">Researcher Profile</h3>
        <p className="text-xs text-gray-500">No researcher profile available</p>
      </div>
    );
  }

  return (
    <div className="mb-6">
      <h3 className="font-semibold text-gray-700 mb-3">Researcher Profile</h3>
      
      <div className="space-y-3">
        {!isEditing ? (
          // View Mode
          <>
            {/* User Identity */}
            <div className="flex items-center justify-between">
              <div className="flex items-center space-x-2">
                <span 
                  className="w-4 h-4 rounded-full" 
                  style={{ backgroundColor: currentUserProfile.color }}
                ></span>
                <span className="text-sm text-gray-600">
                  {currentUserProfile.name} (you)
                </span>
              </div>
              <button
                onClick={handleEditClick}
                className="text-xs text-blue-600 hover:text-blue-800 transition-colors"
              >
                Edit positionality
              </button>
            </div>

            {/* Research Background */}
            <div>
              <div className="text-xs text-gray-500 mb-2">Research Background & Positionality:</div>
              <ResearchBackgroundDisplay 
                researchBackground={currentUserProfile.researchBackground}
                variant="block"
                size="xs"
                showHeaders={true}
                useShortHeaders={false}
              />
            </div>
          </>
        ) : (
          // Edit Mode
          <div>
            <form onSubmit={(e) => { e.preventDefault(); handleSaveChanges(); }} className="space-y-3">
              
              {/* Qualitative Data Analysis History */}
              <div>
                <label htmlFor="editQualitativeHistory" className="block text-xs font-medium text-gray-700 mb-1">
                  {RESEARCH_BACKGROUND_SECTIONS.QUALITATIVE_HISTORY.label}
                  <span className="text-red-500 ml-1">*</span>
                </label>
                <div className="relative">
                  <textarea
                    id="editQualitativeHistory"
                    rows={2}
                    value={editQualitativeHistory}
                    onChange={(e) => setEditQualitativeHistory(e.target.value)}
                    className={`w-full px-2 py-2 border rounded text-sm focus:outline-none focus:ring-1 focus:ring-blue-500 resize-none transition-colors ${
                      errors.qualitativeHistory 
                        ? 'border-red-300 focus:border-red-500 focus:ring-red-200' 
                        : 'border-gray-300 focus:border-blue-500'
                    }`}
                    placeholder={RESEARCH_BACKGROUND_SECTIONS.QUALITATIVE_HISTORY.placeholder}
                    maxLength={RESEARCH_BACKGROUND_SECTIONS.QUALITATIVE_HISTORY.maxLength}
                    disabled={loading}
                  />
                  <div className="absolute bottom-1 right-1">
                    <span className="text-xs text-gray-400 bg-white px-1">
                      {editQualitativeHistory.length}/{RESEARCH_BACKGROUND_SECTIONS.QUALITATIVE_HISTORY.maxLength}
                    </span>
                  </div>
                </div>
                {errors.qualitativeHistory && (
                  <p className="text-xs text-red-600 mt-1">{errors.qualitativeHistory}</p>
                )}
              </div>

              {/* Background and Experience Effects */}
              <div>
                <label htmlFor="editBackgroundExperience" className="block text-xs font-medium text-gray-700 mb-1">
                  {RESEARCH_BACKGROUND_SECTIONS.BACKGROUND_EXPERIENCE.label}
                  <span className="text-red-500 ml-1">*</span>
                </label>
                <div className="relative">
                  <textarea
                    id="editBackgroundExperience"
                    rows={2}
                    value={editBackgroundExperience}
                    onChange={(e) => setEditBackgroundExperience(e.target.value)}
                    className={`w-full px-2 py-2 border rounded text-sm focus:outline-none focus:ring-1 focus:ring-blue-500 resize-none transition-colors ${
                      errors.backgroundExperience 
                        ? 'border-red-300 focus:border-red-500 focus:ring-red-200' 
                        : 'border-gray-300 focus:border-blue-500'
                    }`}
                    placeholder={RESEARCH_BACKGROUND_SECTIONS.BACKGROUND_EXPERIENCE.placeholder}
                    maxLength={RESEARCH_BACKGROUND_SECTIONS.BACKGROUND_EXPERIENCE.maxLength}
                    disabled={loading}
                  />
                  <div className="absolute bottom-1 right-1">
                    <span className="text-xs text-gray-400 bg-white px-1">
                      {editBackgroundExperience.length}/{RESEARCH_BACKGROUND_SECTIONS.BACKGROUND_EXPERIENCE.maxLength}
                    </span>
                  </div>
                </div>
                {errors.backgroundExperience && (
                  <p className="text-xs text-red-600 mt-1">{errors.backgroundExperience}</p>
                )}
              </div>

              {/* Initial View of Data */}
              <div>
                <label htmlFor="editInitialDataView" className="block text-xs font-medium text-gray-700 mb-1">
                  {RESEARCH_BACKGROUND_SECTIONS.INITIAL_DATA_VIEW.label}
                  <span className="text-red-500 ml-1">*</span>
                </label>
                <div className="relative">
                  <textarea
                    id="editInitialDataView"
                    rows={2}
                    value={editInitialDataView}
                    onChange={(e) => setEditInitialDataView(e.target.value)}
                    className={`w-full px-2 py-2 border rounded text-sm focus:outline-none focus:ring-1 focus:ring-blue-500 resize-none transition-colors ${
                      errors.initialDataView 
                        ? 'border-red-300 focus:border-red-500 focus:ring-red-200' 
                        : 'border-gray-300 focus:border-blue-500'
                    }`}
                    placeholder={RESEARCH_BACKGROUND_SECTIONS.INITIAL_DATA_VIEW.placeholder}
                    maxLength={RESEARCH_BACKGROUND_SECTIONS.INITIAL_DATA_VIEW.maxLength}
                    disabled={loading}
                  />
                  <div className="absolute bottom-1 right-1">
                    <span className="text-xs text-gray-400 bg-white px-1">
                      {editInitialDataView.length}/{RESEARCH_BACKGROUND_SECTIONS.INITIAL_DATA_VIEW.maxLength}
                    </span>
                  </div>
                </div>
                {errors.initialDataView && (
                  <p className="text-xs text-red-600 mt-1">{errors.initialDataView}</p>
                )}
              </div>

              {/* Error Message */}
              {errors.submit && (
                <div className="p-2 bg-red-50 border border-red-200 rounded text-xs">
                  <p className="text-red-600">{errors.submit}</p>
                </div>
              )}

              {/* Action Buttons */}
              <div className="flex items-center justify-end space-x-2">
                <button
                  type="button"
                  onClick={handleCancelEdit}
                  disabled={loading}
                  className="px-2 py-1 text-xs text-gray-600 hover:text-gray-800 transition-colors"
                >
                  Cancel
                </button>
                <button
                  type="submit"
                  disabled={loading}
                  className="px-2 py-1 text-xs text-blue-600 hover:text-blue-800 transition-colors disabled:opacity-50 disabled:cursor-not-allowed"
                >
                  {loading ? 'Saving...' : 'Save'}
                </button>
              </div>
            </form>
          </div>
        )}
      </div>
    </div>
  );
};

export default ResearcherProfile;
