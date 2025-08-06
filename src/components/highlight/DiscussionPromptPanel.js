import React, { useState } from 'react';
import CodeChip from '../common/CodeChip.js';
import { getUserDisplayColor } from '../../lib/utils/hoverUtils.js';

const DiscussionPromptPanel = ({ 
  discussionPrompt, 
  onClose, 
  userProfiles,
  allCodes 
}) => {
  const [isExpanded, setIsExpanded] = useState(false);
  
  if (!discussionPrompt) return null;

  const { title, prompt, researchers, codedText, context } = discussionPrompt;

  return (
    <div className="bg-gradient-to-br from-amber-50 to-orange-50 border border-amber-200 rounded-xl p-4 mb-4 shadow-sm">
      {/* Header */}
      <div className="flex items-start justify-between mb-3">
        <button
          onClick={() => setIsExpanded(!isExpanded)}
          className="flex items-center gap-2 text-left flex-1 hover:bg-amber-100/50 rounded-lg p-1 -m-1 transition-colors"
        >
          <span className="text-xl">💡</span>
          <div className="flex-1">
            <h4 className="text-sm font-semibold text-amber-900">
              Insight Opportunity
            </h4>
            <p className="text-xs text-amber-700 font-medium">
              {title}
            </p>
            {!isExpanded && (
              <p className="text-xs text-amber-600 mt-1 italic">
                Click to explore different perspectives
              </p>
            )}
          </div>
          <div className="flex items-center gap-2">
            <svg 
              className={`w-4 h-4 text-amber-600 transition-transform ${isExpanded ? 'rotate-180' : ''}`} 
              fill="none" 
              stroke="currentColor" 
              viewBox="0 0 24 24"
            >
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M19 9l-7 7-7-7" />
            </svg>
          </div>
        </button>
        <button
          onClick={onClose}
          className="text-amber-500 hover:text-amber-700 transition-colors ml-2"
          title="Dismiss"
        >
          <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M6 18L18 6M6 6l12 12" />
          </svg>
        </button>
      </div>

      {/* Expandable Content */}
      {isExpanded && (
        <div className="space-y-3 border-t border-amber-200 pt-3">
          {/* Discussion Prompt */}
          <div className="bg-white/70 rounded-lg p-3 border border-amber-100">
            <p className="text-sm text-gray-800 leading-relaxed italic">
              &ldquo;{prompt}&rdquo;
            </p>
          </div>

          {/* Coded Text Context */}
          <div>
            <h5 className="text-xs font-medium text-amber-800 mb-2">Coded Text:</h5>
            <div className="bg-white/50 rounded-lg p-3 border border-amber-100">
              <p className="text-sm text-gray-700 leading-relaxed">
                {context ? (
                  // Show full context with highlighted coded text
                  <span>
                    {context.split(codedText).map((part, index, array) => (
                      <span key={index}>
                        {part}
                        {index < array.length - 1 && (
                          <span className="bg-yellow-100 px-1 rounded font-medium text-gray-900">
                            &ldquo;{codedText}&rdquo;
                          </span>
                        )}
                      </span>
                    ))}
                  </span>
                ) : (
                  // Fallback to just showing the coded text
                  <span className="bg-yellow-100 px-1 rounded font-medium text-gray-900">
                    &ldquo;{codedText}&rdquo;
                  </span>
                )}
              </p>
            </div>
          </div>

          {/* Researchers and Their Codes */}
          <div className="space-y-2">
            <h5 className="text-xs font-medium text-amber-800">Different Perspectives:</h5>
            {researchers.map((researcher, index) => {
              const code = allCodes?.find(c => c.id === researcher.codeId);
              const user = userProfiles[researcher.userId];
              const userColor = getUserDisplayColor(user, true); // Always show individual colors in this context
              
              return (
                <div key={researcher.userId} className="flex items-start gap-3 p-2 bg-white/50 rounded-lg border border-amber-100">
                  <div className="flex-shrink-0">
                    <div 
                      className="w-6 h-6 rounded-full flex items-center justify-center border-2 border-white shadow-sm"
                      style={{ backgroundColor: userColor }}
                    >
                      <span className="text-xs font-medium text-white">
                        {String.fromCharCode(65 + index)}
                      </span>
                    </div>
                  </div>
                  <div className="flex-1 min-w-0">
                    <div className="flex items-center gap-2 mb-1">
                      <span className="text-xs font-medium text-gray-900">
                        {researcher.name}
                      </span>
                      {code && (
                        <CodeChip 
                          code={code}
                          size="xs"
                        />
                      )}
                    </div>
                    {researcher.positionality && researcher.positionality !== 'Not specified' && (
                      <p className="text-xs text-gray-600 leading-relaxed">
                        <span className="font-medium">Background:</span> {researcher.positionality}
                      </p>
                    )}
                  </div>
                </div>
              );
            })}
          </div>

          {/* Footer */}
          <div className="pt-2 border-t border-amber-200">
            <p className="text-xs text-amber-700 text-center">
              This prompt is generated dynamically based on your coding differences - use it to explore how different perspectives reveal data complexity.
            </p>
          </div>
        </div>
      )}
    </div>
  );
};

export default DiscussionPromptPanel;
