export const normalizeTextFileContent = (raw) => (
  (typeof raw === 'string' ? raw : '').replace(/\r\n?/g, '\n')
);
