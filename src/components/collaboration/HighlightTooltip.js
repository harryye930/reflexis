import React from 'react';

const HighlightTooltip = ({ 
  highlights, 
  userProfiles, 
  allCodes, 
  showAuthorInfo,
  currentUser,
  position,
  visible 
}) => {
  if (!visible || !highlights || highlights.length === 0) {
    return null;
  }

  // Sort highlights to prioritize the most relevant ones
  const sortedHighlights = highlights.sort((a, b) => {
    return new Date(a.createdAt) - new Date(b.createdAt);
  });

  return (
    <div
      className="fixed z-50 pointer-events-none highlight-tooltip"
      style={{
        left: position.x,
        top: position.y,
        transform: 'translateY(-100%)'
      }}
    >
      <div className="bg-white rounded-lg shadow-xl border border-gray-200 p-3 max-w-sm">
        <div className="space-y-3">
          {sortedHighlights.map((highlight, index) => {
            const user = userProfiles[highlight.userId];
            const code = allCodes?.find(c => c.id === highlight.code);
            
            // Get code colors, fallback to gray if not found
            const codeColor = code?.color || 'bg-gray-200';
            const codeTextColor = code?.textColor || 'text-gray-800';

            return (
              <div key={highlight.id} className="space-y-2">
                <div className="flex items-center gap-2">
                  {/* Code badge with matching colors */}
                  <span className={`${codeColor} ${codeTextColor} px-2 py-1 rounded-full text-xs font-medium`}>
                    {code?.label || 'Unknown Code'}
                  </span>
                  
                  {/* Author info (if enabled) */}
                  {!showAuthorInfo && (
                    <div className="flex items-center gap-1 text-xs text-gray-600">
                      {/* User color indicator */}
                      <span 
                        className="w-2 h-2 rounded-full" 
                        style={{ backgroundColor: user?.color || '#e5e7eb' }}
                      />
                      <span>
                        {user?.name || 'Anonymous'}
                        {currentUser && highlight.userId === currentUser.uid && ' (you)'}
                      </span>
                    </div>
                  )}
                </div>
                
                {/* Code description - show for all highlights */}
                {code?.description && (
                  <p className="text-xs text-gray-500 leading-relaxed">
                    {code.description}
                  </p>
                )}
              </div>
            );
          })}
        </div>
        
        {/* Multiple highlights indicator */}
        {sortedHighlights.length > 1 && (
          <div className="mt-3 pt-2 border-t border-gray-100">
            <p className="text-xs text-gray-500 font-medium">
              {sortedHighlights.length} overlapping highlights
            </p>
          </div>
        )}
      </div>
      
      {/* Triangle pointer */}
      <div 
        className="absolute left-1/2 transform -translate-x-1/2"
        style={{ top: '100%' }}
      >
        <div className="w-0 h-0 border-l-4 border-r-4 border-t-4 border-transparent border-t-gray-200" />
        <div 
          className="w-0 h-0 border-l-4 border-r-4 border-t-4 border-transparent border-t-white absolute"
          style={{ top: '-1px', left: '-4px' }}
        />
      </div>
    </div>
  );
};

export default HighlightTooltip;
