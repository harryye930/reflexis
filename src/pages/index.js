import CollaborativeText from '@/components/CollaborativeText';
import AuthScreen from '@/components/auth/AuthScreen';
import ProjectDashboard from '@/components/project/ProjectDashboard';
import UserProfileSetup from '@/components/UserProfileSetup';
import { useAuth } from '@/hooks/useAuth';
import Head from 'next/head';
import { useState } from 'react';

export default function Home() {
  const {
    currentUser,
    userProfile,
    loading,
    needsProfileSetup,
    setupError,
    completeProfile,
    signIn,
    signUp,
    logOut
  } = useAuth();
  const [activeProject, setActiveProject] = useState(null);

  const handleSignOut = async () => {
    setActiveProject(null);
    await logOut();
  };

  return (
    <>
      <Head>
        <title>Collaborative Qualitative Analysis Tool</title>
        <link rel="icon" href="/favicon.ico" />
      </Head>
      {loading && (
        <main className="min-h-screen bg-slate-50 flex items-center justify-center">
          <p className="text-sm text-slate-600">Loading...</p>
        </main>
      )}

      {!loading && !currentUser && (
        <AuthScreen onSignIn={signIn} onSignUp={signUp} />
      )}

      {!loading && currentUser && setupError && (
        <main className="min-h-screen bg-slate-50 flex items-center justify-center p-6">
          <div className="w-full max-w-lg bg-white border border-amber-200 rounded-lg shadow-sm p-8">
            <h1 className="text-xl font-semibold text-slate-900">Firebase Setup Needed</h1>
            <p className="text-sm text-slate-700 mt-3">
              {setupError}
            </p>
            <p className="text-sm text-slate-600 mt-4">
              Deploy the updated Firestore rules, then refresh this page. For local development, the frontend still uses your real Firebase project from `.env.local`.
            </p>
            <button
              type="button"
              onClick={handleSignOut}
              className="mt-6 px-4 py-2 bg-slate-900 text-white text-sm font-medium rounded-md hover:bg-slate-800"
            >
              Sign Out
            </button>
          </div>
        </main>
      )}

      {!loading && currentUser && !setupError && needsProfileSetup && (
        <UserProfileSetup
          currentUser={currentUser}
          completeProfile={completeProfile}
          onComplete={() => {}}
        />
      )}

      {!loading && currentUser && !setupError && !needsProfileSetup && !activeProject && (
        <ProjectDashboard
          currentUser={currentUser}
          userProfile={userProfile}
          onOpenProject={setActiveProject}
          onSignOut={handleSignOut}
        />
      )}

      {!loading && currentUser && !setupError && !needsProfileSetup && activeProject && (
        <CollaborativeText
          currentUser={currentUser}
          project={activeProject}
          onBackToProjects={() => setActiveProject(null)}
          onSignOut={handleSignOut}
        />
      )}
    </>
  );
}
