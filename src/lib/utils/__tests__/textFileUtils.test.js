import { normalizeTextFileContent } from '../textFileUtils.js';

describe('normalizeTextFileContent', () => {
  test('normalizes CRLF and CR line endings to LF', () => {
    const raw = 'Interviewer: Hello\r\nParticipant: Hi\rInterviewer: Thanks\nParticipant: Bye';

    expect(normalizeTextFileContent(raw)).toBe(
      'Interviewer: Hello\nParticipant: Hi\nInterviewer: Thanks\nParticipant: Bye'
    );
  });

  test('preserves blank lines after normalization', () => {
    const raw = 'Question one.\r\n\r\nAnswer one.\r\n\r\nAnswer two.';

    expect(normalizeTextFileContent(raw)).toBe(
      'Question one.\n\nAnswer one.\n\nAnswer two.'
    );
  });

  test('returns an empty string for non-string content', () => {
    expect(normalizeTextFileContent(null)).toBe('');
    expect(normalizeTextFileContent(undefined)).toBe('');
  });
});
