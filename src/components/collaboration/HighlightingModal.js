import React from 'react';
import { CODE_COLOR_OPTIONS } from '../../constants/codeColors.js';

const HighlightingModal = ({ modalPosition, allCodes, onCodeSelect, onClose }) => {
  if (!allCodes || allCodes.length === 0) {
    return null;
  }

  const defaultColor = CODE_COLOR_OPTIONS.find(c => c.name === 'Gray') || { bg: 'bg-gray-200', text: 'text-gray-800' };

  return (
    <div
      id="coding-modal"
      className="coding-modal bg-white rounded-lg shadow-xl border border-gray-200 p-2"
      style={{ left: modalPosition.x, top: modalPosition.y }}
    >
      <p className="text-xs text-gray-500 mb-2 px-1">Apply code:</p>
      <div id="modal-codes-list" className="flex flex-wrap gap-2 max-w-xs">
        {allCodes.map(code => {
          const bgColor = code.color || defaultColor.bg;
          const textColor = code.textColor || defaultColor.text;
          
          return (
            <button
              key={code.id}
              className={`color-option px-3 py-1 rounded-full text-sm font-medium ${bgColor} ${textColor} hover:opacity-80 transition-opacity border border-gray-200`}
              data-code={code.id}
              onClick={() => onCodeSelect(code.id)}
              title={code.description}
            >
              {code.label}
            </button>
          );
        })}
      </div>
    </div>
  );
};

export default HighlightingModal;
