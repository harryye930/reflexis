import React from 'react';
import CodeChip from '../../../../common/CodeChip.js';

const SplitStep3_ReviewSplit = ({ 
  selectedCode,
  highlights,
  reassignments,
  availableCodes
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
            </div>
          </div>
        ))}
      </div>

      <div className="bg-orange-50 rounded-lg p-4">
        <h4 className="text-sm font-medium text-orange-900 mb-2">✂️ Split Summary</h4>
        <p className="text-sm text-orange-800">
          Code &ldquo;{selectedCode?.label}&rdquo; will be split into {Object.keys(reassignmentSummary).length} codes. 
          {highlights.length > 0 && Object.keys(reassignments).length === highlights.length 
            ? ' All highlights will be reassigned.'
            : ` ${highlights.length - Object.keys(reassignments).length} highlights will remain with the original code.`
          }
        </p>
      </div>
    </div>
  );
};

export default SplitStep3_ReviewSplit;
