// Curated quotes shown in the top-banner ticker. Kept short on purpose:
// the ticker has limited horizontal room next to the project info and
// Sign Out button, so anything beyond ~85 characters gets visually cramped.
// New entries should aim for that ceiling — pithy beats comprehensive
// here. Full citations belong in the docs, not the header.

export const REFLECTIVE_QUOTES = [
  {
    text: 'Themes are generated, created or constructed… they don’t just “emerge” from data.',
    source: 'Braun & Clarke, 2022'
  },
  {
    text: 'We are part of the world we study and the data we collect.',
    source: 'Charmaz, 2006'
  },
  {
    text: 'Reflexivity [is] a continual internal dialogue… of researcher’s positionality.',
    source: 'Berger, 2015'
  },
  {
    text: 'Researchers negotiate the swamp of… self analysis and self disclosure.',
    source: 'Finlay, 2002'
  },
  {
    text: 'Coding is not a precise science; it’s primarily an interpretive act.',
    source: 'Saldaña, 2016'
  },
  {
    text: 'Themes do not reside in the data waiting to be found.',
    source: 'Byrne, 2022'
  },
  {
    text: 'The researcher plays an active role in interpreting codes and themes.',
    source: 'Byrne, 2022'
  },
  {
    text: 'Persuade audiences that the findings of an inquiry are worth paying attention to.',
    source: 'Lincoln & Guba, 1985'
  },
  {
    text: 'Feminist objectivity means quite simply situated knowledges.',
    source: 'Haraway, 1988'
  },
  {
    text: 'Researcher subjectivity as a resource for research.',
    source: 'Braun & Clarke, 2024'
  }
];

// Pick a quote deterministically per session/key so it stays stable while a
// researcher is reading, but rotates when they return tomorrow.
export const pickReflectiveQuote = (seedKey = '') => {
  if (!REFLECTIVE_QUOTES.length) return null;
  const today = new Date().toISOString().slice(0, 10);
  const seed = `${seedKey}|${today}`;
  let hash = 0;
  for (let i = 0; i < seed.length; i++) {
    hash = (hash * 31 + seed.charCodeAt(i)) | 0;
  }
  const index = Math.abs(hash) % REFLECTIVE_QUOTES.length;
  return REFLECTIVE_QUOTES[index];
};
