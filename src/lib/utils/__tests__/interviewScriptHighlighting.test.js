/**
 * Regression coverage for uploaded interview transcripts with line breaks.
 *
 * @jest-environment jsdom
 */

import fs from 'fs';
import path from 'path';
import { findTextWithContext } from '../selectionUtils.js';
import { normalizeTextFileContent } from '../textFileUtils.js';

const fixturePath = path.join(
  process.cwd(),
  'test-fixtures',
  'interview-script-with-newlines.txt'
);

const readInterviewScript = () => (
  normalizeTextFileContent(fs.readFileSync(fixturePath, 'utf8'))
);

describe('interview script highlight mapping', () => {
  test('disambiguates a repeated phrase in the uploaded transcript', () => {
    const source = readInterviewScript();
    const target = 'I felt rushed';
    const firstOccurrence = source.indexOf(target);
    const secondOccurrence = source.indexOf(target, firstOccurrence + 1);

    const beforeContext = 'Not only at the beginning. Later,';
    const afterContext = 'again when there were two similar codes';
    const match = findTextWithContext(source, target, beforeContext, afterContext);

    expect(match.start).toBe(secondOccurrence);
    expect(source.substring(match.start, match.end)).toBe(target);
  });

  test('maps a selection that crosses a blank line back to original LF offsets', () => {
    const source = readInterviewScript();
    const target = 'Blank lines gave me breathing room. Participant: They also made it easier';

    const match = findTextWithContext(source, target);
    const originalSlice = source.substring(match.start, match.end);

    expect(originalSlice).toBe(
      'Blank lines gave me breathing room.\n\nParticipant: They also made it easier'
    );
  });

  test('maps a whole speaker turn without consuming the next question', () => {
    const source = readInterviewScript();
    const target = 'That sentence carried two ideas at once.';
    const afterContext = 'Interviewer: Did blank lines change how you read?';

    const match = findTextWithContext(source, target, '', afterContext);

    expect(source.substring(match.start, match.end)).toBe(target);
    expect(source.substring(match.end)).toMatch(/^\n\nInterviewer/);
  });
});
