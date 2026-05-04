import React, { useState } from 'react';
import CodeChip from '../common/CodeChip.js';
import ResearchBackgroundDisplay from '../common/ResearchBackgroundDisplay.js';
import { getUserDisplayColor } from '../../lib/utils/hoverUtils.js';

const DiscussionPromptPanel = ({ 
  discussionPrompt, 
  onClose, 
  userProfiles,
  allCodes,
  disableLlm = false
}) => {
  const [isExpanded, setIsExpanded] = useState(false);
  const [hoveredUser, setHoveredUser] = useState(null);
  
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
            <p className="text-sm text-gray-800 leading-relaxed italic" style={{ whiteSpace: 'pre-line' }}>
              {prompt}
            </p>
          </div>

          {/* Researchers and Their Codes */}
          <div className="space-y-2">
            <h5 className="text-xs font-medium text-amber-800">Different Coders:</h5>
            {researchers.map((researcher, index) => {
              const code = allCodes?.find(c => c.id === researcher.codeId);
              const user = userProfiles[researcher.userId];
              const userColor = getUserDisplayColor(user, true); // Always show individual colors in this context
              const hasResearchBackground = researcher.researchBackground && researcher.researchBackground !== 'Not specified';
              
              return (
                <div key={researcher.userId} className="relative">
                  <div className="flex items-start gap-3 p-2 bg-white/50 rounded-lg border border-amber-100">
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
                        <span 
                          className={`text-xs font-medium text-gray-900 ${hasResearchBackground ? 'cursor-help' : ''}`}
                          onMouseEnter={() => hasResearchBackground && setHoveredUser(researcher.userId)}
                          onMouseLeave={() => setHoveredUser(null)}
                        >
                          {researcher.name}
                        </span>
                      </div>
                      {code && (
                        <div className="mt-1">
                          <CodeChip 
                            code={code}
                            size="xs"
                          />
                        </div>
                      )}
                    </div>
                  </div>
                  
                  {/* Tooltip */}
                  {hoveredUser === researcher.userId && hasResearchBackground && (
                    <div className="absolute left-0 top-full mt-1 z-50 w-72 bg-white border border-gray-200 rounded-lg shadow-lg p-3">
                      <div className="text-xs font-medium text-gray-700 mb-2 flex items-center">
                        <span 
                          className="w-3 h-3 rounded-full mr-2" 
                          style={{ backgroundColor: userColor }}
                        ></span>
                        Research Background (simplified)
                      </div>
                      
                      {user?.reducedResearchBackground ? (
                        <div className="text-xs text-gray-600 leading-relaxed">
                          {user.reducedResearchBackground}
                        </div>
                      ) : researcher.researchBackground ? (
                        <ResearchBackgroundDisplay 
                          researchBackground={researcher.researchBackground}
                          variant="inline"
                          size="xs"
                          showHeaders={false}
                          userName={researcher.name}
                          disableLlm={disableLlm}
                        />
                      ) : (
                        <div className="text-xs text-gray-500 italic">
                          No research background available
                        </div>
                      )}
                    </div>
                  )}
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
