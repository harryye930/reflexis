import React, { useState } from 'react';
import {
  RESEARCH_BACKGROUND_SECTIONS,
  formatResearchBackgroundForStorage,
  validateResearchBackgroundSection
} from '../constants/researchBackground.js';

const UserProfileSetup = ({ onComplete, completeProfile }) => {
  const [displayName, setDisplayName] = useState('');
  const [qualitativeHistory, setQualitativeHistory] = useState('');
  const [backgroundExperience, setBackgroundExperience] = useState('');
  const [loading, setLoading] = useState(false);
  const [errors, setErrors] = useState({});

  const validateForm = () => {
    const newErrors = {};

    if (!displayName.trim()) {
      newErrors.displayName = 'Display name is required';
    } else if (displayName.trim().length < 2) {
      newErrors.displayName = 'Display name must be at least 2 characters';
    } else if (displayName.trim().length > 50) {
      newErrors.displayName = 'Display name must be less than 50 characters';
    }

    const qualitativeError = validateResearchBackgroundSection('QUALITATIVE_HISTORY', qualitativeHistory);
    if (qualitativeError) newErrors.qualitativeHistory = qualitativeError;

    const backgroundError = validateResearchBackgroundSection('BACKGROUND_EXPERIENCE', backgroundExperience);
    if (backgroundError) newErrors.backgroundExperience = backgroundError;

    setErrors(newErrors);
    return Object.keys(newErrors).length === 0;
  };

  const handleSubmit = async (e) => {
    e.preventDefault();
    if (!validateForm()) return;

    setLoading(true);

    try {
      // Initial view of data is filled later, once the researcher has reviewed documents.
      const mergedResearchBackground = formatResearchBackgroundForStorage(
        qualitativeHistory,
        backgroundExperience,
        ''
      );

      await completeProfile(displayName.trim(), mergedResearchBackground);
      onComplete();
    } catch (error) {
      console.error('Error updating user profile:', error);
      setErrors({ submit: 'Failed to save profile. Please try again.' });
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="fixed inset-0 z-50 overflow-y-auto bg-slate-50">
      <div className="flex min-h-full items-start justify-center px-4 py-12">
        <div className="w-full max-w-xl bg-white border border-slate-200 rounded-lg shadow-sm">
          <div className="px-8 pt-8 pb-6 border-b border-slate-100">
            <h1 className="text-xl font-semibold text-slate-900">Set up your researcher profile</h1>
            <p className="text-sm text-slate-600 mt-2">
              Reflexive thematic analysis asks researchers to be transparent about how they read data.
              These two short fields stay with your account and travel with you across projects. Your
              initial impressions of any specific dataset are recorded later, once you&rsquo;ve seen it.
            </p>
          </div>

          <form onSubmit={handleSubmit} className="px-8 py-6 space-y-5">
            {/* Display name */}
            <div>
              <label htmlFor="displayName" className="block text-sm font-medium text-slate-800 mb-1">
                Display name <span className="text-red-500">*</span>
              </label>
              <input
                type="text"
                id="displayName"
                value={displayName}
                onChange={(e) => setDisplayName(e.target.value)}
                className={`w-full px-3 py-2 border rounded-md text-sm focus:outline-none focus:ring-2 focus:ring-blue-500/20 focus:border-blue-500 ${
                  errors.displayName ? 'border-red-300' : 'border-slate-300'
                }`}
                placeholder="e.g., Sarah Chen"
                maxLength={50}
                disabled={loading}
              />
              <div className="flex items-center justify-between mt-1">
                <span className="text-xs text-slate-500">Visible to your collaborators.</span>
                <span className="text-xs text-slate-400">{displayName.length}/50</span>
              </div>
              {errors.displayName && (
                <p className="text-xs text-red-600 mt-1">{errors.displayName}</p>
              )}
            </div>

            {/* Qualitative history */}
            <div>
              <label htmlFor="qualitativeHistory" className="block text-sm font-medium text-slate-800 mb-1">
                {RESEARCH_BACKGROUND_SECTIONS.QUALITATIVE_HISTORY.label} <span className="text-red-500">*</span>
              </label>
              <textarea
                id="qualitativeHistory"
                rows={3}
                value={qualitativeHistory}
                onChange={(e) => setQualitativeHistory(e.target.value)}
                className={`w-full px-3 py-2 border rounded-md text-sm focus:outline-none focus:ring-2 focus:ring-blue-500/20 focus:border-blue-500 resize-none ${
                  errors.qualitativeHistory ? 'border-red-300' : 'border-slate-300'
                }`}
                placeholder={RESEARCH_BACKGROUND_SECTIONS.QUALITATIVE_HISTORY.placeholder}
                maxLength={RESEARCH_BACKGROUND_SECTIONS.QUALITATIVE_HISTORY.maxLength}
                disabled={loading}
              />
              <div className="flex items-center justify-end mt-1">
                <span className="text-xs text-slate-400">
                  {qualitativeHistory.length}/{RESEARCH_BACKGROUND_SECTIONS.QUALITATIVE_HISTORY.maxLength}
                </span>
              </div>
              {errors.qualitativeHistory && (
                <p className="text-xs text-red-600 mt-1">{errors.qualitativeHistory}</p>
              )}
            </div>

            {/* Background experience */}
            <div>
              <label htmlFor="backgroundExperience" className="block text-sm font-medium text-slate-800 mb-1">
                {RESEARCH_BACKGROUND_SECTIONS.BACKGROUND_EXPERIENCE.label} <span className="text-red-500">*</span>
              </label>
              <textarea
                id="backgroundExperience"
                rows={3}
                value={backgroundExperience}
                onChange={(e) => setBackgroundExperience(e.target.value)}
                className={`w-full px-3 py-2 border rounded-md text-sm focus:outline-none focus:ring-2 focus:ring-blue-500/20 focus:border-blue-500 resize-none ${
                  errors.backgroundExperience ? 'border-red-300' : 'border-slate-300'
                }`}
                placeholder={RESEARCH_BACKGROUND_SECTIONS.BACKGROUND_EXPERIENCE.placeholder}
                maxLength={RESEARCH_BACKGROUND_SECTIONS.BACKGROUND_EXPERIENCE.maxLength}
                disabled={loading}
              />
              <div className="flex items-center justify-end mt-1">
                <span className="text-xs text-slate-400">
                  {backgroundExperience.length}/{RESEARCH_BACKGROUND_SECTIONS.BACKGROUND_EXPERIENCE.maxLength}
                </span>
              </div>
              {errors.backgroundExperience && (
                <p className="text-xs text-red-600 mt-1">{errors.backgroundExperience}</p>
              )}
            </div>

            {errors.submit && (
              <div className="p-3 bg-red-50 border border-red-200 rounded-md text-sm text-red-700">
                {errors.submit}
              </div>
            )}

            <div className="pt-2">
              <button
                type="submit"
                disabled={loading}
                className="w-full px-4 py-2.5 bg-slate-900 text-white text-sm font-medium rounded-md hover:bg-slate-800 disabled:bg-slate-400 disabled:cursor-not-allowed"
              >
                {loading ? 'Saving...' : 'Continue'}
              </button>
              <p className="text-xs text-slate-500 mt-3 text-center">
                You can edit these any time from a project&rsquo;s admin panel.
              </p>
            </div>
          </form>
        </div>
      </div>
    </div>
  );
};

export default UserProfileSetup;
