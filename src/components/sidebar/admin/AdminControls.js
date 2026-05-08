import React from 'react';
import AdminToggles from './AdminToggles.js';

const AdminControls = ({ 
  showHoverTooltips,
  showAuthorInfo,
  onToggleHoverTooltips,
  onToggleAuthorInfo,
  disableHighlightManagement,
  onToggleDisableHighlightManagement,
  disableCodeDriftDetection,
  onToggleDisableCodeDriftDetection,
  disableLlm,
  onToggleDisableLlm,
  showCodeDetails,
  onToggleShowCodeDetails,
  hideSameCodeHighlights,
  onToggleHideSameCodeHighlights,
  showOnlyOwnCodes,
  onToggleShowOnlyOwnCodes
}) => {
  return (
    <div className="space-y-6">
      {/* Hover Settings */}
      <div>
        <AdminToggles
          showHoverTooltips={showHoverTooltips}
          showAuthorInfo={showAuthorInfo}
          onToggleHoverTooltips={onToggleHoverTooltips}
          onToggleAuthorInfo={onToggleAuthorInfo}
          disableHighlightManagement={disableHighlightManagement}
          onToggleDisableHighlightManagement={onToggleDisableHighlightManagement}
          disableCodeDriftDetection={disableCodeDriftDetection}
          onToggleDisableCodeDriftDetection={onToggleDisableCodeDriftDetection}
          disableLlm={disableLlm}
          onToggleDisableLlm={onToggleDisableLlm}
          showCodeDetails={showCodeDetails}
          onToggleShowCodeDetails={onToggleShowCodeDetails}
          hideSameCodeHighlights={hideSameCodeHighlights}
          onToggleHideSameCodeHighlights={onToggleHideSameCodeHighlights}
          showOnlyOwnCodes={showOnlyOwnCodes}
          onToggleShowOnlyOwnCodes={onToggleShowOnlyOwnCodes}
        />
      </div>
      <div className="text-xs text-gray-500 pt-4 border-t border-gray-200">
        Owner-only project actions such as reset, deletion, and invitation key resets are available from the project dashboard.
      </div>
    </div>
  );
};

export default AdminControls;
