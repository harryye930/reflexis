import React from 'react';
import CodeChip from '../../../../common/CodeChip.js';

const SplitStep3_ReviewSplit = ({ 
  selectedCode,
  highlights,
  reassignments,
  availableCodes,
  pendingCodeCreations
}) => {
  const reassignmentSummary = Object.entries(reassignments).reduce((acc, [highlightId, assignment]) => {
    const code = availableCodes.find(c => c.id === assignment.newCodeId);
    if (code) {
      if (!acc[code.id]) {
        acc[code.id] = { code, count: 0 };
      }
      acc[code.id].count++;
    }
    return acc;
  }, {});

  const remainingHighlights = highlights.length - Object.keys(reassignments).length;
  const pendingCodesCount = Object.keys(pendingCodeCreations).length;

  return (
    <div>
      <h3 className="text-lg font-medium text-gray-900 mb-4">Review Split Summary</h3>
      <p className="text-sm text-gray-600 mb-4">
        Review the reassignments before proceeding to the final step.
      </p>

      <div className="space-y-3 mb-6">
        <h4 className="text-sm font-medium text-gray-700">Reassignment Summary:</h4>
        
        {Object.values(reassignmentSummary).map(({ code, count }) => (
          <div key={code.id} className="flex items-center justify-between p-3 bg-gray-50 rounded-lg">
            <div className="flex items-center gap-3">
              <CodeChip 
                code={code}
                size="sm"
                variant="unified"
              />
              <span className="text-sm text-gray-700">
                {count} highlight{count !== 1 ? 's' : ''}
              </span>
              {code.isPending && (
                <span className="text-xs text-green-600 font-medium bg-green-100 px-2 py-1 rounded">
                  New code
                </span>
              )}
            </div>
          </div>
        ))}

        {remainingHighlights > 0 && (
          <div className="flex items-center justify-between p-3 bg-blue-50 rounded-lg border border-blue-200">
            <div className="flex items-center gap-3">
              <CodeChip 
                code={selectedCode}
                size="sm"
                variant="unified"
              />
              <span className="text-sm text-blue-700">
                {remainingHighlights} highlight{remainingHighlights !== 1 ? 's' : ''} (remaining with original)
              </span>
            </div>
          </div>
        )}
      </div>

      {/* Show pending code creations */}
      {pendingCodesCount > 0 && (
        <div className="bg-green-50 rounded-lg p-4 mb-6">
          <h4 className="text-sm font-medium text-green-900 mb-2">📝 New Codes to be Created</h4>
          <div className="space-y-2">
            {Object.values(pendingCodeCreations).map((code) => (
              <div key={code.id} className="flex items-center gap-3 p-2 bg-white rounded border border-green-200">
                <CodeChip 
                  code={code}
                  size="sm"
                  variant="unified"
                />
                <span className="text-sm text-green-800">
                  {code.description || 'No description'}
                </span>
              </div>
            ))}
          </div>
        </div>
      )}

      <div className="bg-orange-50 rounded-lg p-4">
        <h4 className="text-sm font-medium text-orange-900 mb-2">✂️ Split Summary</h4>
        <p className="text-sm text-orange-800">
          {Object.keys(reassignmentSummary).length > 0 ? (
            <>
              Code &ldquo;{selectedCode?.label}&rdquo; will be split into {Object.keys(reassignmentSummary).length} codes.&nbsp;
              {Object.keys(reassignments).length} highlight{Object.keys(reassignments).length !== 1 ? 's' : ''} will be reassigned.
            </>
          ) : (
            <>
              No highlights will be reassigned from &ldquo;{selectedCode?.label}&rdquo;.
            </>
          )}
          {remainingHighlights > 0 && (
            <> {remainingHighlights} highlight{remainingHighlights !== 1 ? 's' : ''} will remain with the original code.</>
          )}
          {pendingCodesCount > 0 && (
            <> {pendingCodesCount} new code{pendingCodesCount !== 1 ? 's' : ''} will be created during this process.</>
          )}
        </p>
      </div>
    </div>
  );
};

export default SplitStep3_ReviewSplit;
