import React from 'react';
import CollaboratorLegend from './CollaboratorLegend.js';
import AdminControls from './AdminControls.js';
import ResearcherProfile from './ResearcherProfile.js';

const AdminTab = ({ 
  projectId,
  userProfiles,
  currentUser,
  showAuthorInfo,
  onMessage,
  showHoverTooltips,
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
  profileEditRequestId
}) => {
  // Get current user profile from userProfiles
  const currentUserProfile = currentUser ? userProfiles[currentUser.uid] : null;

  return (
    <div className="p-6">
      <div className="mb-6">
        <h2 className="text-xl font-bold text-gray-900">Admin Controls</h2>
        <p className="text-sm text-gray-600 mt-1">
          Manage application settings and perform administrative tasks
        </p>
      </div>
      
      {/* Researcher Profile Section */}
      <ResearcherProfile 
        projectId={projectId}
        currentUser={currentUser}
        currentUserProfile={currentUserProfile}
        onMessage={onMessage}
        editRequestId={profileEditRequestId}
        disableLlm={disableLlm}
      />
      
      {/* Collaborators Section */}
      <div className="mb-6">
        <CollaboratorLegend 
          userProfiles={userProfiles}
          currentUser={currentUser}
          showAuthorInfo={showAuthorInfo}
          disableLlm={disableLlm}
        />
      </div>
      
      <AdminControls 
        onMessage={onMessage}
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
      />
    </div>
  );
};

export default AdminTab;
