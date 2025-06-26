import React from 'react';
import { availableCodes } from '../../constants/index.js';

const CodePalette = ({ onCodeSelect, disabled }) => {
  return (
    <div className="mb-6">
      <h3 className="font-semibold text-gray-700 mb-3">Available Codes</h3>
      <div id="codes-list" className="flex flex-wrap gap-2">
        {availableCodes.map(code => (
          <button
            key={code.id}
            className={`code-btn px-3 py-1 rounded-full text-sm font-medium ${code.color} ${code.textColor} ${disabled ? 'opacity-50 cursor-not-allowed' : ''}`}
            data-code={code.id}
            onClick={() => !disabled && onCodeSelect(code.id)}
            disabled={disabled}
          >
            {code.label}
          </button>
        ))}
      </div>
    </div>
  );
};

export default CodePalette;
