import React from 'react';
import CodeSelector from '../../../../common/CodeSelector.js';

const SplitStep1_SelectCode = ({ 
  allCodes, 
  selectedCode, 
  onCodeSelect,
  currentUser,
  userProfiles
}) => {
  return (
    <CodeSelector
      codes={allCodes}
      selectedCodes={selectedCode}
      onCodeSelect={onCodeSelect}
      selectionMode="single"
      currentUser={currentUser}
      userProfiles={userProfiles}
      title="Select Code to Split"
      description="Choose a code to split. You'll then reassign its highlights to other codes."
    />
  );
};

export default SplitStep1_SelectCode;
