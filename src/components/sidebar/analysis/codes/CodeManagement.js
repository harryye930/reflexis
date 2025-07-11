import React, { useState } from 'react';
import CodePaletteHeader from './CodePaletteHeader.js';
import CodeForm from './CodeForm.js';
import CodeList from './CodeList.js';
import CodePaletteFooter from './CodePaletteFooter.js';
import CodeMergeModal from './CodeMergeModal.js';

const CodeManagement = ({ 
  allCodes, 
  deletedCodes = [], // New prop for deleted codes
  currentUser,
  userProfiles,
  onAddCode,
  onMergeCodes, // New prop for merging codes
  onMessage,
  title = "Available Codes",
  onCodeNameClick // New prop for Living Codebook
}) => {
  const [showDescriptions, setShowDescriptions] = useState(false);
  const [showAddForm, setShowAddForm] = useState(false);
  const [showMergeModal, setShowMergeModal] = useState(false);

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

  const handleMergeCodes = async (mergeData) => {
    if (!onMergeCodes) {
      onMessage('Merge functionality not available', true);
      return { success: false };
    }
    return await onMergeCodes(mergeData);
  };

  return (
    <div className="mb-6">
      <CodePaletteHeader
        showDescriptions={showDescriptions}
        onToggleDescriptions={() => setShowDescriptions(!showDescriptions)}
        showAddForm={showAddForm}
        onToggleAddForm={handleToggleAddForm}
        onToggleMergeModal={handleToggleMergeModal}
        currentUser={currentUser}
        title={title}
      />

      {/* Add Form (only for adding new codes) */}
      {showAddForm && currentUser && (
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
        onEdit={null} // No edit handler since editing is disabled
        onDelete={null} // Remove delete functionality from list view
        currentUser={currentUser}
        userProfiles={userProfiles}
        onCodeNameClick={onCodeNameClick}
        hideEditButtons={true} // Hide delete buttons in selection mode
      />
      
      <CodePaletteFooter
        currentUser={currentUser}
      />

      {/* Code Merge Modal */}
      {showMergeModal && (
        <CodeMergeModal
          allCodes={allCodes}
          currentUser={currentUser}
          userProfiles={userProfiles}
          onMergeCodes={handleMergeCodes}
          onClose={() => setShowMergeModal(false)}
          onMessage={onMessage}
        />
      )}
    </div>
  );
};

export default CodeManagement;
