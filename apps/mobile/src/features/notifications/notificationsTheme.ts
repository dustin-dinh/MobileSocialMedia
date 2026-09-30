import { clayColors } from '../../theme/colors';
import { clayRadii } from '../../theme/spacing';

export const notificationsColors = {
  background: clayColors.canvas,
  border: clayColors.border,
  caption: clayColors.caption,
  commentBadge: clayColors.primary,
  followBadge: clayColors.saved,
  likeBadge: clayColors.liked,
  pillActiveBg: clayColors.primary,
  pillActiveText: clayColors.onPrimary,
  pillInactiveBg: clayColors.surfaceWell,
  pillInactiveBorder: clayColors.border,
  pillInactiveText: clayColors.textSecondary,
  postThumbBorder: clayColors.border,
  primary: clayColors.primary,
  primaryPressed: clayColors.primaryPressed,
  surface: clayColors.surface,
  surfaceUnread: clayColors.surfaceHigh,
  text: clayColors.text,
  textSecondary: clayColors.textSecondary,
  unreadDot: clayColors.primary,
  canvas: clayColors.canvas,
  surfaceWell: clayColors.surfaceWell,
  onPrimary: clayColors.onPrimary,
} as const;

export const notificationsRadii = {
  avatar: 22,
  badge: 10,
  button: clayRadii.control,
  pill: clayRadii.pill,
  postThumb: 10,
} as const;
