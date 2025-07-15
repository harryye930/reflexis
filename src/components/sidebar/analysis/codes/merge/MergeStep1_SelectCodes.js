import React from 'react';
import CodeSelector from '../../../../common/CodeSelector.js';

const MergeStep1_SelectCodes = ({ 
  allCodes, 
  selectedCodes, 
  onCodeSelect,
  currentUser,
  userProfiles
}) => {
  const handleCodeSelection = (code) => {
    const isSelected = selectedCodes.find(c => c.id === code.id);
    if (isSelected) {
      onCodeSelect(selectedCodes.filter(c => c.id !== code.id));
    } else {
      onCodeSelect([...selectedCodes, code]);
    }
  };

  return (
    <CodeSelector
      codes={allCodes}
      selectedCodes={selectedCodes}
      onCodeSelect={handleCodeSelection}
      selectionMode="multiple"
      currentUser={currentUser}
      userProfiles={userProfiles}
      title="Select Codes to Merge"
      description="Choose 2 or more codes to merge. Selected codes will be combined according to your chosen strategy."
    />
  );
};

export default MergeStep1_SelectCodes;
