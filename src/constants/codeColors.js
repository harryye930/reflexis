export const CODE_COLOR_OPTIONS = [
  { bg: 'bg-blue-200', text: 'text-blue-800', name: 'Blue' },
  { bg: 'bg-green-200', text: 'text-green-800', name: 'Green' },
  { bg: 'bg-yellow-200', text: 'text-yellow-800', name: 'Yellow' },
  { bg: 'bg-red-200', text: 'text-red-800', name: 'Red' },
  { bg: 'bg-purple-200', text: 'text-purple-800', name: 'Purple' },
  { bg: 'bg-pink-200', text: 'text-pink-800', name: 'Pink' },
  { bg: 'bg-indigo-200', text: 'text-indigo-800', name: 'Indigo' },
  { bg: 'bg-orange-200', text: 'text-orange-800', name: 'Orange' },
  { bg: 'bg-teal-200', text: 'text-teal-800', name: 'Teal' },
  { bg: 'bg-gray-200', text: 'text-gray-800', name: 'Gray' }
];

// Fallback colors for unknown/missing codes - distinct from any existing code colors
// Using amber with strong contrast to signal that this is a fallback/warning state
export const FALLBACK_CODE_COLORS = {
  bg: 'bg-amber-300',        // Bright amber background - not in regular palette
  text: 'text-amber-900',    // Very dark amber text for high contrast
  name: 'Warning'            // Indicates this is a fallback state
};
