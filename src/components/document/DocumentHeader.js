import React from 'react';

const DocumentHeader = ({ activeDocument }) => {
  return (
    <div className="mb-6">
      <h1 className="text-2xl md:text-3xl font-bold text-gray-900 mb-2">
        {activeDocument?.title || 'Research Document'}
      </h1>
      {activeDocument?.description && (
        <p className="text-gray-600 mb-2">{activeDocument.description}</p>
      )}
      <p className="text-gray-500 text-sm md:text-base italic">
        Select text with your mouse to apply a code.
      </p>
    </div>
  );
};

export default DocumentHeader;
