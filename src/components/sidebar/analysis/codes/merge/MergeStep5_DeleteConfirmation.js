import React from 'react';

const MergeStep5_DeleteConfirmation = ({ 
  selectedCodes,
  allCodes = [],
  mergeStrategy,
  resultConfig,
  deleteSourceCodes,
  onDeleteChoice
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
      <h3 className="text-lg font-medium text-gray-900 mb-4">Delete Original Codes?</h3>
      <p className="text-sm text-gray-600 mb-6">
        {isNewCode ? (
          <>All highlights and reflexive responses will be transferred to the new code &ldquo;{resultConfig.label}&rdquo;. Would you like to delete the original codes?</>
        ) : (
          <>All highlights and reflexive responses will be transferred to &ldquo;{targetCode?.label}&rdquo;. Would you like to delete the source codes?</>
        )}
      </p>

      <div className="space-y-3 mb-6">
        <div
          onClick={() => onDeleteChoice(false)}
          className={`p-4 border rounded-lg cursor-pointer transition-all ${
            !deleteSourceCodes
              ? 'border-green-500 bg-green-50'
              : 'border-gray-200 hover:border-gray-300'
          }`}
        >
          <div className="flex items-start gap-3">
            <div 
              className={`w-4 h-4 rounded-full border-2 mt-1 ${
                !deleteSourceCodes
                  ? 'border-green-500 bg-green-500'
                  : 'border-gray-300'
              }`}
            >
              {!deleteSourceCodes && (
                <div className="w-2 h-2 bg-white rounded-full m-0.5"></div>
              )}
            </div>
            <div>
              <h4 className="font-medium text-gray-900 mb-1">Keep Original Codes</h4>
              <p className="text-sm text-gray-600">
                The {isNewCode ? 'original' : 'source'} codes will remain in your codebook as empty codes.
                You can still reference them later or add new highlights to them.
              </p>
            </div>
          </div>
        </div>

        <div
          onClick={() => onDeleteChoice(true)}
          className={`p-4 border rounded-lg cursor-pointer transition-all ${
            deleteSourceCodes
              ? 'border-red-500 bg-red-50'
              : 'border-gray-200 hover:border-gray-300'
          }`}
        >
          <div className="flex items-start gap-3">
            <div 
              className={`w-4 h-4 rounded-full border-2 mt-1 ${
                deleteSourceCodes
                  ? 'border-red-500 bg-red-500'
                  : 'border-gray-300'
              }`}
            >
              {deleteSourceCodes && (
                <div className="w-2 h-2 bg-white rounded-full m-0.5"></div>
              )}
            </div>
            <div>
              <h4 className="font-medium text-gray-900 mb-1">Delete Original Codes</h4>
              <p className="text-sm text-gray-600">
                The {isNewCode ? 'original' : 'source'} codes will be permanently deleted from your codebook.
                {isNewCode ? (
                  <> All {selectedCodes.length} codes will be deleted.</>
                ) : (
                  <> {codesToMerge.length} code{codesToMerge.length !== 1 ? 's' : ''} will be deleted (target code will be kept).</>
                )}
              </p>
            </div>
          </div>
        </div>
      </div>

      <div className={`rounded-lg p-4 ${deleteSourceCodes ? 'bg-red-50' : 'bg-blue-50'}`}>
        <h4 className={`text-sm font-medium mb-2 ${deleteSourceCodes ? 'text-red-900' : 'text-blue-900'}`}>
          Final Summary
        </h4>
        <p className={`text-sm ${deleteSourceCodes ? 'text-red-800' : 'text-blue-800'}`}>
          {isNewCode ? (
            <>
              All highlights and reflexive responses from {selectedCodes.length} codes will be transferred to the new code &ldquo;{resultConfig.label}&rdquo;.
              {deleteSourceCodes 
                ? ` All original codes will be deleted.`
                : ` All original codes will be kept as empty codes.`
              }
            </>
          ) : (
            <>
              All highlights and reflexive responses from {codesToMerge.length} code{codesToMerge.length !== 1 ? 's' : ''} will be transferred to &ldquo;{targetCode?.label}&rdquo;.
              {deleteSourceCodes 
                ? ` The source codes will be deleted.`
                : ` The source codes will be kept as empty codes.`
              }
            </>
          )}
        </p>
      </div>
    </div>
  );
};

export default MergeStep5_DeleteConfirmation;
