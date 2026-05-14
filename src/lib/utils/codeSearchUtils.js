const normalizeSearchText = (value) => {
  if (value === null || value === undefined) return '';

  return String(value)
    .normalize('NFKD')
    .replace(/[\u0300-\u036f]/g, '')
    .toLowerCase()
    .trim()
    .replace(/\s+/g, ' ');
};

const getSearchTerms = (query) => normalizeSearchText(query).split(' ').filter(Boolean);

export const CODE_SORT_MODES = {
  ALPHABETICAL: 'alphabetical',
  CREATED_AT: 'createdAt'
};

const getCodeCreatedAtMillis = (code) => {
  const createdAt = code?.createdAt;
  if (!createdAt) return 0;
  if (typeof createdAt.toDate === 'function') return createdAt.toDate().getTime();
  if (typeof createdAt.seconds === 'number') return createdAt.seconds * 1000;

  const millis = new Date(createdAt).getTime();
  return Number.isNaN(millis) ? 0 : millis;
};

const getCodeSearchText = (code, getUserName) => {
  if (!code || typeof code !== 'object') return '';

  const createdByName = typeof getUserName === 'function'
    ? getUserName(code.createdBy)
    : '';

  return normalizeSearchText([
    code.label,
    code.description,
    code.id,
    code.createdBy,
    createdByName
  ].filter(value => value !== null && value !== undefined).join(' '));
};

export const codeMatchesSearchQuery = (code, query, getUserName) => {
  const terms = getSearchTerms(query);
  if (terms.length === 0) return true;

  const searchableText = getCodeSearchText(code, getUserName);
  if (!searchableText) return false;

  return terms.every(term => searchableText.includes(term));
};

export const filterCodesBySearchQuery = (codes, query, getUserName) => {
  if (!Array.isArray(codes)) return [];
  return codes.filter(code => codeMatchesSearchQuery(code, query, getUserName));
};

export const sortCodes = (codes, sortMode = CODE_SORT_MODES.ALPHABETICAL) => {
  if (!Array.isArray(codes)) return [];

  return [...codes].sort((a, b) => {
    if (sortMode === CODE_SORT_MODES.CREATED_AT) {
      const createdAtDifference = getCodeCreatedAtMillis(b) - getCodeCreatedAtMillis(a);
      if (createdAtDifference !== 0) return createdAtDifference;
    }

    return String(a?.label || a?.id || '').localeCompare(
      String(b?.label || b?.id || ''),
      undefined,
      { sensitivity: 'base', numeric: true }
    );
  });
};
