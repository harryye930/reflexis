import React, { useState } from 'react';
import CodePaletteHeader from './CodePaletteHeader.js';
import CodeForm from './CodeForm.js';
import CodeList from './CodeList.js';
import CodePaletteFooter from './CodePaletteFooter.js';
import CodeMergeModal from './merge/CodeMergeModal.js';
import CodeSplitModal from './split/CodeSplitModal.js';

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
  showCodeDetails = true // New prop for showing/hiding code details
}) => {
  const [showDescriptions, setShowDescriptions] = useState(true);
  const [showAddForm, setShowAddForm] = useState(false);
  const [showMergeModal, setShowMergeModal] = useState(false);
  const [showSplitModal, setShowSplitModal] = useState(false);

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

  return (
    <div className="mb-6">
      {showCodeDetails && (
        <CodePaletteHeader
          showDescriptions={showDescriptions}
          onToggleDescriptions={() => setShowDescriptions(!showDescriptions)}
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
      
      {/* Code List */}
      <CodeList
        allCodes={allCodes}
        deletedCodes={deletedCodes}
        showDescriptions={showDescriptions}
        onEdit={null}
        onDelete={null}
        currentUser={currentUser}
        userProfiles={userProfiles}
        onCodeNameClick={onCodeNameClick}
        hideEditButtons={true}
        getCodeDisagreement={getCodeDisagreement}
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
