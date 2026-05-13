import React from 'react';

const AdminToggles = ({ 
  showHoverTooltips, 
  showAuthorInfo, 
  onToggleHoverTooltips, 
  onToggleAuthorInfo,
  disableHighlightManagement,
  onToggleDisableHighlightManagement,
  disableCodeDriftDetection,
  onToggleDisableCodeDriftDetection,
  disableLlm,
  onToggleDisableLlm,
  showCodeDetails,
  onToggleShowCodeDetails,
  hideSameCodeHighlights,
  onToggleHideSameCodeHighlights
}) => {
  return (
    <div className="space-y-3">
      <h4 className="font-semibold text-gray-700 text-sm">Highlight Display Settings</h4>
      
      <div className="space-y-2">
        {/* Toggle for showing hover tooltips */}
        <div className="flex items-center justify-between">
          <div className="flex-1">
            <label className="text-sm text-gray-600">Show hover tooltips</label>
            <p className="text-xs text-gray-500">Display code information when hovering over highlights</p>
          </div>
          <button
            onClick={onToggleHoverTooltips}
            className={`relative inline-flex h-5 w-9 items-center rounded-full transition-colors focus:outline-none focus:ring-2 focus:ring-blue-500 focus:ring-offset-2 ${
              showHoverTooltips ? 'bg-blue-600' : 'bg-gray-200'
            }`}
          >
            <span
              className={`inline-block h-3 w-3 transform rounded-full bg-white transition-transform ${
                showHoverTooltips ? 'translate-x-5' : 'translate-x-1'
              }`}
            />
          </button>
        </div>

        {/* Toggle for showing author info (now independent) */}
        <div className="flex items-center justify-between">
          <div className="flex-1">
            <label className="text-sm text-gray-600">Show author info</label>
            <p className="text-xs text-gray-500">Display author details and individual colors in highlights</p>
          </div>
          <button
            onClick={onToggleAuthorInfo}
            className={`relative inline-flex h-5 w-9 items-center rounded-full transition-colors focus:outline-none focus:ring-2 focus:ring-blue-500 focus:ring-offset-2 ${
              showAuthorInfo ? 'bg-blue-600' : 'bg-gray-200'
            }`}
          >
            <span
              className={`inline-block h-3 w-3 transform rounded-full bg-white transition-transform ${
                showAuthorInfo ? 'translate-x-5' : 'translate-x-1'
              }`}
            />
          </button>
        </div>

        {/* Toggle for enabling highlight management modal */}
        <div className="flex items-center justify-between">
          <div className="flex-1">
            <label className="text-sm text-gray-600">Show highlight management modal</label>
            <p className="text-xs text-gray-500">Allow highlight management modal to open when clicking on coded text</p>
          </div>
          <button
            onClick={onToggleDisableHighlightManagement}
            className={`relative inline-flex h-5 w-9 items-center rounded-full transition-colors focus:outline-none focus:ring-2 focus:ring-blue-500 focus:ring-offset-2 ${
              !disableHighlightManagement ? 'bg-blue-600' : 'bg-gray-200'
            }`}
          >
            <span
              className={`inline-block h-3 w-3 transform rounded-full bg-white transition-transform ${
                !disableHighlightManagement ? 'translate-x-5' : 'translate-x-1'
              }`}
            />
          </button>
        </div>

        {/* Toggle for showing code details */}
        <div className="flex items-center justify-between">
          <div className="flex-1">
            <label className="text-sm text-gray-600">Show code details</label>
            <p className="text-xs text-gray-500">Display code management controls and code details in codebook</p>
          </div>
          <button
            onClick={onToggleShowCodeDetails}
            className={`relative inline-flex h-5 w-9 items-center rounded-full transition-colors focus:outline-none focus:ring-2 focus:ring-blue-500 focus:ring-offset-2 ${
              showCodeDetails ? 'bg-blue-600' : 'bg-gray-200'
            }`}
          >
            <span
              className={`inline-block h-3 w-3 transform rounded-full bg-white transition-transform ${
                showCodeDetails ? 'translate-x-5' : 'translate-x-1'
              }`}
            />
          </button>
        </div>

        {/* Toggle for hiding same-code highlights */}
        <div className="flex items-center justify-between">
          <div className="flex-1">
            <label className="text-sm text-gray-600">Show highlights with different codes</label>
            <p className="text-xs text-gray-500">Only show highlights where multiple researchers applying different codes</p>
          </div>
          <button
            onClick={onToggleHideSameCodeHighlights}
            className={`relative inline-flex h-5 w-9 items-center rounded-full transition-colors focus:outline-none focus:ring-2 focus:ring-blue-500 focus:ring-offset-2 ${
              hideSameCodeHighlights ? 'bg-blue-600' : 'bg-gray-200'
            }`}
          >
            <span
              className={`inline-block h-3 w-3 transform rounded-full bg-white transition-transform ${
                hideSameCodeHighlights ? 'translate-x-5' : 'translate-x-1'
              }`}
            />
          </button>
        </div>

        {/* Toggle for all LLM-backed features */}
        <div className="flex items-center justify-between border-t border-gray-200 pt-3">
          <div className="flex-1">
            <label className="text-sm text-gray-600">Enable LLM features</label>
            <p className="text-xs text-gray-500">Allow AI summaries, discussion prompts, and code drift checks</p>
          </div>
          <button
            onClick={onToggleDisableLlm}
            className={`relative inline-flex h-5 w-9 items-center rounded-full transition-colors focus:outline-none focus:ring-2 focus:ring-blue-500 focus:ring-offset-2 ${
              !disableLlm ? 'bg-blue-600' : 'bg-gray-200'
            }`}
          >
            <span
              className={`inline-block h-3 w-3 transform rounded-full bg-white transition-transform ${
                !disableLlm ? 'translate-x-5' : 'translate-x-1'
              }`}
            />
          </button>
        </div>

        {/* Toggle for code drift detection (LLM-backed; disabled when LLM features are off) */}
        <div className={`flex items-center justify-between pl-4 ${disableLlm ? 'opacity-50' : ''}`}>
          <div className="flex-1">
            <label className="text-sm text-gray-600">Enable code drift detection</label>
            <p className="text-xs text-gray-500">Detect and prevent conceptual drift when applying codes to text</p>
          </div>
          <button
            onClick={onToggleDisableCodeDriftDetection}
            disabled={disableLlm}
            className={`relative inline-flex h-5 w-9 items-center rounded-full transition-colors focus:outline-none focus:ring-2 focus:ring-blue-500 focus:ring-offset-2 ${
              !disableLlm && !disableCodeDriftDetection ? 'bg-blue-600' : 'bg-gray-200'
            } ${disableLlm ? 'cursor-not-allowed' : ''}`}
          >
            <span
              className={`inline-block h-3 w-3 transform rounded-full bg-white transition-transform ${
                !disableLlm && !disableCodeDriftDetection ? 'translate-x-5' : 'translate-x-1'
              }`}
            />
          </button>
        </div>
      </div>
    </div>
  );
};

export default AdminToggles;
