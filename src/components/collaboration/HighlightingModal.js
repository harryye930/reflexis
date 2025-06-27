import React from 'react';

const HighlightingModal = ({ modalPosition, allCodes, onCodeSelect, onClose }) => {
  if (!allCodes || allCodes.length === 0) {
    return null;
  }

  return (
    <div
      id="coding-modal"
      className="coding-modal bg-white rounded-lg shadow-xl border border-gray-200 p-2"
      style={{ left: modalPosition.x, top: modalPosition.y }}
    >
      <p className="text-xs text-gray-500 mb-2 px-1">Apply code:</p>
      <div id="modal-codes-list" className="flex flex-wrap gap-2 max-w-xs">
        {allCodes.map(code => (
          <button
            key={code.id}
            className={`code-btn px-3 py-1 rounded-full text-sm font-medium ${code.color} ${code.textColor} hover:opacity-80 transition-opacity`}
            data-code={code.id}
            onClick={() => onCodeSelect(code.id)}
            title={code.description}
          >
            {code.label}
          </button>
        ))}
      </div>
    </div>
  );
};

export default HighlightingModal;
