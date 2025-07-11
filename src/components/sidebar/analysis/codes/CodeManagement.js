import React, { useState } from 'react';
import CodePaletteHeader from './CodePaletteHeader.js';
import CodeForm from './CodeForm.js';
import CodeList from './CodeList.js';
import CodeSection from './CodeSection.js';
import CodePaletteFooter from './CodePaletteFooter.js';
import CodeMergeModal from './CodeMergeModal.js';

const CodeManagement = ({ 
  allCodes, 
  deletedCodes = [], // New prop for deleted codes
  currentUser,
  userProfiles,
  onAddCode,
  onUpdateCode,
  onDeleteCode,
  onMergeCodes, // New prop for merging codes
  onMessage,
  onCheckCodeUsage,
  onDeleteHighlightsByCode,
  mode = "selection", // "selection" or "management"
  title,
  onCodeNameClick // New prop for Living Codebook
}) => {
  const [showDescriptions, setShowDescriptions] = useState(false);
  const [showAddForm, setShowAddForm] = useState(false);
  const [showMergeModal, setShowMergeModal] = useState(false);

  const isSelectionMode = mode === "selection";
  const isManagementMode = mode === "management";
  
  const componentTitle = title || (isSelectionMode ? "Available Codes" : "Code Management");

  const resetForm = () => {
    setShowAddForm(false);
  };

  const handleFormSubmit = async (formData) => {
    return await onAddCode(formData);
  };

  // Remove handleEdit since editing is now only in Living Codebook

  const handleDelete = async (code) => {
    // Delete functionality moved to Living Codebook only
    // This function is kept for interface compatibility but should not be called
    console.warn('Delete functionality is only available in Living Codebook');
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

  if (!currentUser && isManagementMode) {
    return (
      <div className="mb-6">
        <h3 className="font-semibold text-gray-700 mb-3">{componentTitle}</h3>
        <p className="text-sm text-gray-500">Sign in to create and edit codes</p>
      </div>
    );
  }

  return (
    <div className="mb-6">
      {isSelectionMode ? (
        // Selection Mode Header
        <CodePaletteHeader
          showDescriptions={showDescriptions}
          onToggleDescriptions={() => setShowDescriptions(!showDescriptions)}
          showAddForm={showAddForm}
          onToggleAddForm={handleToggleAddForm}
          onToggleMergeModal={handleToggleMergeModal}
          currentUser={currentUser}
          title={componentTitle}
        />
      ) : (
        // Management Mode Header
        <div className="flex items-center justify-between mb-3">
          <h3 className="font-semibold text-gray-700">{componentTitle}</h3>
          {currentUser && (
            <button
              onClick={handleToggleAddForm}
              className="text-sm px-3 py-1 bg-blue-500 text-white rounded-lg hover:bg-blue-600 transition-colors"
            >
              {showAddForm ? 'Cancel' : '+ Add Code'}
            </button>
          )}
        </div>
      )}

      {/* Add Form (only for adding new codes) */}
      {showAddForm && currentUser && (
        <CodeForm
          editingCode={null}
          onSubmit={handleFormSubmit}
          onCancel={resetForm}
          onMessage={onMessage}
        />
      )}
      
      {isSelectionMode ? (
        // Selection Mode: Simple list
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
      ) : (
        // Management Mode: All codes in a single list
        <CodeSection
          title="All Codes"
          codes={allCodes}
          deletedCodes={deletedCodes}
          showDescriptions={true}
          onEdit={null} // No edit handler since editing is disabled
          onDelete={null} // Remove delete functionality from list view
          currentUser={currentUser}
          userProfiles={userProfiles}
          emptyMessage="No codes available"
          sectionType="all"
          onCodeNameClick={onCodeNameClick}
          hideEditButtons={true} // Hide delete buttons in management mode
        />
      )}
      
      {isSelectionMode && (
        <CodePaletteFooter
          currentUser={currentUser}
        />
      )}

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
