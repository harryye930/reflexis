import CollaborativeText from '@/components/CollaborativeTextRefactored';
import Head from 'next/head';

export default function Home() {
  return (
    <>
      <Head>
        <title>Collaborative Qualitative Analysis Tool</title>
        <link rel="icon" href="/favicon.ico" />
      </Head>
      <CollaborativeText />
    </>
  );
}