import {
  CODE_SORT_MODES,
  codeMatchesSearchQuery,
  filterCodesBySearchQuery,
  sortCodes
} from '../codeSearchUtils.js';

const codes = [
  {
    id: 'participant_trust',
    label: 'Participant Trust',
    description: 'Moments where participants describe confidence in the process',
    createdBy: 'user-1'
  },
  {
    id: 'power_dynamics',
    label: 'Power Dynamics',
    description: 'Tension between facilitator and participant',
    createdBy: 'user-2'
  },
  {
    id: 'cafe_notes',
    label: 'Café Notes',
    description: null,
    createdBy: 'system'
  }
];

const getUserName = (userId) => ({
  'user-1': 'Alice Researcher',
  'user-2': 'Ben Analyst',
  system: 'System'
}[userId] || 'Unknown');

describe('code search helpers', () => {
  test('returns all codes for empty or whitespace-only queries', () => {
    expect(filterCodesBySearchQuery(codes, '')).toEqual(codes);
    expect(filterCodesBySearchQuery(codes, '   \n\t   ')).toEqual(codes);
  });

  test('matches label, description, id, creator id, and creator display name case-insensitively', () => {
    expect(filterCodesBySearchQuery(codes, 'trust').map(code => code.id)).toEqual(['participant_trust']);
    expect(filterCodesBySearchQuery(codes, 'FACILITATOR').map(code => code.id)).toEqual(['power_dynamics']);
    expect(filterCodesBySearchQuery(codes, 'power_dyn').map(code => code.id)).toEqual(['power_dynamics']);
    expect(filterCodesBySearchQuery(codes, 'user-1').map(code => code.id)).toEqual(['participant_trust']);
    expect(filterCodesBySearchQuery(codes, 'alice', getUserName).map(code => code.id)).toEqual(['participant_trust']);
  });

  test('requires every search term to be present across searchable fields', () => {
    expect(filterCodesBySearchQuery(codes, 'participant confidence').map(code => code.id)).toEqual(['participant_trust']);
    expect(filterCodesBySearchQuery(codes, 'participant missing').map(code => code.id)).toEqual([]);
  });

  test('handles missing code fields and non-array inputs safely', () => {
    expect(codeMatchesSearchQuery(null, 'anything')).toBe(false);
    expect(codeMatchesSearchQuery({ id: 'only_id' }, 'only')).toBe(true);
    expect(filterCodesBySearchQuery(null, 'trust')).toEqual([]);
  });

  test('normalizes accents while searching', () => {
    expect(filterCodesBySearchQuery(codes, 'cafe').map(code => code.id)).toEqual(['cafe_notes']);
  });

  test('sorts codes alphabetically by label', () => {
    const unsortedCodes = [
      { id: 'z', label: 'Zebra' },
      { id: 'a', label: 'apple' },
      { id: 'b', label: 'Beta' }
    ];

    expect(sortCodes(unsortedCodes, CODE_SORT_MODES.ALPHABETICAL).map(code => code.id)).toEqual(['a', 'b', 'z']);
    expect(unsortedCodes.map(code => code.id)).toEqual(['z', 'a', 'b']);
  });

  test('sorts codes by creation time with newest first', () => {
    const unsortedCodes = [
      { id: 'old', label: 'Old', createdAt: new Date('2026-01-01T00:00:00Z') },
      { id: 'new', label: 'New', createdAt: { toDate: () => new Date('2026-08-01T00:00:00Z') } },
      { id: 'middle', label: 'Middle', createdAt: '2026-06-01T00:00:00Z' }
    ];

    expect(sortCodes(unsortedCodes, CODE_SORT_MODES.CREATED_AT).map(code => code.id)).toEqual(['new', 'middle', 'old']);
  });
});
