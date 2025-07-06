import React from 'react';

const CodePaletteFooter = ({ currentUser }) => {
  return (
    <>
      {!currentUser && (
        <div className="mt-4 p-3 bg-amber-50 rounded-lg border border-amber-100">
          <div className="flex items-center gap-2">
            <span className="text-amber-500">🔐</span>
            <p className="text-xs text-amber-700">
              Sign in to create and edit codes
            </p>
          </div>
        </div>
      )}
    </>
  );
};

export default CodePaletteFooter;
