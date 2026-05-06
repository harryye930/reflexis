import { buildCsv } from './csvUtils.js';

const formatTimestamp = (value) => {
  if (!value) return '';
  if (typeof value.toDate === 'function') return value.toDate().toISOString();
  if (value instanceof Date) return value.toISOString();
  if (typeof value.seconds === 'number') return new Date(value.seconds * 1000).toISOString();
  if (typeof value === 'string' || typeof value === 'number') {
    const date = new Date(value);
    return Number.isNaN(date.getTime()) ? String(value) : date.toISOString();
  }
  return '';
};

const toMillis = (value) => {
  if (!value) return 0;
  if (typeof value.toDate === 'function') return value.toDate().getTime();
  if (value instanceof Date) return value.getTime();
  if (typeof value.seconds === 'number') return value.seconds * 1000;
  if (typeof value === 'string' || typeof value === 'number') {
    const date = new Date(value);
    return Number.isNaN(date.getTime()) ? 0 : date.getTime();
  }
  return 0;
};

const sanitizeFilename = (name) => {
  const trimmed = (name || 'project').trim() || 'project';
  return trimmed.replace(/[^a-z0-9-_]+/gi, '_').slice(0, 60);
};

export const buildHighlightCsv = ({ project, highlights, codeLookup, memberLookup, documentLookup }) => {
  const headers = [
    'Document',
    'Passage',
    'Code',
    'Code description',
    'Coder',
    'Coder email',
    'Coded at',
    'Highlight ID'
  ];

  const sorted = [...highlights].sort((a, b) => {
    const docA = documentLookup.get(a.documentId)?.title || '';
    const docB = documentLookup.get(b.documentId)?.title || '';
    if (docA !== docB) return docA.localeCompare(docB);
    return (a.startIndex ?? 0) - (b.startIndex ?? 0);
  });

  const rows = sorted.map((highlight) => {
    const codeKey = highlight.code || highlight.codeId;
    const code = codeKey ? codeLookup.get(codeKey) : null;
    const member = highlight.userId ? memberLookup.get(highlight.userId) : null;
    const documentTitle = documentLookup.get(highlight.documentId)?.title
      || highlight.documentTitle
      || (highlight.documentId ? `Document ${highlight.documentId}` : '');

    return [
      documentTitle,
      highlight.text || '',
      code?.label || codeKey || '',
      code?.description || '',
      member?.name || '',
      member?.email || '',
      formatTimestamp(highlight.createdAt),
      highlight.id || ''
    ];
  });

  return {
    filename: `${sanitizeFilename(project.name)}_highlights.csv`,
    content: buildCsv(headers, rows)
  };
};

// One row per reflexive response. Joinable to the highlights CSV via
// Highlight ID. Sorted by document → highlight start offset → response time
// so revisions of the same prompt sit together in the order they were made.
export const buildReflexiveCsv = ({
  project,
  reflexiveResponses,
  highlights,
  codeLookup,
  memberLookup,
  documentLookup
}) => {
  const headers = [
    'Highlight ID',
    'Document',
    'Code',
    'Passage',
    'Reflexive author',
    'Author email',
    'Prompt type',
    'Prompt',
    'Response',
    'Created at',
    'Updated at'
  ];

  const highlightLookup = new Map();
  for (const highlight of highlights || []) {
    highlightLookup.set(highlight.id, highlight);
  }

  const enriched = reflexiveResponses.map((response) => {
    const highlight = highlightLookup.get(response.highlightId);
    const documentId = highlight?.documentId || response.documentId;
    const documentTitle = documentLookup.get(documentId)?.title
      || (documentId ? `Document ${documentId}` : '');
    const codeKey = highlight?.code || highlight?.codeId || response.codeId;
    const code = codeKey ? codeLookup.get(codeKey) : null;
    const author = response.userId ? memberLookup.get(response.userId) : null;
    return { response, highlight, documentTitle, code, author };
  });

  enriched.sort((a, b) => {
    if (a.documentTitle !== b.documentTitle) return a.documentTitle.localeCompare(b.documentTitle);
    const offsetA = a.highlight?.startIndex ?? 0;
    const offsetB = b.highlight?.startIndex ?? 0;
    if (offsetA !== offsetB) return offsetA - offsetB;
    return toMillis(a.response.createdAt) - toMillis(b.response.createdAt);
  });

  const rows = enriched.map(({ response, highlight, documentTitle, code, author }) => [
    response.highlightId || '',
    documentTitle,
    code?.label || response.codeLabel || '',
    highlight?.text || response.sourceText || '',
    author?.name || '',
    author?.email || '',
    response.promptType || '',
    response.prompt || '',
    response.response || '',
    formatTimestamp(response.createdAt),
    formatTimestamp(response.updatedAt)
  ]);

  return {
    filename: `${sanitizeFilename(project.name)}_reflexive.csv`,
    content: buildCsv(headers, rows)
  };
};
