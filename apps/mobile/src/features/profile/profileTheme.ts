/**
 * Design tokens for the Profile feature.
 *
 * Consistent with auth and feed palettes for visual cohesion.
 */
export const profileColors = {
  background: '#F4F7FB',
  border: '#E8ECF2',
  caption: '#667085',
  danger: '#B42318',
  dangerPressed: '#991B1B',
  follow: '#2563EB',
  followPressed: '#1D4ED8',
  primary: '#2563EB',
  primaryPressed: '#1D4ED8',
  surface: '#FFFFFF',
  text: '#172033',
  textSecondary: '#4B5563',
  unfollow: '#E8ECF2',
  unfollowText: '#172033',
} as const;

export const profileRadii = {
  avatar: 48,
  button: 12,
  card: 16,
  modal: 20,
} as const;
