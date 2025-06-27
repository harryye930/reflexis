import React from 'react';

const CodePaletteFooter = ({ disabled, currentUser }) => {
  return (
    <>
      {disabled && (
        <div className="mt-4 p-3 bg-gray-50 rounded-lg border border-gray-100">
          <p className="text-xs text-gray-500 text-center italic">
            Select text to activate codes
          </p>
        </div>
      )}

      {!currentUser && (
        <div className="mt-4 p-3 bg-blue-50 rounded-lg border border-blue-100">
          <p className="text-xs text-blue-600 text-center">
            Sign in to create and edit codes
          </p>
        </div>
      )}
    </>
  );
};

export default CodePaletteFooter;
