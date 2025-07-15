import React from 'react';
import { CODE_COLOR_OPTIONS } from '../../../../../constants/codeColors.js';

const MergeStep3_ConfigureResult = ({ 
  selectedCodes,
  mergeStrategy,
  resultConfig,
  onResultConfigChange
}) => {
  return (
    <div>
      <h3 className="text-lg font-medium text-gray-900 mb-4">Configure Result</h3>
      <p className="text-sm text-gray-600 mb-4">
        {mergeStrategy === 'create_new' 
          ? 'Configure the new merged code:'
          : (() => {
              const targetCodeId = mergeStrategy.replace('merge_into_', '');
              const targetCode = selectedCodes.find(c => c.id === targetCodeId);
              return `Configure the target code "${targetCode?.label}":`;
            })()
        }
      </p>

      <div className="space-y-4 mb-6">
        <div>
          <label className="block text-sm font-medium text-gray-700 mb-1">
            Label <span className="text-red-500">*</span>
          </label>
          <input
            type="text"
            value={resultConfig.label}
            onChange={(e) => onResultConfigChange({ ...resultConfig, label: e.target.value })}
            className="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-transparent"
            placeholder="Code label"
            maxLength={20}
          />
          <p className="text-xs text-gray-500 mt-1">{resultConfig.label.length}/20</p>
        </div>

        <div>
          <label className="block text-sm font-medium text-gray-700 mb-1">
            Description <span className="text-red-500">*</span>
          </label>
          <textarea
            value={resultConfig.description}
            onChange={(e) => onResultConfigChange({ ...resultConfig, description: e.target.value })}
            className="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-transparent"
            placeholder="Code description"
            rows={3}
            maxLength={200}
          />
          <p className="text-xs text-gray-500 mt-1">{resultConfig.description.length}/200</p>
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
                onClick={() => onResultConfigChange({ 
                  ...resultConfig, 
                  color: option.bg, 
                  textColor: option.text 
                })}
                className={`code-palette-unified px-3 py-2 text-sm rounded-md ${option.bg} ${option.text} ${
                  resultConfig.color === option.bg ? 'ring-2 ring-blue-500' : 'border border-gray-200'
                } hover:ring-2 hover:ring-blue-300 transition-all`}
              >
                {option.name}
              </button>
            ))}
          </div>
        </div>
      </div>

      {/* Summary */}
      <div className="bg-blue-50 rounded-lg p-4">
        <h4 className="text-sm font-medium text-blue-900 mb-2">Merge Summary</h4>
        <p className="text-sm text-blue-800">
          {mergeStrategy === 'create_new' 
            ? `Creating new code and transferring all highlights from ${selectedCodes.length} codes. Original codes will be deleted.`
            : (() => {
                const targetCodeId = mergeStrategy.replace('merge_into_', '');
                const targetCode = selectedCodes.find(c => c.id === targetCodeId);
                const sourceCount = selectedCodes.length - 1;
                return `Merging ${sourceCount} code${sourceCount !== 1 ? 's' : ''} into "${targetCode?.label}". Source codes will be deleted.`;
              })()
          }
        </p>
      </div>
    </div>
  );
};

export default MergeStep3_ConfigureResult;
