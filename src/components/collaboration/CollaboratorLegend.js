import React from 'react';

const CollaboratorLegend = ({ userProfiles }) => {
  return (
    <div>
      <h3 className="font-semibold text-gray-700 mb-3">Collaborators</h3>
      <div id="legend-container" className="space-y-2">
        {Object.entries(userProfiles).map(([userId, profile]) => (
          <div key={userId} className="flex items-center">
            <span className="w-4 h-4 rounded-full mr-2" style={{ backgroundColor: profile.color || '#e5e7eb' }}></span>
            <span className="text-sm text-gray-600">{profile.name || 'Loading...'} (Active)</span>
          </div>
        ))}
      </div>
    </div>
  );
};

export default CollaboratorLegend;
