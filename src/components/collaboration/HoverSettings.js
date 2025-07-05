import React from 'react';

const HoverSettings = ({ 
  showHoverTooltips, 
  showAuthorInfo, 
  onToggleHoverTooltips, 
  onToggleAuthorInfo 
}) => {
  return (
    <div className="space-y-3">
      <h4 className="font-semibold text-gray-700 text-sm">Highlight Hover Settings</h4>
      
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

        {/* Toggle for showing author info (only when hover tooltips are enabled) */}
        <div className={`flex items-center justify-between ${!showHoverTooltips ? 'opacity-50' : ''}`}>
          <div className="flex-1">
            <label className="text-sm text-gray-600">Show codes only</label>
            <p className="text-xs text-gray-500">Display only code information, hide author details</p>
          </div>
          <button
            onClick={onToggleAuthorInfo}
            disabled={!showHoverTooltips}
            className={`relative inline-flex h-5 w-9 items-center rounded-full transition-colors focus:outline-none focus:ring-2 focus:ring-blue-500 focus:ring-offset-2 disabled:cursor-not-allowed ${
              showAuthorInfo && showHoverTooltips ? 'bg-blue-600' : 'bg-gray-200'
            }`}
          >
            <span
              className={`inline-block h-3 w-3 transform rounded-full bg-white transition-transform ${
                showAuthorInfo && showHoverTooltips ? 'translate-x-5' : 'translate-x-1'
              }`}
            />
          </button>
        </div>
      </div>
    </div>
  );
};

export default HoverSettings;
