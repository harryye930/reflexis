import Head from 'next/head';
import CollaborativeText from '@/components/CollaborativeText';
import { demoProject, demoUser } from '@/lib/demo/seed';

export default function Demo() {
  const exitDemo = () => { window.location.href = '/'; };
  return (
    <>
      <Head>
        <title>Reflexis demo</title>
        <meta name="description" content="Demo workspace. Changes are not saved. AI features are disabled." />
        <link rel="icon" href="/favicon.svg" />
      </Head>
      <CollaborativeText currentUser={demoUser} project={demoProject} onBackToProjects={exitDemo} onSignOut={exitDemo} />
    </>
  );
}
