import React, { useState } from 'react';
import CodePaletteHeader from './CodePaletteHeader.js';
import CodeForm from './CodeForm.js';
import CodeList from './CodeList.js';
import CodeSection from './CodeSection.js';
import CodePaletteFooter from './CodePaletteFooter.js';

const CodeManagement = ({ 
  allCodes, 
  onCodeSelect, 
  disabled, 
  currentUser,
  userProfiles,
  onAddCode,
  onUpdateCode,
  onDeleteCode,
  onMessage,
  onCheckCodeUsage,
  onDeleteHighlightsByCode,
  mode = "selection", // "selection" or "management"
  title
}) => {
  const [showDescriptions, setShowDescriptions] = useState(false);
  const [showAddForm, setShowAddForm] = useState(false);
  const [editingCode, setEditingCode] = useState(null);

  const isSelectionMode = mode === "selection";
  const isManagementMode = mode === "management";
  
  const componentTitle = title || (isSelectionMode ? "Available Codes" : "Code Management");

  const resetForm = () => {
    setShowAddForm(false);
    setEditingCode(null);
  };

  const handleFormSubmit = async (formData) => {
    if (editingCode) {
      return await onUpdateCode(editingCode.docId || editingCode.id, formData);
    } else {
      return await onAddCode(formData);
    }
  };

  const handleEdit = (code) => {
    setEditingCode(code);
    setShowAddForm(true);
  };

  const handleDelete = async (code) => {
    // Check if the code is being used in any highlights
    const usage = onCheckCodeUsage ? await onCheckCodeUsage(code.id) : { count: 0, highlights: [] };
    
    let confirmMessage = `Are you sure you want to delete the "${code.label}" code?`;
    
    if (usage.count > 0) {
      confirmMessage += `\n\nWarning: This code is currently used in ${usage.count} highlight${usage.count > 1 ? 's' : ''}. Deleting this code will also remove all associated highlights.`;
    }
    
    if (!confirm(confirmMessage)) return;

    // If there are highlights using this code, delete them first
    if (usage.count > 0 && onDeleteHighlightsByCode) {
      const highlightDeleteResult = await onDeleteHighlightsByCode(code.id);
      if (!highlightDeleteResult.success) {
        onMessage('Failed to delete associated highlights', true);
        return;
      }
    }

    const result = await onDeleteCode(code.docId || code.id);
    if (result.success) {
      const message = usage.count > 0 
        ? `Code deleted successfully! ${usage.count} associated highlight${usage.count > 1 ? 's were' : ' was'} also removed.`
        : 'Code deleted successfully!';
      onMessage(message);
    } else {
      onMessage('Failed to delete code', true);
    }
  };

  const handleToggleAddForm = () => {
    setShowAddForm(!showAddForm);
    if (showAddForm) {
      setEditingCode(null);
    }
  };

  // Prepare codes based on mode
  const customCodes = allCodes.filter(code => code.isCustom);
  const defaultCodes = allCodes.filter(code => !code.isCustom);

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

      {/* Add/Edit Form */}
      {showAddForm && currentUser && (
        <CodeForm
          editingCode={editingCode}
          onSubmit={handleFormSubmit}
          onCancel={resetForm}
          onMessage={onMessage}
        />
      )}
      
      {isSelectionMode ? (
        // Selection Mode: Simple list
        <CodeList
          allCodes={allCodes}
          disabled={disabled}
          showDescriptions={showDescriptions}
          onCodeSelect={onCodeSelect}
          onEdit={handleEdit}
          onDelete={handleDelete}
          currentUser={currentUser}
          userProfiles={userProfiles}
        />
      ) : (
        // Management Mode: Organized sections
        <>
          <CodeSection
            title="Default Codes"
            codes={defaultCodes}
            showDescriptions={true}
            disabled={false}
            onCodeSelect={null}
            onEdit={handleEdit}
            onDelete={handleDelete}
            currentUser={currentUser}
            userProfiles={userProfiles}
            emptyMessage="No default codes available"
            sectionType="default"
          />
          
          <CodeSection
            title="Your Custom Codes"
            codes={customCodes}
            showDescriptions={true}
            disabled={false}
            onCodeSelect={null}
            onEdit={handleEdit}
            onDelete={handleDelete}
            currentUser={currentUser}
            userProfiles={userProfiles}
            emptyMessage="No custom codes created yet"
            sectionType="custom"
          />
        </>
      )}
      
      {isSelectionMode && (
        <CodePaletteFooter
          disabled={disabled}
          currentUser={currentUser}
        />
      )}
    </div>
  );
};

export default CodeManagement;
