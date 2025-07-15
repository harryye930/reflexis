import React from 'react';
import StrategySelector from '../../../../common/StrategySelector.js';

const MergeStep2_ChooseStrategy = ({ 
  selectedCodes,
  mergeStrategy,
  onStrategySelect
}) => {
  // Create strategy options
  const strategies = [
    // Options to merge into each selected code
    ...selectedCodes.map((code) => ({
      id: `merge_into_${code.id}`,
      title: "Merge all into",
      description: `Keep "${code.label}" and merge all highlights from other codes into it. Other codes will be deleted.`,
      codeChip: code
    })),
    // Option to create new code
    {
      id: 'create_new',
      title: 'Create new merged code',
      description: 'Create a new code that combines the selected codes. All highlights will be transferred to the new code and old codes will be deleted.'
    }
  ];

  return (
    <StrategySelector
      strategies={strategies}
      selectedStrategy={mergeStrategy}
      onStrategySelect={onStrategySelect}
      title="Choose Merge Strategy"
      description="How would you like to merge the selected codes?"
    />
  );
};

export default MergeStep2_ChooseStrategy;
