import React from 'react';

const MobileNotificationPanel = ({ isVisible, onClose }) => {
  if (!isVisible) return null;

  return (
    <div className="fixed inset-0 z-40 md:hidden">
      {/* Backdrop */}
      <div 
        className="absolute inset-0 bg-black bg-opacity-50"
        onClick={onClose}
      />
      
      {/* Notifications Panel */}
      <div className="absolute top-16 right-4 left-4 bg-white rounded-lg shadow-xl max-h-96 overflow-hidden">
        <div className="p-4 border-b border-gray-200">
          <div className="flex items-center justify-between">
            <h3 className="text-lg font-semibold text-gray-900">Notifications</h3>
            <button 
              onClick={onClose}
              className="text-gray-500 hover:text-gray-700"
            >
              <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M6 18L18 6M6 6l12 12" />
              </svg>
            </button>
          </div>
        </div>
        
        <div className="p-4 overflow-y-auto max-h-80">
          <p className="text-sm text-gray-600 text-center">
            Use the sidebar on desktop to manage notifications
          </p>
        </div>
      </div>
    </div>
  );
};

export default MobileNotificationPanel;
