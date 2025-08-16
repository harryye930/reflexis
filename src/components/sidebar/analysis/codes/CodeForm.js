import React, { useState, useEffect } from 'react';
import { CODE_COLOR_OPTIONS } from '../../../../constants/codeColors.js';

const CodeForm = ({ 
  editingCode, 
  onSubmit, 
  onCancel, 
  onMessage 
}) => {
  const [formData, setFormData] = useState({
    label: '',
    description: '',
    color: 'bg-gray-200',
    textColor: 'text-gray-800'
  });

  // Update form data when editing code changes
  useEffect(() => {
    if (editingCode) {
      setFormData({
        label: editingCode.label,
        description: editingCode.description,
        color: editingCode.color,
        textColor: editingCode.textColor
      });
    } else {
      setFormData({
        label: '',
        description: '',
        color: 'bg-gray-200',
        textColor: 'text-gray-800'
      });
    }
  }, [editingCode]);

  const handleSubmit = async (e) => {
    e.preventDefault();
    
    if (!formData.label.trim() || !formData.description.trim()) {
      onMessage('Please fill in both label and description', true);
      return;
    }

    const result = await onSubmit(formData);
    
    if (result.success) {
      onMessage(editingCode ? 'Code updated successfully!' : 'Code added successfully!');
      onCancel(); // Reset form
    } else {
      onMessage('Failed to save code', true);
    }
  };

  return (
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
          maxLength={40}
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
          {CODE_COLOR_OPTIONS.map((option) => (
            <button
              key={option.bg}
              type="button"
              onClick={() => setFormData(prev => ({ 
                ...prev, 
                color: option.bg, 
                textColor: option.text 
              }))}
              className={`code-palette-unified color-option px-2 py-1 text-xs rounded-md ${option.bg} ${option.text} ${
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
          onClick={onCancel}
          className="px-4 py-2 bg-gray-500 text-white text-sm rounded-md hover:bg-gray-600 transition-colors"
        >
          Cancel
        </button>
      </div>
    </form>
  );
};

export default CodeForm;
