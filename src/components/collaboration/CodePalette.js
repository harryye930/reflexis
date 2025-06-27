import React, { useState } from 'react';

const CodePalette = ({ 
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
  onDeleteHighlightsByCode
}) => {
  const [showDescriptions, setShowDescriptions] = useState(false);
  const [showAddForm, setShowAddForm] = useState(false);
  const [editingCode, setEditingCode] = useState(null);
  const [formData, setFormData] = useState({
    label: '',
    description: '',
    color: 'bg-gray-200',
    textColor: 'text-gray-800'
  });

  const colorOptions = [
    { bg: 'bg-blue-200', text: 'text-blue-800', name: 'Blue' },
    { bg: 'bg-green-200', text: 'text-green-800', name: 'Green' },
    { bg: 'bg-yellow-200', text: 'text-yellow-800', name: 'Yellow' },
    { bg: 'bg-red-200', text: 'text-red-800', name: 'Red' },
    { bg: 'bg-purple-200', text: 'text-purple-800', name: 'Purple' },
    { bg: 'bg-pink-200', text: 'text-pink-800', name: 'Pink' },
    { bg: 'bg-indigo-200', text: 'text-indigo-800', name: 'Indigo' },
    { bg: 'bg-orange-200', text: 'text-orange-800', name: 'Orange' },
    { bg: 'bg-teal-200', text: 'text-teal-800', name: 'Teal' },
    { bg: 'bg-gray-200', text: 'text-gray-800', name: 'Gray' }
  ];

  if (!allCodes || allCodes.length === 0) {
    return (
      <div className="mb-6">
        <h3 className="font-semibold text-gray-700 mb-3">Available Codes</h3>
        <p className="text-sm text-gray-500">Loading codes...</p>
      </div>
    );
  }

  const resetForm = () => {
    setFormData({
      label: '',
      description: '',
      color: 'bg-gray-200',
      textColor: 'text-gray-800'
    });
    setShowAddForm(false);
    setEditingCode(null);
  };

  const handleSubmit = async (e) => {
    e.preventDefault();
    
    if (!formData.label.trim() || !formData.description.trim()) {
      onMessage('Please fill in both label and description', true);
      return;
    }

    let result;
    if (editingCode) {
      result = await onUpdateCode(editingCode.docId || editingCode.id, formData);
    } else {
      result = await onAddCode(formData);
    }

    if (result.success) {
      onMessage(editingCode ? 'Code updated successfully!' : 'Code added successfully!');
      resetForm();
    } else {
      onMessage('Failed to save code', true);
    }
  };

  const handleEdit = (code) => {
    setFormData({
      label: code.label,
      description: code.description,
      color: code.color,
      textColor: code.textColor
    });
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

  const getAuthorName = (code) => {
    if (code.isDefault) return null;
    if (code.createdBy && userProfiles[code.createdBy]) {
      return userProfiles[code.createdBy].name;
    }
    return 'Unknown';
  };

  return (
    <div className="mb-6">
      <div className="flex items-center justify-between mb-4">
        <h3 className="font-semibold text-gray-700">Available Codes</h3>
        <div className="flex gap-2">
          <button
            onClick={() => setShowDescriptions(!showDescriptions)}
            className="text-xs px-3 py-1 bg-gray-100 hover:bg-gray-200 text-gray-600 rounded-full transition-colors"
            title={showDescriptions ? 'Hide descriptions' : 'Show descriptions'}
          >
            {showDescriptions ? '👁️‍🗨️ Hide Info' : '👁️ Show Info'}
          </button>
          {currentUser && (
            <button
              onClick={() => setShowAddForm(!showAddForm)}
              className="text-xs px-3 py-1 bg-blue-500 text-white rounded-full hover:bg-blue-600 transition-colors"
            >
              {showAddForm ? 'Cancel' : '+ Add'}
            </button>
          )}
        </div>
      </div>

      {/* Add/Edit Form */}
      {showAddForm && currentUser && (
        <form onSubmit={handleSubmit} className="mb-4 p-4 code-manager-form rounded-lg space-y-3">
          <h4 className="font-medium text-gray-700">
            {editingCode ? 'Edit Code' : 'Add New Code'}
          </h4>
          
          <div>
            <label className="block text-xs font-medium text-gray-600 mb-1">
              Label <span className="text-red-500">*</span>
            </label>
            <input
              type="text"
              value={formData.label}
              onChange={(e) => setFormData(prev => ({ ...prev, label: e.target.value }))}
              className="w-full px-3 py-2 text-sm border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-transparent"
              placeholder="e.g., Methodology"
              maxLength={20}
              required
            />
          </div>

          <div>
            <label className="block text-xs font-medium text-gray-600 mb-1">
              Description <span className="text-red-500">*</span>
            </label>
            <textarea
              value={formData.description}
              onChange={(e) => setFormData(prev => ({ ...prev, description: e.target.value }))}
              className="w-full px-3 py-2 text-sm border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-transparent"
              placeholder="Brief description of when to use this code..."
              rows={2}
              maxLength={100}
              required
            />
            <p className="text-xs text-gray-500 mt-1">{formData.description.length}/100</p>
          </div>

          <div>
            <label className="block text-xs font-medium text-gray-600 mb-2">
              Color Theme
            </label>
            <div className="color-picker-grid">
              {colorOptions.map((option) => (
                <button
                  key={option.bg}
                  type="button"
                  onClick={() => setFormData(prev => ({ 
                    ...prev, 
                    color: option.bg, 
                    textColor: option.text 
                  }))}
                  className={`color-option px-2 py-1 text-xs rounded-md ${option.bg} ${option.text} ${
                    formData.color === option.bg ? 'selected ring-2 ring-blue-500' : 'border border-gray-200'
                  }`}
                >
                  {option.name}
                </button>
              ))}
            </div>
          </div>

          <div className="flex gap-2 pt-2">
            <button
              type="submit"
              className="px-4 py-2 bg-green-500 text-white text-sm rounded-md hover:bg-green-600 transition-colors font-medium"
            >
              {editingCode ? 'Update' : 'Add'} Code
            </button>
            <button
              type="button"
              onClick={resetForm}
              className="px-4 py-2 bg-gray-500 text-white text-sm rounded-md hover:bg-gray-600 transition-colors"
            >
              Cancel
            </button>
          </div>
        </form>
      )}
      
      <div id="codes-list" className="space-y-3">
        {allCodes.map(code => (
          <div key={code.id} className="code-palette-card group">
            <div
              className={`code-palette-unified w-full text-left p-4 rounded-xl border border-gray-100 ${code.color} ${code.textColor} ${disabled ? 'opacity-50 cursor-not-allowed' : 'cursor-pointer hover:shadow-md hover:scale-[1.02]'} transition-all duration-200`}
              data-code={code.id}
              onClick={() => !disabled && onCodeSelect(code.id)}
            >
              <div className="flex items-start justify-between mb-2">
                <div className="flex-1">
                  <div className="flex items-center gap-2">
                    <span className="font-medium text-sm">{code.label}</span>
                    {code.isDefault ? (
                      <span className="default-code-badge">DEFAULT</span>
                    ) : (
                      <span className="custom-code-badge">CUSTOM</span>
                    )}
                  </div>
                  {!code.isDefault && getAuthorName(code) && (
                    <p className="text-xs opacity-60 mt-1">by {getAuthorName(code)}</p>
                  )}
                </div>
                {currentUser && (
                  <div className="flex gap-1 ml-3">
                    <button
                      onClick={(e) => {
                        e.stopPropagation();
                        handleEdit(code);
                      }}
                      className="text-xs px-2 py-1 text-blue-600 hover:bg-blue-50 rounded-md transition-colors opacity-0 group-hover:opacity-100"
                      title="Edit code"
                    >
                      ✏️
                    </button>
                    {(code.canDelete || code.isDefault) && (
                      <button
                        onClick={(e) => {
                          e.stopPropagation();
                          handleDelete(code);
                        }}
                        className="text-xs px-2 py-1 text-red-600 hover:bg-red-50 rounded-md transition-colors opacity-0 group-hover:opacity-100"
                        title="Delete code"
                      >
                        🗑️
                      </button>
                    )}
                  </div>
                )}
              </div>
              {showDescriptions && (
                <p className="text-xs opacity-80 leading-relaxed">
                  {code.description}
                </p>
              )}
            </div>
          </div>
        ))}
      </div>
      
      {disabled && (
        <div className="mt-4 p-3 bg-gray-50 rounded-lg border border-gray-100">
          <p className="text-xs text-gray-500 text-center italic">
            Select text to activate codes
          </p>
        </div>
      )}

      {!currentUser && (
        <div className="mt-4 p-3 bg-blue-50 rounded-lg border border-blue-100">
          <p className="text-xs text-blue-600 text-center">
            Sign in to create and edit codes
          </p>
        </div>
      )}
    </div>
  );
};

export default CodePalette;
