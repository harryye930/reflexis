import React from 'react';
import { availableCodes } from '../../constants/index.js';

const HighlightingModal = ({ modalPosition, onCodeSelect, onClose }) => {
  return (
    <div
      id="coding-modal"
      className="coding-modal bg-white rounded-lg shadow-xl border border-gray-200 p-2"
      style={{ left: modalPosition.x, top: modalPosition.y }}
    >
      <p className="text-xs text-gray-500 mb-2 px-1">Apply code:</p>
      <div id="modal-codes-list" className="flex flex-wrap gap-2">
        {availableCodes.map(code => (
          <button
            key={code.id}
            className={`code-btn px-3 py-1 rounded-full text-sm font-medium ${code.color} ${code.textColor}`}
            data-code={code.id}
            onClick={() => onCodeSelect(code.id)}
          >
            {code.label}
          </button>
        ))}
      </div>
    </div>
  );
};

export default HighlightingModal;
