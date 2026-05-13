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

