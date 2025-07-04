import React from 'react';

const MobileDocumentSelector = ({ documents, activeDocument, onDocumentSwitch }) => {
  return (
    <div className="lg:hidden mb-4">
      <select
        value={activeDocument?.id || ''}
        onChange={(e) => onDocumentSwitch(e.target.value)}
        className="w-full px-3 py-2 border border-gray-300 rounded-md text-sm focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-transparent"
      >
        {documents.map((doc) => (
          <option key={doc.id} value={doc.id}>
            {doc.title}
          </option>
        ))}
      </select>
    </div>
  );
};

export default MobileDocumentSelector;
