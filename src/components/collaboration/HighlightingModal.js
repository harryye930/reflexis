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
      className="coding-modal bg-white rounded-lg shadow-xl border border-gray-200 p-3"
      style={{ left: modalPosition.x, top: modalPosition.y }}
    >
      <div className="flex items-center gap-2 mb-3">
        <span className="text-blue-500">🏷️</span>
        <p className="text-xs text-gray-700 font-medium">Apply code to selection:</p>
      </div>
      <div id="modal-codes-list" className="flex flex-wrap gap-2 max-w-xs">
        {allCodes.map(code => {
          const bgColor = code.color || defaultColor.bg;
          const textColor = code.textColor || defaultColor.text;
          
          return (
            <button
              key={code.id}
              className={`code-palette-unified px-3 py-2 rounded-full text-sm font-medium ${bgColor} ${textColor} hover:scale-[1.05] hover:shadow-lg transition-all duration-200 border border-gray-100 relative overflow-hidden`}
              data-code={code.id}
              onClick={() => onCodeSelect(code.id)}
              title={code.description}
            >
              <span className="relative z-10">{code.label}</span>
            </button>
          );
        })}
      </div>
    </div>
  );
};

export default HighlightingModal;
