// Curated quotes shown in the top-banner ticker. Kept short on purpose:
// the ticker has limited horizontal room next to the project info and
// Sign Out button, so anything beyond ~85 characters gets visually cramped.
// New entries should aim for that ceiling — pithy beats comprehensive
// here. Full citations belong in the docs, not the header.

export const REFLECTIVE_QUOTES = [
  {
    text: 'Themes are constructed by the researcher; they do not emerge from data.',
    source: 'Braun & Clarke, 2019'
  },
  {
    text: 'There is no neutral place from which to read a transcript.',
    source: 'Charmaz, 2006'
  },
  {
    text: 'Reflexivity is a continual internal dialogue with one’s positionality.',
    source: 'Berger, 2015'
  },
  {
    text: 'What we notice tells us as much about ourselves as about the data.',
    source: 'Finlay, 2002'
  },
  {
    text: 'Coding is not mechanical labelling. It is an interpretive choice.',
    source: 'Saldaña, 2021'
  },
  {
    text: 'Slow down. Your first reading is rarely your most honest one.',
    source: 'Practitioner note'
  },
  {
    text: 'Take seriously how participants account for their own lives.',
    source: 'Riessman, 2008'
  },
  {
    text: 'Trustworthiness comes from transparency, not claims of objectivity.',
    source: 'Lincoln & Guba, 1985'
  },
  {
    text: 'Disagreement between coders is data — it points to contested meaning.',
    source: 'Reflexis team note'
  },
  {
    text: 'Begin with what surprises you, not with what confirms your hypothesis.',
    source: 'Glaser & Strauss, 1967'
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
