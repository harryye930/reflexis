/**
 * Minimal CSV helpers. Handles values containing commas, quotes, and newlines
 * by wrapping them in double quotes and escaping embedded quotes.
 */

const escapeCell = (value) => {
  if (value === null || value === undefined) return '';
  const str = String(value);
  if (/[",\r\n]/.test(str)) {
    return `"${str.replace(/"/g, '""')}"`;
  }
  return str;
};

/**
 * Build a CSV string from a header array and row arrays.
 * Uses CRLF line endings (Excel-friendly) and a leading UTF-8 BOM.
 */
const UTF8_BOM = '﻿';

export const buildCsv = (headers, rows) => {
  const lines = [headers.map(escapeCell).join(',')];
  for (const row of rows) {
    lines.push(row.map(escapeCell).join(','));
  }
  return UTF8_BOM + lines.join('\r\n') + '\r\n';
};

/**
 * Trigger a browser download of the given text as a file.
 */
export const downloadTextFile = (filename, text, mimeType = 'text/csv;charset=utf-8') => {
  const blob = new Blob([text], { type: mimeType });
  const url = URL.createObjectURL(blob);
  const link = document.createElement('a');
  link.href = url;
  link.download = filename;
  document.body.appendChild(link);
  link.click();
  document.body.removeChild(link);
  URL.revokeObjectURL(url);
};
