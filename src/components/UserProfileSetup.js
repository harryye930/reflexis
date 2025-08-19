import React, { useState } from 'react';
import { 
  RESEARCH_BACKGROUND_SECTIONS, 
  formatResearchBackgroundForStorage,
  validateResearchBackgroundSection 
} from '../constants/researchBackground.js';

const UserProfileSetup = ({ currentUser, appId, onComplete, completeProfile }) => {
  const [displayName, setDisplayName] = useState('');
  // Separate background components
  const [qualitativeHistory, setQualitativeHistory] = useState('');
  const [backgroundExperience, setBackgroundExperience] = useState('');
  const [initialDataView, setInitialDataView] = useState('');
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
    
    // Validate each background component using constants
    const qualitativeError = validateResearchBackgroundSection('QUALITATIVE_HISTORY', qualitativeHistory);
    if (qualitativeError) {
      newErrors.qualitativeHistory = qualitativeError;
    }
    
    const backgroundError = validateResearchBackgroundSection('BACKGROUND_EXPERIENCE', backgroundExperience);
    if (backgroundError) {
      newErrors.backgroundExperience = backgroundError;
    }
    
    const initialViewError = validateResearchBackgroundSection('INITIAL_DATA_VIEW', initialDataView);
    if (initialViewError) {
      newErrors.initialDataView = initialViewError;
    }
    
    setErrors(newErrors);
    return Object.keys(newErrors).length === 0;
  };

  const handleSubmit = async (e) => {
    e.preventDefault();
    
    if (!validateForm()) {
      return;
    }
    
    setLoading(true);
    
    try {
      // Use the helper function from constants to format research background
      const mergedResearchBackground = formatResearchBackgroundForStorage(
        qualitativeHistory,
        backgroundExperience,
        initialDataView
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
    <div className="fixed inset-0 z-50 overflow-y-auto">
      {/* Backdrop with subtle blur effect */}
      <div className="fixed inset-0 bg-gradient-to-br from-slate-50/80 via-blue-50/60 to-indigo-50/70 backdrop-blur-md transition-opacity duration-500" />
      
      {/* Floating particles background effect */}
      <div className="fixed inset-0 overflow-hidden pointer-events-none">
        <div className="absolute top-1/4 left-1/4 w-32 h-32 bg-blue-400/10 rounded-full blur-2xl animate-pulse"></div>
        <div className="absolute top-3/4 right-1/4 w-24 h-24 bg-purple-400/10 rounded-full blur-xl animate-pulse delay-1000"></div>
        <div className="absolute top-1/2 left-3/4 w-20 h-20 bg-indigo-400/10 rounded-full blur-lg animate-pulse delay-500"></div>
      </div>
      
      {/* Modal container */}
      <div className="flex min-h-full items-center justify-center p-6 text-center sm:p-4">
        <div className="relative transform overflow-hidden rounded-3xl bg-white/70 backdrop-blur-xl shadow-2xl border border-white/40 transition-all duration-500 w-full max-w-lg mx-auto hover:shadow-3xl hover:bg-white/75">
          
          {/* Subtle gradient overlay */}
          <div className="absolute inset-0 bg-gradient-to-br from-white/20 via-transparent to-blue-50/20 rounded-3xl" />
          
          {/* Content */}
          <div className="relative px-8 pt-10 pb-8">
            
            {/* Welcome icon and text */}
            <div className="text-center mb-10">
              <div className="mx-auto flex items-center justify-center h-20 w-20 rounded-2xl bg-gradient-to-br from-blue-500/20 to-purple-500/20 backdrop-blur-sm mb-6 border border-white/30 shadow-lg">
                <svg className="h-10 w-10 text-blue-600" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={1.5} d="M16 7a4 4 0 11-8 0 4 4 0 018 0zM12 14a7 7 0 00-7 7h14a7 7 0 00-7-7z" />
                </svg>
              </div>
              <h2 className="text-3xl font-light text-slate-800 mb-3 tracking-wide">
                <span className="font-semibold bg-gradient-to-r from-blue-600 to-purple-600 bg-clip-text text-transparent">Welcome</span>
              </h2>
              <p className="text-slate-600 text-base font-light max-w-md mx-auto leading-relaxed">
                Set up your research profile with focused sections to begin collaborative analysis
              </p>
            </div>
            
            {/* Form */}
            <form onSubmit={handleSubmit} className="space-y-6 bg-white/40 backdrop-blur-sm rounded-2xl p-8 shadow-lg border border-white/50">
              
              {/* Display Name Field */}
              <div className="space-y-3">
                <label htmlFor="displayName" className="flex items-center text-sm font-medium text-slate-700">
                  <svg className="h-4 w-4 mr-2 text-blue-500" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={1.5} d="M7 7h.01M7 3h5c.512 0 1.024.195 1.414.586l7 7a2 2 0 010 2.828l-7 7a2 2 0 01-2.828 0l-7-7A1.994 1.994 0 013 12V7a4 4 0 014-4z" />
                  </svg>
                  Display Name
                  <span className="text-red-400 ml-1">*</span>
                </label>
                <div className="relative group">
                  <input
                    type="text"
                    id="displayName"
                    value={displayName}
                    onChange={(e) => setDisplayName(e.target.value)}
                    className={`w-full px-4 py-3.5 rounded-xl border transition-all duration-200 focus:outline-none focus:ring-2 font-light placeholder-slate-400 bg-white/70 backdrop-blur-sm shadow-sm ${
                      errors.displayName 
                        ? 'border-red-300 focus:border-red-400 focus:ring-red-200/50 bg-red-50/60' 
                        : 'border-slate-200/80 focus:border-blue-400 focus:ring-blue-200/30 hover:border-blue-300 focus:bg-white/90'
                    }`}
                    placeholder="e.g., Dr. Sarah Chen"
                    maxLength={50}
                    disabled={loading}
                  />
                  <div className="absolute inset-y-0 right-0 flex items-center pr-4">
                    <span className="text-xs text-slate-500 font-light bg-white/80 px-2 py-1 rounded-lg backdrop-blur-sm border border-slate-200/50">
                      {displayName.length}/50
                    </span>
                  </div>
                </div>
                {errors.displayName && (
                  <p className="text-sm text-red-500 flex items-center">
                    <svg className="h-4 w-4 mr-1.5" fill="currentColor" viewBox="0 0 20 20">
                      <path fillRule="evenodd" d="M18 10a8 8 0 11-16 0 8 8 0 0116 0zm-7 4a1 1 0 11-2 0 1 1 0 012 0zm-1-9a1 1 0 00-1 1v4a1 1 0 102 0V6a1 1 0 00-1-1z" clipRule="evenodd" />
                    </svg>
                    {errors.displayName}
                  </p>
                )}
                <p className="text-xs text-slate-500 flex items-center font-light">
                  <svg className="h-3 w-3 mr-1.5" fill="currentColor" viewBox="0 0 20 20">
                    <path fillRule="evenodd" d="M18 10a8 8 0 11-16 0 8 8 0 0116 0zm-7-4a1 1 0 11-2 0 1 1 0 012 0zM9 9a1 1 0 000 2v3a1 1 0 001 1h1a1 1 0 100-2v-3a1 1 0 00-1-1H9z" clipRule="evenodd" />
                  </svg>
                  Visible to other collaborators
                </p>
              </div>
              
              {/* Research Background Fields - Multiple Sections */}
              
              {/* Qualitative Data Analysis History */}
              <div className="space-y-3">
                <label htmlFor="qualitativeHistory" className="flex items-center text-sm font-medium text-slate-700">
                  <svg className="h-4 w-4 mr-2 text-blue-500" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={1.5} d="M12 6.253v13m0-13C10.832 5.477 9.246 5 7.5 5S4.168 5.477 3 6.253v13C4.168 18.477 5.754 18 7.5 18s3.332.477 4.5 1.253m0-13C13.168 5.477 14.754 5 16.5 5c1.746 0 3.332.477 4.5 1.253v13C19.832 18.477 18.246 18 16.5 18c-1.746 0-3.332.477-4.5 1.253" />
                  </svg>
                  {RESEARCH_BACKGROUND_SECTIONS.QUALITATIVE_HISTORY.label}
                  <span className="text-red-400 ml-1">*</span>
                </label>
                <div className="relative group">
                  <textarea
                    id="qualitativeHistory"
                    rows={3}
                    value={qualitativeHistory}
                    onChange={(e) => setQualitativeHistory(e.target.value)}
                    className={`w-full px-4 py-3.5 rounded-xl border transition-all duration-200 focus:outline-none focus:ring-2 resize-none font-light placeholder-slate-400 bg-white/70 backdrop-blur-sm shadow-sm ${
                      errors.qualitativeHistory 
                        ? 'border-red-300 focus:border-red-400 focus:ring-red-200/50 bg-red-50/60' 
                        : 'border-slate-200/80 focus:border-blue-400 focus:ring-blue-200/30 hover:border-blue-300 focus:bg-white/90'
                    }`}
                    placeholder={RESEARCH_BACKGROUND_SECTIONS.QUALITATIVE_HISTORY.placeholder}
                    maxLength={RESEARCH_BACKGROUND_SECTIONS.QUALITATIVE_HISTORY.maxLength}
                    disabled={loading}
                  />
                  <div className="absolute bottom-3 right-3">
                    <span className="text-xs text-slate-500 font-light bg-white/80 px-2 py-1 rounded-lg backdrop-blur-sm border border-slate-200/50">
                      {qualitativeHistory.length}/{RESEARCH_BACKGROUND_SECTIONS.QUALITATIVE_HISTORY.maxLength}
                    </span>
                  </div>
                </div>
                {errors.qualitativeHistory && (
                  <p className="text-sm text-red-500 flex items-center justify-start">
                    <svg className="h-4 w-4 mr-1.5" fill="currentColor" viewBox="0 0 20 20">
                      <path fillRule="evenodd" d="M18 10a8 8 0 11-16 0 8 8 0 0116 0zm-7 4a1 1 0 11-2 0 1 1 0 012 0zm-1-9a1 1 0 00-1 1v4a1 1 0 102 0V6a1 1 0 00-1-1z" clipRule="evenodd" />
                    </svg>
                    {errors.qualitativeHistory}
                  </p>
                )}
              </div>

              {/* Background and Experience Effects */}
              <div className="space-y-3">
                <label htmlFor="backgroundExperience" className="flex items-center text-sm font-medium text-slate-700">
                  <svg className="h-4 w-4 mr-2 text-blue-500" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={1.5} d="M13 10V3L4 14h7v7l9-11h-7z" />
                  </svg>
                  {RESEARCH_BACKGROUND_SECTIONS.BACKGROUND_EXPERIENCE.label}
                  <span className="text-red-400 ml-1">*</span>
                </label>
                <div className="relative group">
                  <textarea
                    id="backgroundExperience"
                    rows={3}
                    value={backgroundExperience}
                    onChange={(e) => setBackgroundExperience(e.target.value)}
                    className={`w-full px-4 py-3.5 rounded-xl border transition-all duration-200 focus:outline-none focus:ring-2 resize-none font-light placeholder-slate-400 bg-white/70 backdrop-blur-sm shadow-sm ${
                      errors.backgroundExperience 
                        ? 'border-red-300 focus:border-red-400 focus:ring-red-200/50 bg-red-50/60' 
                        : 'border-slate-200/80 focus:border-blue-400 focus:ring-blue-200/30 hover:border-blue-300 focus:bg-white/90'
                    }`}
                    placeholder={RESEARCH_BACKGROUND_SECTIONS.BACKGROUND_EXPERIENCE.placeholder}
                    maxLength={RESEARCH_BACKGROUND_SECTIONS.BACKGROUND_EXPERIENCE.maxLength}
                    disabled={loading}
                  />
                  <div className="absolute bottom-3 right-3">
                    <span className="text-xs text-slate-500 font-light bg-white/80 px-2 py-1 rounded-lg backdrop-blur-sm border border-slate-200/50">
                      {backgroundExperience.length}/{RESEARCH_BACKGROUND_SECTIONS.BACKGROUND_EXPERIENCE.maxLength}
                    </span>
                  </div>
                </div>
                {errors.backgroundExperience && (
                  <p className="text-sm text-red-500 flex items-center justify-start">
                    <svg className="h-4 w-4 mr-1.5" fill="currentColor" viewBox="0 0 20 20">
                      <path fillRule="evenodd" d="M18 10a8 8 0 11-16 0 8 8 0 0116 0zm-7 4a1 1 0 11-2 0 1 1 0 012 0zm-1-9a1 1 0 00-1 1v4a1 1 0 102 0V6a1 1 0 00-1-1z" clipRule="evenodd" />
                    </svg>
                    {errors.backgroundExperience}
                  </p>
                )}
              </div>

              {/* Initial View of Data */}
              <div className="space-y-3">
                <label htmlFor="initialDataView" className="flex items-center text-sm font-medium text-slate-700">
                  <svg className="h-4 w-4 mr-2 text-blue-500" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={1.5} d="M15 12a3 3 0 11-6 0 3 3 0 016 0z" />
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={1.5} d="M2.458 12C3.732 7.943 7.523 5 12 5c4.478 0 8.268 2.943 9.542 7-1.274 4.057-5.064 7-9.542 7-4.477 0-8.268-2.943-9.542-7z" />
                  </svg>
                  {RESEARCH_BACKGROUND_SECTIONS.INITIAL_DATA_VIEW.label}
                  <span className="text-red-400 ml-1">*</span>
                </label>
                <div className="relative group">
                  <textarea
                    id="initialDataView"
                    rows={3}
                    value={initialDataView}
                    onChange={(e) => setInitialDataView(e.target.value)}
                    className={`w-full px-4 py-3.5 rounded-xl border transition-all duration-200 focus:outline-none focus:ring-2 resize-none font-light placeholder-slate-400 bg-white/70 backdrop-blur-sm shadow-sm ${
                      errors.initialDataView 
                        ? 'border-red-300 focus:border-red-400 focus:ring-red-200/50 bg-red-50/60' 
                        : 'border-slate-200/80 focus:border-blue-400 focus:ring-blue-200/30 hover:border-blue-300 focus:bg-white/90'
                    }`}
                    placeholder={RESEARCH_BACKGROUND_SECTIONS.INITIAL_DATA_VIEW.placeholder}
                    maxLength={RESEARCH_BACKGROUND_SECTIONS.INITIAL_DATA_VIEW.maxLength}
                    disabled={loading}
                  />
                  <div className="absolute bottom-3 right-3">
                    <span className="text-xs text-slate-500 font-light bg-white/80 px-2 py-1 rounded-lg backdrop-blur-sm border border-slate-200/50">
                      {initialDataView.length}/{RESEARCH_BACKGROUND_SECTIONS.INITIAL_DATA_VIEW.maxLength}
                    </span>
                  </div>
                </div>
                {errors.initialDataView && (
                  <p className="text-sm text-red-500 flex items-center justify-start">
                    <svg className="h-4 w-4 mr-1.5" fill="currentColor" viewBox="0 0 20 20">
                      <path fillRule="evenodd" d="M18 10a8 8 0 11-16 0 8 8 0 0116 0zm-7 4a1 1 0 11-2 0 1 1 0 012 0zm-1-9a1 1 0 00-1 1v4a1 1 0 102 0V6a1 1 0 00-1-1z" clipRule="evenodd" />
                    </svg>
                    {errors.initialDataView}
                  </p>
                )}
                <p className="text-xs text-slate-500 flex items-center font-light">
                  <svg className="h-3 w-3 mr-1.5" fill="currentColor" viewBox="0 0 20 20">
                    <path fillRule="evenodd" d="M18 10a8 8 0 11-16 0 8 8 0 0116 0zm-7-4a1 1 0 11-2 0 1 1 0 012 0zM9 9a1 1 0 000 2v3a1 1 0 001 1h1a1 1 0 100-2v-3a1 1 0 00-1-1H9z" clipRule="evenodd" />
                  </svg>
                  These help contextualize your analysis perspective
                </p>
              </div>
              
              {/* Error Message */}
              {errors.submit && (
                <div className="p-4 bg-red-100/60 backdrop-blur-sm border border-red-200/60 rounded-xl">
                  <div className="flex items-center">
                    <svg className="h-5 w-5 text-red-500" fill="currentColor" viewBox="0 0 20 20">
                      <path fillRule="evenodd" d="M10 18a8 8 0 100-16 8 8 0 000 16zM8.707 7.293a1 1 0 00-1.414 1.414L8.586 10l-1.293 1.293a1 1 0 101.414 1.414L10 11.414l1.293 1.293a1 1 0 001.414-1.414L11.414 10l1.293-1.293a1 1 0 00-1.414-1.414L10 8.586 8.707 7.293z" clipRule="evenodd" />
                    </svg>
                    <p className="ml-3 text-sm text-red-600 font-medium">{errors.submit}</p>
                  </div>
                </div>
              )}
              
              {/* Submit Button */}
              <button
                type="submit"
                disabled={loading}
                className="w-full relative overflow-hidden bg-gradient-to-r from-blue-500/80 to-purple-500/80 backdrop-blur-sm text-white font-medium py-4 px-6 rounded-xl hover:from-blue-600/90 hover:to-purple-600/90 focus:outline-none focus:ring-4 focus:ring-blue-400/30 transition-all duration-300 disabled:opacity-50 disabled:cursor-not-allowed transform hover:scale-[1.01] active:scale-[0.99] shadow-lg hover:shadow-xl border border-white/20"
              >
                {loading ? (
                  <div className="flex items-center justify-center">
                    <svg className="animate-spin -ml-1 mr-3 h-5 w-5 text-white" xmlns="http://www.w3.org/2000/svg" fill="none" viewBox="0 0 24 24">
                      <circle className="opacity-25" cx="12" cy="12" r="10" stroke="currentColor" strokeWidth="4"></circle>
                      <path className="opacity-75" fill="currentColor" d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4zm2 5.291A7.962 7.962 0 014 12H0c0 3.042 1.135 5.824 3 7.938l3-2.647z"></path>
                    </svg>
                    <span className="font-light">Setting up your profile...</span>
                  </div>
                ) : (
                  <div className="flex items-center justify-center">
                    <span className="font-light">Complete Profile Setup</span>
                    <svg className="ml-2 h-5 w-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                      <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={1.5} d="M13 7l5 5m0 0l-5 5m5-5H6" />
                    </svg>
                  </div>
                )}
              </button>
            </form>
          </div>
        </div>
      </div>
    </div>
  );
};

export default UserProfileSetup;
