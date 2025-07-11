import React from 'react';
import { CODE_COLOR_OPTIONS } from '../../../../constants/codeColors.js';
import CodeChip from '../../../common/CodeChip.js';

const LivingCodebookHeader = ({ 
  code, 
  onBack, 
  onStartEdit,
  onDelete,
  currentUser,
  isEditing,
  editForm,
  setEditForm,
  onSaveEdit,
  onCancelEdit
}) => {
  const isDeleted = code?.isDeleted || false;
  return (
    <div className="border-b border-gray-200 bg-white living-codebook-enter">
      {/* Back button */}
      <div className="px-6 py-4">
        <button
          onClick={onBack}
          className="flex items-center text-sm text-gray-600 hover:text-gray-900 transition-colors code-transition-enter"
        >
          <svg className="w-4 h-4 mr-2" fill="none" stroke="currentColor" viewBox="0 0 24 24">
            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M15 19l-7-7 7-7" />
          </svg>
          Back to all codes
        </button>
      </div>

      {/* Code header */}
      <div className="px-6 pb-6">
        {!isEditing ? (
          <>
            <div className="flex items-start justify-between">
              <div className="flex-1">
                {/* Code badge with same styling as CodeItem */}
                <div className="mb-4">
                  <CodeChip 
                    code={isDeleted ? {
                      label: `${code.label} (deleted)`,
                      color: 'bg-gray-200',  // Explicit gray for deleted (not a fallback)
                      textColor: 'text-gray-600'
                    } : code}  // Pass code directly when not deleted
                    size="lg"
                    variant="unified"
                    className={`code-badge-transition ${isDeleted ? '' : 'code-connection-pulse'}`}
                  />
                </div>
                <h2 className="text-lg font-semibold text-gray-900 mb-2">
                  {isDeleted ? 'Deleted Code History' : 'Living Codebook'}
                </h2>
              </div>
              
              {currentUser && !isDeleted && (
                <div className="flex gap-2">
                  <button
                    onClick={onStartEdit}
                    className="flex items-center px-3 py-2 text-sm text-blue-600 hover:bg-blue-50 rounded-md transition-colors"
                  >
                    <svg className="w-4 h-4 mr-2" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                      <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M11 5H6a2 2 0 00-2 2v11a2 2 0 002 2h11a2 2 0 002-2v-5m-1.414-9.414a2 2 0 112.828 2.828L11.828 15H9v-2.828l8.586-8.586z" />
                    </svg>
                    Edit
                  </button>
                  <button
                    onClick={onDelete}
                    className="flex items-center px-3 py-2 text-sm text-red-600 hover:bg-red-50 rounded-md transition-colors"
                  >
                    <svg className="w-4 h-4 mr-2" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                      <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M19 7l-.867 12.142A2 2 0 0116.138 21H7.862a2 2 0 01-1.995-1.858L5 7m5 4v6m4-6v6m1-10V4a1 1 0 00-1-1h-4a1 1 0 00-1 1v3M4 7h16" />
                    </svg>
                    Delete
                  </button>
                </div>
              )}
              
              {isDeleted && (
                <div className="text-sm text-gray-500 italic">
                  Edits not available
                </div>
              )}
            </div>

            {/* Description */}
            <div className="mt-6">
              <h3 className="text-sm font-medium text-gray-700 mb-2">Description</h3>
              <div className="bg-gray-50 rounded-lg p-4">
                <p className="text-sm text-gray-800 leading-relaxed">
                  {code.description}
                </p>
              </div>
            </div>
          </>
        ) : (
          /* Edit Form */
          <div className="space-y-4">
            <div className="flex items-center justify-between">
              <h2 className="text-xl font-bold text-gray-900">Edit Code</h2>
              <div className="flex gap-2">
                <button
                  onClick={onCancelEdit}
                  className="px-3 py-2 text-sm text-gray-600 hover:bg-gray-50 rounded-md transition-colors"
                >
                  Cancel
                </button>
                <button
                  onClick={onSaveEdit}
                  className="px-3 py-2 text-sm bg-blue-600 text-white hover:bg-blue-700 rounded-md transition-colors"
                >
                  Save Changes
                </button>
              </div>
            </div>

            <div>
              <label className="block text-sm font-medium text-gray-700 mb-1">
                Label
              </label>
              <input
                type="text"
                value={editForm.label}
                onChange={(e) => setEditForm(prev => ({ ...prev, label: e.target.value }))}
                className="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-transparent"
                placeholder="Code label"
                maxLength={20}
              />
            </div>

            <div>
              <label className="block text-sm font-medium text-gray-700 mb-1">
                Description
              </label>
              <textarea
                value={editForm.description}
                onChange={(e) => setEditForm(prev => ({ ...prev, description: e.target.value }))}
                className="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-transparent"
                placeholder="Code description"
                rows={3}
                maxLength={200}
              />
            </div>

            <div>
              <label className="block text-sm font-medium text-gray-700 mb-2">
                Color Theme
              </label>
              <div className="grid grid-cols-4 gap-2">
                {CODE_COLOR_OPTIONS.map((option) => (
                  <button
                    key={option.bg}
                    type="button"
                    onClick={() => setEditForm(prev => ({ 
                      ...prev, 
                      color: option.bg, 
                      textColor: option.text 
                    }))}
                    className={`code-palette-unified px-3 py-2 text-sm rounded-md ${option.bg} ${option.text} ${
                      editForm.color === option.bg ? 'ring-2 ring-blue-500' : 'border border-gray-200'
                    } hover:ring-2 hover:ring-blue-300 transition-all`}
                  >
                    {option.name}
                  </button>
                ))}
              </div>
            </div>
          </div>
        )}
      </div>
    </div>
  );
};

export default LivingCodebookHeader;
