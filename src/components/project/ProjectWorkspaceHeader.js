import React from 'react';
import ReflectiveQuoteTicker from '../common/ReflectiveQuoteTicker.js';

const ProjectWorkspaceHeader = ({
  projectId,
  projectName = 'Project',
  subtitle = 'Collaborative analysis',
  leftButtonLabel = 'Projects',
  onLeftButtonClick,
  activeCollaborators = [],
  rightContent = null,
  onSignOut
}) => (
  <header className="fixed top-0 left-0 right-0 h-12 bg-white border-b border-gray-200 z-50 flex items-center px-4 gap-4">
    <div className="flex items-center gap-3 flex-shrink-0">
      {onLeftButtonClick && (
        <button
          type="button"
          onClick={onLeftButtonClick}
          className="px-3 py-1.5 text-sm text-gray-700 border border-gray-300 rounded-md hover:bg-gray-50"
        >
          {leftButtonLabel}
        </button>
      )}
      <div>
        <div className="text-sm font-semibold text-gray-900">{projectName}</div>
        <div className="text-xs text-gray-500">{subtitle}</div>
      </div>
    </div>

    <ReflectiveQuoteTicker seedKey={projectId || ''} />

    <div className="flex flex-shrink-0 items-center gap-3">
      {rightContent}
      <div
        className="flex flex-shrink-0 items-center"
        aria-label="Active collaborators"
      >
        {activeCollaborators.map((collaborator, index) => (
          <span
            key={collaborator.userId}
            title={collaborator.name}
            className="flex h-8 w-8 items-center justify-center rounded-full border-2 border-white text-sm font-semibold text-white shadow-sm"
            style={{
              backgroundColor: collaborator.color,
              marginLeft: index === 0 ? 0 : -8,
              zIndex: activeCollaborators.length - index
            }}
          >
            {collaborator.initial}
          </span>
        ))}
      </div>
      {onSignOut && (
        <button
          type="button"
          onClick={onSignOut}
          className="px-3 py-1.5 text-sm text-gray-700 border border-gray-300 rounded-md hover:bg-gray-50 flex-shrink-0"
        >
          Sign Out
        </button>
      )}
    </div>
  </header>
);

export default ProjectWorkspaceHeader;
