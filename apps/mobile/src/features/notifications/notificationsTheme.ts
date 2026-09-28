/**
 * Design tokens for the Notifications feature.
 *
 * Consistent with auth, feed, profile, search and comment palettes.
 */
export const notificationsColors = {
  background: '#F4F7FB',
  border: '#E8ECF2',
  caption: '#667085',
  commentBadge: '#3B82F6',
  followBadge: '#8B5CF6',
  likeBadge: '#EF4444',
  pillActiveBg: '#2563EB',
  pillActiveText: '#FFFFFF',
  pillInactiveBg: '#F1F5F9',
  pillInactiveBorder: '#E2E8F0',
  pillInactiveText: '#475569',
  postThumbBorder: '#E2E8F0',
  primary: '#2563EB',
  primaryPressed: '#1D4ED8',
  surface: '#FFFFFF',
  surfaceUnread: '#F0F6FF',
  text: '#172033',
  textSecondary: '#4B5563',
  unreadDot: '#2563EB',
} as const;

export const notificationsRadii = {
  avatar: 22,
  badge: 10,
  button: 8,
  pill: 20,
  postThumb: 8,
} as const;
