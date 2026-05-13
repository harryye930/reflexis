import React, { useState, useEffect } from 'react';
import CodePaletteHeader from './CodePaletteHeader.js';
import CodeForm from './CodeForm.js';
import CodeList from './CodeList.js';
import CodePaletteFooter from './CodePaletteFooter.js';
import CodeMergeModal from './merge/CodeMergeModal.js';
import CodeSplitModal from './split/CodeSplitModal.js';

const formatNameList = (names) => {
  if (names.length <= 1) return names[0] || '';
  if (names.length === 2) return names.join(' and ');
  return `${names.slice(0, -1).join(', ')}, and ${names[names.length - 1]}`;
};

const CodeManagement = ({ 
  allCodes, 
  deletedCodes = [], // New prop for deleted codes
  currentUser,
  userProfiles,
  onAddCode,
  onMergeCodes, // New prop for merging codes
  onSplitCode, // New prop for splitting codes
  onMessage,
  title = "Available Codes",
  onCodeNameClick, // New prop for Living Codebook
  getCodeDisagreement = null, // New prop for disagreement data function
  showCodeDetails = true, // New prop for showing/hiding code details and management controls
  hiddenCodeOwnerIds = [] // When set, hide qualitative codes created by those collaborators
}) => {
  const [showDescriptions, setShowDescriptions] = useState(true);
  const [showAddForm, setShowAddForm] = useState(false);
  const [showMergeModal, setShowMergeModal] = useState(false);
  const [showSplitModal, setShowSplitModal] = useState(false);

  // Sync showDescriptions (now controls metadata) with showCodeDetails
  // When showCodeDetails is disabled, automatically hide metadata (author info, disagreement metrics)
  // When showCodeDetails is enabled, allow user to toggle metadata
  useEffect(() => {
    if (!showCodeDetails) {
      setShowDescriptions(false);
    }
  }, [showCodeDetails]);

  const handleToggleDescriptions = () => {
    // Only allow toggling metadata when showCodeDetails is enabled
    if (showCodeDetails) {
      setShowDescriptions(!showDescriptions);
    }
  };

  const resetForm = () => {
    setShowAddForm(false);
  };

  const handleFormSubmit = async (formData) => {
    return await onAddCode(formData);
  };

  const handleToggleAddForm = () => {
    setShowAddForm(!showAddForm);
  };

  const handleToggleMergeModal = () => {
    setShowMergeModal(!showMergeModal);
  };

  const handleToggleSplitModal = () => {
    setShowSplitModal(!showSplitModal);
  };

  const handleMergeCodes = async (mergeData) => {
    if (!onMergeCodes) {
      onMessage('Merge functionality not available', true);
      return { success: false };
    }
    return await onMergeCodes(mergeData);
  };

  const handleSplitCode = async (splitData) => {
    if (!onSplitCode) {
      onMessage('Split functionality not available', true);
      return { success: false };
    }
    return await onSplitCode(splitData);
  };

  const hiddenCodeOwnerSet = new Set(hiddenCodeOwnerIds);
  const hiddenCodeOwnerNames = hiddenCodeOwnerIds.map((userId) => {
    if (userId === currentUser?.uid) return 'you';
    return userProfiles?.[userId]?.name || 'unknown collaborator';
  });
  const hiddenCodeOwnerSummary = hiddenCodeOwnerNames.length > 0
    ? `Hiding codes from ${formatNameList(hiddenCodeOwnerNames)}.`
    : null;
  const visibleCodes = hiddenCodeOwnerSet.size > 0
    ? (allCodes || []).filter(code => !hiddenCodeOwnerSet.has(code.createdBy))
    : allCodes;
  const visibleDeletedCodes = hiddenCodeOwnerSet.size > 0
    ? (deletedCodes || []).filter(code => !hiddenCodeOwnerSet.has(code.createdBy))
    : deletedCodes;
  const hiddenCodesMessage = hiddenCodeOwnerSet.size > 0
    ? 'No qualitative codes are visible with the current collaborator filters.'
    : 'No codes available yet.';

  return (
    <div className="mb-6">
      {showCodeDetails && (
        <CodePaletteHeader
          showDescriptions={showDescriptions}
          onToggleDescriptions={handleToggleDescriptions}
          showAddForm={showAddForm}
          onToggleAddForm={handleToggleAddForm}
          onToggleMergeModal={handleToggleMergeModal}
          onToggleSplitModal={handleToggleSplitModal}
          currentUser={currentUser}
          title={title}
        />
      )}

      {!showCodeDetails && (
        <div className="mb-4">
          <h3 className="font-semibold text-gray-700">{title}</h3>
        </div>
      )}

      {/* Add Form (only for adding new codes) - only show if code details are enabled */}
      {showCodeDetails && showAddForm && currentUser && (
        <CodeForm
          editingCode={null}
          onSubmit={handleFormSubmit}
          onCancel={resetForm}
          onMessage={onMessage}
        />
      )}

      {hiddenCodeOwnerSummary && (
        <div className="mb-3 rounded-md border border-blue-100 bg-blue-50 px-3 py-2 text-xs text-blue-800">
          {hiddenCodeOwnerSummary}
        </div>
      )}

      {/* Code List */}
      <CodeList
        allCodes={visibleCodes}
        deletedCodes={visibleDeletedCodes}
        showDescriptions={showDescriptions}
        onEdit={null}
        onDelete={null}
        currentUser={currentUser}
        userProfiles={userProfiles}
        onCodeNameClick={onCodeNameClick}
        hideEditButtons={true}
        getCodeDisagreement={getCodeDisagreement}
        emptyMessage={hiddenCodesMessage}
      />
      
      {showCodeDetails && (
        <CodePaletteFooter
          currentUser={currentUser}
        />
      )}

      {/* Code Merge Modal - only show if code details are enabled */}
      {showCodeDetails && showMergeModal && (
        <CodeMergeModal
          allCodes={allCodes}
          currentUser={currentUser}
          userProfiles={userProfiles}
          onMergeCodes={handleMergeCodes}
          onClose={() => setShowMergeModal(false)}
          onMessage={onMessage}
          isOpen={showMergeModal}
        />
      )}

      {/* Code Split Modal - only show if code details are enabled */}
      {showCodeDetails && showSplitModal && (
        <CodeSplitModal
          allCodes={allCodes}
          currentUser={currentUser}
          userProfiles={userProfiles}
          onSplitCode={handleSplitCode}
          onClose={() => setShowSplitModal(false)}
          onMessage={onMessage}
          isOpen={showSplitModal}
        />
      )}
    </div>
  );
};

export default CodeManagement;
