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
      description: `Keep "${code.label}" and merge all highlights from selected codes into it. You can choose to keep or delete the source codes in the final step.`,
      codeChip: code
    })),
    // Option to create new code
    {
      id: 'create_new',
      title: 'Create new code to merge into',
      description: 'Create a new code that combines the selected codes. You can choose to keep or delete the original codes in the final step.'
    }
  ];

  return (
    <StrategySelector
      strategies={strategies}
      selectedStrategy={mergeStrategy}
      onStrategySelect={onStrategySelect}
  title="Choose Merge Strategy"
  description="Pick the destination for the merge. You can merge into any active code or create a new one."
    />
  );
};

export default MergeStep2_ChooseStrategy;
