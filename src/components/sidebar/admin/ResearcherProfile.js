import React, { useState } from 'react';
import { AuthService } from '../../../services/api/firebase/authService.js';
import { appId } from '../../../constants/index.js';

const ResearcherProfile = ({ currentUser, currentUserProfile, onMessage }) => {
  const [isEditing, setIsEditing] = useState(false);
  const [editBackground, setEditBackground] = useState('');
  const [loading, setLoading] = useState(false);
  const [errors, setErrors] = useState({});

  const [authService] = useState(() => new AuthService(appId));

  const handleEditClick = () => {
    setEditBackground(currentUserProfile?.researchBackground || '');
    setIsEditing(true);
    setErrors({});
  };

  const handleCancelEdit = () => {
    setIsEditing(false);
    setEditBackground('');
    setErrors({});
  };

  const validateForm = () => {
    const newErrors = {};
    
    if (!editBackground.trim()) {
      newErrors.background = 'Research background is required';
    } else if (editBackground.trim().length < 2) {
      newErrors.background = 'Please provide at least 2 characters for your research background';
    } else if (editBackground.trim().length > 500) {
      newErrors.background = 'Research background must be less than 500 characters';
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
      console.log('Updating user profile...', currentUser.uid, editBackground.trim());
      const result = await authService.updateUserDocument(currentUser.uid, {
        researchBackground: editBackground.trim(),
        lastSeen: new Date()
      });

      console.log('Update result:', result);
      if (result.success) {
        setIsEditing(false);
        setEditBackground('');
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
              <div className="text-xs text-gray-500 mb-1">Research Background & Positionality:</div>
              <div className="text-sm text-gray-700 leading-relaxed bg-gray-50 p-2 rounded text-xs">
                {currentUserProfile.researchBackground || 'No research background provided'}
              </div>
            </div>
          </>
        ) : (
          // Edit Mode
          <div>
            <form onSubmit={(e) => { e.preventDefault(); handleSaveChanges(); }} className="space-y-3">
              <div>
                <label htmlFor="editBackground" className="block text-xs font-medium text-gray-700 mb-1">
                  Research Background & Positionality
                  <span className="text-red-500 ml-1">*</span>
                </label>
                <div className="relative">
                  <textarea
                    id="editBackground"
                    rows={3}
                    value={editBackground}
                    onChange={(e) => setEditBackground(e.target.value)}
                    className={`w-full px-2 py-2 border rounded text-sm focus:outline-none focus:ring-1 focus:ring-blue-500 resize-none transition-colors ${
                      errors.background 
                        ? 'border-red-300 focus:border-red-500 focus:ring-red-200' 
                        : 'border-gray-300 focus:border-blue-500'
                    }`}
                    placeholder="e.g., PhD in Psychology specializing in cognitive behavior analysis..."
                    maxLength={500}
                    disabled={loading}
                  />
                  <div className="absolute bottom-1 right-1">
                    <span className="text-xs text-gray-400 bg-white px-1">
                      {editBackground.length}/500
                    </span>
                  </div>
                </div>
                {errors.background && (
                  <p className="text-xs text-red-600 mt-1">{errors.background}</p>
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
