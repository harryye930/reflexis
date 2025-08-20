import React from 'react';
import CodeChip from '../common/CodeChip.js';

const CodeDriftContext = ({ pendingHighlight, currentCode }) => {
  return (
    <div className="bg-gray-50 border border-gray-200 rounded-lg p-4 mb-6">
      <div className="space-y-3">
        <h4 className="font-medium text-gray-800 text-sm">Attempted Coding Context</h4>
        
        {/* Selected Text */}
        <div>
          <p className="text-xs text-gray-600 mb-1 font-medium">Selected Text:</p>
          <div className="bg-white border border-gray-200 rounded p-3 text-sm text-gray-900 leading-relaxed">
            &ldquo;{pendingHighlight?.text || 'No text selected'}&rdquo;
          </div>
        </div>

        {/* Applied Code */}
        <div>
          <p className="text-xs text-gray-600 mb-2 font-medium">Attempted to Apply Code:</p>
          <div className="flex items-center gap-2">
            {currentCode ? (
              <CodeChip 
                code={currentCode} 
                size="sm" 
                variant="unified"
                showTooltip={true}
              />
            ) : (
              <span className="text-sm text-gray-500 italic">Code not found</span>
            )}
          </div>
          {currentCode?.description && (
            <p className="text-xs text-gray-600 mt-1 italic">
              &ldquo;{currentCode.description}&rdquo;
            </p>
          )}
        </div>
      </div>
    </div>
  );
};

export default CodeDriftContext;
