import React, { useState } from 'react';

const CodeManager = ({ 
  allCodes, 
  onAddCode, 
  onUpdateCode, 
  onDeleteCode, 
  onMessage,
  currentUser 
}) => {
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
    if (!confirm(`Are you sure you want to delete the "${code.label}" code?`)) return;

    const result = await onDeleteCode(code.docId || code.id);
    if (result.success) {
      onMessage('Code deleted successfully!');
    } else {
      onMessage('Failed to delete code', true);
    }
  };

  const customCodes = allCodes.filter(code => code.isCustom);
  const defaultCodes = allCodes.filter(code => !code.isCustom);

  if (!currentUser) {
    return (
      <div className="mb-6">
        <h3 className="font-semibold text-gray-700 mb-3">Code Management</h3>
        <p className="text-sm text-gray-500">Sign in to create and edit codes</p>
      </div>
    );
  }

  return (
    <div className="mb-6">
      <div className="flex items-center justify-between mb-3">
        <h3 className="font-semibold text-gray-700">Code Management</h3>
        <button
          onClick={() => setShowAddForm(!showAddForm)}
          className="text-sm px-3 py-1 bg-blue-500 text-white rounded-lg hover:bg-blue-600 transition-colors"
        >
          {showAddForm ? 'Cancel' : '+ Add Code'}
        </button>
      </div>

      {showAddForm && (
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

      {/* Default Codes Section */}
      {defaultCodes.length > 0 && (
        <div className="mb-6">
          <h4 className="text-sm font-medium text-gray-600 mb-3">Default Codes</h4>
          <div className="space-y-2">
            {defaultCodes.map((code) => (
              <div
                key={code.id}
                className={`code-preview flex items-center justify-between p-3 bg-white rounded-lg border border-gray-200 hover:border-gray-300 transition-all ${code.isCustomized ? 'customized' : ''}`}
              >
                <div className="flex-1">
                  <div className="flex items-center gap-2 mb-2">
                    <span className={`px-3 py-1 text-sm rounded-full ${code.color} ${code.textColor} font-medium`}>
                      {code.label}
                    </span>
                    {code.isCustomized ? (
                      <span className="customized-default-badge">
                        CUSTOMIZED
                      </span>
                    ) : (
                      <span className="default-code-badge">
                        DEFAULT
                      </span>
                    )}
                  </div>
                  <p className="text-xs text-gray-600 leading-relaxed">{code.description}</p>
                </div>
                <div className="flex gap-1 ml-3">
                  <button
                    onClick={() => handleEdit(code)}
                    className="text-sm px-3 py-1 text-blue-600 hover:bg-blue-50 rounded-md transition-colors"
                    title={code.isCustomized ? "Edit your customized version" : "Customize this default code"}
                  >
                    ✏️ {code.isCustomized ? 'Edit' : 'Customize'}
                  </button>
                </div>
              </div>
            ))}
          </div>
        </div>
      )}

      {/* Custom Codes Section */}
      {customCodes.length > 0 && (
        <div>
          <h4 className="text-sm font-medium text-gray-600 mb-3">Your Custom Codes</h4>
          <div className="space-y-2">
            {customCodes.map((code) => (
              <div
                key={code.id}
                className="code-preview flex items-center justify-between p-3 bg-white rounded-lg border border-gray-200 hover:border-gray-300 transition-all"
              >
                <div className="flex-1">
                  <div className="flex items-center gap-2 mb-2">
                    <span className={`px-3 py-1 text-sm rounded-full ${code.color} ${code.textColor} font-medium`}>
                      {code.label}
                    </span>
                    <span className="custom-code-badge">
                      CUSTOM
                    </span>
                  </div>
                  <p className="text-xs text-gray-600 leading-relaxed">{code.description}</p>
                </div>
                <div className="flex gap-1 ml-3">
                  <button
                    onClick={() => handleEdit(code)}
                    className="text-sm px-3 py-1 text-blue-600 hover:bg-blue-50 rounded-md transition-colors"
                    title="Edit code"
                  >
                    ✏️ Edit
                  </button>
                  <button
                    onClick={() => handleDelete(code)}
                    className="text-sm px-3 py-1 text-red-600 hover:bg-red-50 rounded-md transition-colors"
                    title="Delete code"
                  >
                    🗑️ Delete
                  </button>
                </div>
              </div>
            ))}
          </div>
        </div>
      )}
    </div>
  );
};

export default CodeManager;
