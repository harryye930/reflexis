import React from 'react';
import { Autorenew } from '@mui/icons-material';
import CodeChip from '../../../../common/CodeChip.js';

const MergeStep4_ReviewMerge = ({ 
  selectedCodes,
  allCodes = [],
  mergeStrategy,
  resultConfig
}) => {
  // Determine the target code and codes to be merged
  const getTargetCode = () => {
    if (mergeStrategy?.startsWith('merge_into_')) {
      const targetCodeId = mergeStrategy.replace('merge_into_', '');
      return allCodes.find(c => c.id === targetCodeId);
    }
    return null;
  };

  const getCodesToMerge = () => {
    const targetCode = getTargetCode();
    if (targetCode) {
      return selectedCodes.filter(c => c.id !== targetCode.id);
    }
    return selectedCodes;
  };

  const targetCode = getTargetCode();
  const codesToMerge = getCodesToMerge();
  const isNewCode = mergeStrategy === 'create_new';

  return (
    <div>
      <h3 className="text-lg font-medium text-gray-900 mb-4">Review Merge Summary</h3>
      <p className="text-sm text-gray-600 mb-4">
        Review the merge operation before proceeding to the final step.
      </p>

      <div className="space-y-4 mb-6">
        {isNewCode ? (
          <div>
            <h4 className="text-sm font-medium text-gray-700 mb-2">Creating New Code:</h4>
            <div className="p-3 bg-green-50 rounded-lg">
              <CodeChip 
                code={resultConfig}
                size="sm"
                variant="unified"
              />
              <p className="text-sm text-gray-600 mt-2">
                {resultConfig.description}
              </p>
            </div>
          </div>
        ) : (
          <div>
            <h4 className="text-sm font-medium text-gray-700 mb-2">Target Code (will receive all highlights):</h4>
            <div className="p-3 bg-green-50 rounded-lg">
              <CodeChip 
                code={targetCode}
                size="sm"
                variant="unified"
              />
              <p className="text-sm text-gray-600 mt-2">
                {targetCode?.description}
              </p>
            </div>
          </div>
        )}

        <div>
          <h4 className="text-sm font-medium text-gray-700 mb-2">
            Codes to be merged {isNewCode ? 'into new code' : 'into target'}:
          </h4>
          <div className="space-y-2">
            {codesToMerge.map(code => (
              <div key={code.id} className="flex items-center gap-3 p-3 bg-gray-50 rounded-lg">
                <CodeChip 
                  code={code}
                  size="sm"
                  variant="unified"
                />
                <span className="text-sm text-gray-600">
                  Will transfer all highlights and reflexive responses
                </span>
              </div>
            ))}
          </div>
        </div>
      </div>

      <div className="bg-blue-50 rounded-lg p-4">
        <h4 className="text-sm font-medium text-blue-900 mb-2 flex items-center gap-2">
          <Autorenew sx={{ fontSize: 16 }} />
          <span>Merge Summary</span></h4>
        <p className="text-sm text-blue-800">
          {isNewCode ? (
            <>
              A new code &ldquo;{resultConfig.label}&rdquo; will be created. 
              All highlights and reflexive responses from {selectedCodes.length} codes will be transferred to this new code.
            </>
          ) : (
            <>
              All highlights and reflexive responses from {codesToMerge.length} code{codesToMerge.length !== 1 ? 's' : ''} 
              will be transferred to &ldquo;{targetCode?.label}&rdquo;.
            </>
          )}
        </p>
      </div>
    </div>
  );
};

export default MergeStep4_ReviewMerge;
