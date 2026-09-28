/**
 * Design tokens for the Comment feature.
 *
 * Keeps consistency with auth, feed, profile and search tokens.
 */
export const commentColors = {
  background: '#F4F7FB',
  border: '#E8ECF2',
  caption: '#667085',
  handle: '#D1D5DB',
  inputBg: '#F1F5F9',
  liked: '#EF4444',
  overlay: 'rgba(0, 0, 0, 0.45)',
  placeholder: '#9CA3AF',
  primary: '#2563EB',
  primaryDisabled: '#93C5FD',
  primaryPressed: '#1D4ED8',
  surface: '#FFFFFF',
  text: '#172033',
  textSecondary: '#4B5563',
  unliked: '#9CA3AF',
} as const;

export const commentRadii = {
  avatar: 18,
  button: 10,
  input: 20,
  modal: 20,
} as const;
