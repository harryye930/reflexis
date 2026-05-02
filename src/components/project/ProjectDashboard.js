import React, { useEffect, useMemo, useState } from 'react';
import { ProjectService } from '../../services/api/firebase/projectService.js';

const ProjectDashboard = ({ currentUser, userProfile, onOpenProject, onSignOut }) => {
  const projectService = useMemo(() => new ProjectService(), []);
  const [projects, setProjects] = useState([]);
  const [loadingProjects, setLoadingProjects] = useState(true);
  const [projectName, setProjectName] = useState('');
  const [joinKey, setJoinKey] = useState('');
  const [lastGeneratedKey, setLastGeneratedKey] = useState(null);
  const [message, setMessage] = useState('');
  const [error, setError] = useState('');
  const [busyAction, setBusyAction] = useState('');
  const [editingProjectId, setEditingProjectId] = useState(null);
  const [editingProjectName, setEditingProjectName] = useState('');

  useEffect(() => {
    if (!currentUser) return undefined;

    setLoadingProjects(true);
    const unsubscribe = projectService.onUserProjectsSnapshot(currentUser.uid, (userProjects) => {
      setProjects(userProjects);
      setLoadingProjects(false);
    });

    return () => unsubscribe();
  }, [currentUser, projectService]);

  const clearFeedback = () => {
    setMessage('');
    setError('');
  };

  const upsertProject = (project) => {
    setProjects((currentProjects) => {
      const existingIndex = currentProjects.findIndex((item) => item.id === project.id);
      if (existingIndex === -1) {
        return [project, ...currentProjects];
      }

      const nextProjects = [...currentProjects];
      nextProjects[existingIndex] = {
        ...nextProjects[existingIndex],
        ...project
      };
      return nextProjects;
    });
  };

  const handleCreateProject = async (event) => {
    event.preventDefault();
    clearFeedback();

    if (!projectName.trim()) {
      setError('Project name is required.');
      return;
    }

    setBusyAction('create');
    const result = await projectService.createProject(
      { name: projectName },
      currentUser,
      userProfile
    );

    if (result.success) {
      setProjectName('');
      upsertProject(result.project);
      setLastGeneratedKey({
        projectName: result.project.name,
        key: result.joinKey
      });
      setMessage('Project created.');
    } else {
      setError(result.error?.message || 'Failed to create project.');
    }

    setBusyAction('');
  };

  const handleJoinProject = async (event) => {
    event.preventDefault();
    clearFeedback();

    if (!joinKey.trim()) {
      setError('Enter a project key.');
      return;
    }

    setBusyAction('join');
    const result = await projectService.joinProjectByKey(joinKey, currentUser, userProfile);

    if (result.success) {
      setJoinKey('');
      if (result.project) {
        upsertProject(result.project);
      }
      setMessage(result.alreadyMember ? 'You are already part of that project.' : 'Project joined.');
      if (result.project) {
        onOpenProject(result.project);
      }
    } else {
      setError(result.error?.message || result.error || 'Failed to join project.');
    }

    setBusyAction('');
  };

  const handleStartEditProjectName = (project) => {
    clearFeedback();
    setEditingProjectId(project.id);
    setEditingProjectName(project.name);
  };

  const handleCancelEditProjectName = () => {
    setEditingProjectId(null);
    setEditingProjectName('');
  };

  const handleRenameProject = async (event, project) => {
    event.preventDefault();
    clearFeedback();

    const trimmedName = editingProjectName.trim();
    if (!trimmedName) {
      setError('Project name is required.');
      return;
    }

    if (trimmedName === project.name) {
      handleCancelEditProjectName();
      return;
    }

    setBusyAction(`rename-${project.id}`);
    const result = await projectService.renameProject(project.id, currentUser.uid, trimmedName);

    if (result.success) {
      upsertProject({
        ...project,
        name: trimmedName
      });
      setLastGeneratedKey((currentKey) => {
        if (!currentKey || currentKey.projectName !== project.name) return currentKey;
        return {
          ...currentKey,
          projectName: trimmedName
        };
      });
      setMessage('Project name updated.');
      handleCancelEditProjectName();
    } else {
      setError(result.error?.message || 'Failed to update project name.');
    }

    setBusyAction('');
  };

  const handleRegenerateKey = async (project) => {
    clearFeedback();

    const confirmed = window.confirm(
      `Reset the invitation key for "${project.name}"?\n\nThe old key will stop working.`
    );
    if (!confirmed) return;

    setBusyAction(`key-${project.id}`);
    const result = await projectService.regenerateJoinKey(project.id, currentUser.uid);

    if (result.success) {
      upsertProject({
        ...project,
        joinKey: result.joinKey
      });
      setLastGeneratedKey({
        projectName: project.name,
        key: result.joinKey
      });
      setMessage('Invitation key regenerated.');
    } else {
      setError(result.error?.message || 'Failed to regenerate key.');
    }

    setBusyAction('');
  };

  const handleResetProject = async (project) => {
    clearFeedback();

    const confirmed = window.confirm(
      `Reset all research data in "${project.name}"?\n\nMembers and the project itself will remain, but documents, codes, highlights, reflexive responses, and code history will be deleted.`
    );
    if (!confirmed) return;

    setBusyAction(`reset-${project.id}`);
    const result = await projectService.resetProjectData(project.id);

    if (result.success) {
      setMessage(`Project reset. Deleted ${result.deletedCount} records.`);
    } else {
      setError(result.error?.message || 'Failed to reset project.');
    }

    setBusyAction('');
  };

  const handleDeleteProject = async (project) => {
    clearFeedback();

    const confirmed = window.confirm(
      `Delete "${project.name}" permanently?\n\nThis removes the project, members, invitation key, and all research data.`
    );
    if (!confirmed) return;

    setBusyAction(`delete-${project.id}`);
    const result = await projectService.deleteProject(project.id);

    if (result.success) {
      setMessage('Project deleted.');
    } else {
      setError(result.error?.message || 'Failed to delete project.');
    }

    setBusyAction('');
  };

  return (
    <main className="min-h-screen bg-slate-50">
      <header className="bg-white border-b border-slate-200">
        <div className="max-w-6xl mx-auto px-6 py-4 flex items-center justify-between">
          <div>
            <h1 className="text-xl font-semibold text-slate-900">Reflexis Projects</h1>
            <p className="text-sm text-slate-600">
              Hi, {userProfile?.name || currentUser.email}
            </p>
          </div>
          <button
            type="button"
            onClick={onSignOut}
            className="px-3 py-2 text-sm text-slate-700 border border-slate-300 rounded-md hover:bg-slate-100"
          >
            Sign Out
          </button>
        </div>
      </header>

      <div className="max-w-6xl mx-auto px-6 py-8 grid gap-8 lg:grid-cols-[360px_1fr]">
        <section className="space-y-6">
          <form onSubmit={handleCreateProject} className="bg-white border border-slate-200 rounded-lg p-5 shadow-sm">
            <h2 className="text-base font-semibold text-slate-900 mb-4">Create Project</h2>
            <label htmlFor="project-name" className="block text-sm font-medium text-slate-700 mb-1">
              Project Name
            </label>
            <input
              id="project-name"
              value={projectName}
              onChange={(event) => setProjectName(event.target.value)}
              className="w-full px-3 py-2 border border-slate-300 rounded-md text-sm focus:outline-none focus:ring-2 focus:ring-blue-500/20 focus:border-blue-500"
              maxLength={80}
            />
            <button
              type="submit"
              disabled={busyAction === 'create'}
              className="w-full mt-4 px-4 py-2.5 bg-blue-600 text-white text-sm font-medium rounded-md hover:bg-blue-700 disabled:bg-blue-300"
            >
              {busyAction === 'create' ? 'Creating...' : 'Create Project'}
            </button>
          </form>

          <form onSubmit={handleJoinProject} className="bg-white border border-slate-200 rounded-lg p-5 shadow-sm">
            <h2 className="text-base font-semibold text-slate-900 mb-4">Join by Project Key</h2>
            <label htmlFor="join-key" className="block text-sm font-medium text-slate-700 mb-1">
              Project Key
            </label>
            <input
              id="join-key"
              value={joinKey}
              onChange={(event) => setJoinKey(event.target.value)}
              className="w-full px-3 py-2 border border-slate-300 rounded-md text-sm font-mono focus:outline-none focus:ring-2 focus:ring-blue-500/20 focus:border-blue-500"
              autoComplete="off"
            />
            <button
              type="submit"
              disabled={busyAction === 'join'}
              className="w-full mt-4 px-4 py-2.5 bg-slate-900 text-white text-sm font-medium rounded-md hover:bg-slate-800 disabled:bg-slate-400"
            >
              {busyAction === 'join' ? 'Joining...' : 'Join Project'}
            </button>
          </form>

          {lastGeneratedKey && (
            <div className="bg-amber-50 border border-amber-200 rounded-lg p-5">
              <h2 className="text-sm font-semibold text-amber-950">Project Key for {lastGeneratedKey.projectName}</h2>
              <p className="text-xs text-amber-900 mt-2">
                Project owners can also see this key in the project card.
              </p>
              <div className="mt-3 p-3 bg-white border border-amber-200 rounded-md font-mono text-xs break-all">
                {lastGeneratedKey.key}
              </div>
            </div>
          )}

          {(message || error) && (
            <div className={`border rounded-lg p-4 text-sm ${error ? 'bg-red-50 border-red-200 text-red-700' : 'bg-emerald-50 border-emerald-200 text-emerald-700'}`}>
              {error || message}
            </div>
          )}
        </section>

        <section>
          <div className="flex items-center justify-between mb-4">
            <h2 className="text-lg font-semibold text-slate-900">My Projects</h2>
            {loadingProjects && <span className="text-sm text-slate-500">Loading...</span>}
          </div>

          {!loadingProjects && projects.length === 0 && (
            <div className="bg-white border border-slate-200 rounded-lg p-8 text-center">
              <p className="text-sm text-slate-600">
                Create a project or join one with a project key to begin.
              </p>
            </div>
          )}

          <div className="grid gap-4">
            {projects.map((project) => {
              const isOwner = project.membership?.role === 'owner';
              const isEditingName = editingProjectId === project.id;

              return (
                <article key={project.id} className="bg-white border border-slate-200 rounded-lg p-5 shadow-sm">
                  <div className="flex items-start justify-between gap-4">
                    {isEditingName ? (
                      <form onSubmit={(event) => handleRenameProject(event, project)} className="flex-1 min-w-0">
                        <label htmlFor={`edit-project-name-${project.id}`} className="sr-only">
                          Project Name
                        </label>
                        <input
                          id={`edit-project-name-${project.id}`}
                          value={editingProjectName}
                          onChange={(event) => setEditingProjectName(event.target.value)}
                          className="w-full px-3 py-2 border border-slate-300 rounded-md text-sm font-medium text-slate-900 focus:outline-none focus:ring-2 focus:ring-blue-500/20 focus:border-blue-500"
                          maxLength={80}
                          autoFocus
                        />
                        <div className="mt-2 flex flex-wrap gap-2">
                          <button
                            type="submit"
                            disabled={busyAction === `rename-${project.id}`}
                            className="px-3 py-1.5 text-xs font-medium text-white bg-blue-600 rounded-md hover:bg-blue-700 disabled:bg-blue-300"
                          >
                            {busyAction === `rename-${project.id}` ? 'Saving...' : 'Save'}
                          </button>
                          <button
                            type="button"
                            onClick={handleCancelEditProjectName}
                            disabled={busyAction === `rename-${project.id}`}
                            className="px-3 py-1.5 text-xs font-medium text-slate-700 border border-slate-300 rounded-md hover:bg-slate-100 disabled:opacity-50"
                          >
                            Cancel
                          </button>
                        </div>
                      </form>
                    ) : (
                      <div className="min-w-0">
                        <h3 className="font-semibold text-slate-900 break-words">{project.name}</h3>
                        <p className="text-xs text-slate-500 mt-1">
                          Role: {isOwner ? 'Owner' : 'Member'}
                        </p>
                      </div>
                    )}
                    <button
                      type="button"
                      onClick={() => onOpenProject(project)}
                      disabled={isEditingName}
                      className="px-3 py-2 bg-blue-600 text-white text-sm font-medium rounded-md hover:bg-blue-700"
                    >
                      Open
                    </button>
                  </div>

                  {isOwner && (
                    <div className="mt-4 pt-4 border-t border-slate-100 space-y-3">
                      <div>
                        <div className="text-xs font-medium text-slate-600 mb-1">Project Key</div>
                        <div className="p-2 bg-slate-50 border border-slate-200 rounded-md font-mono text-xs break-all text-slate-800">
                          {project.joinKey || 'Key unavailable. Reset the key to generate a visible one.'}
                        </div>
                      </div>
                      <div className="flex flex-wrap gap-2">
                        <button
                          type="button"
                          onClick={() => handleStartEditProjectName(project)}
                          disabled={busyAction === `rename-${project.id}`}
                          className="px-3 py-1.5 text-xs font-medium text-slate-700 border border-slate-300 rounded-md hover:bg-slate-100 disabled:opacity-50"
                        >
                          Edit Name
                        </button>
                        <button
                          type="button"
                          onClick={() => handleRegenerateKey(project)}
                          disabled={busyAction === `key-${project.id}`}
                          className="px-3 py-1.5 text-xs font-medium text-slate-700 border border-slate-300 rounded-md hover:bg-slate-100 disabled:opacity-50"
                        >
                          Reset Key
                        </button>
                        <button
                          type="button"
                          onClick={() => handleResetProject(project)}
                          disabled={busyAction === `reset-${project.id}`}
                          className="px-3 py-1.5 text-xs font-medium text-amber-800 border border-amber-300 rounded-md hover:bg-amber-50 disabled:opacity-50"
                        >
                          Reset Project
                        </button>
                        <button
                          type="button"
                          onClick={() => handleDeleteProject(project)}
                          disabled={busyAction === `delete-${project.id}`}
                          className="px-3 py-1.5 text-xs font-medium text-red-700 border border-red-300 rounded-md hover:bg-red-50 disabled:opacity-50"
                        >
                          Delete Project
                        </button>
                      </div>
                    </div>
                  )}
                </article>
              );
            })}
          </div>
        </section>
      </div>
    </main>
  );
};

export default ProjectDashboard;
