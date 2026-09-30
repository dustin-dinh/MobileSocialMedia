import { clayColors } from '../../theme/colors';
import { clayRadii } from '../../theme/spacing';

export const profileColors = {
  background: clayColors.canvas,
  border: clayColors.border,
  caption: clayColors.caption,
  danger: clayColors.error,
  dangerPressed: clayColors.errorPressed,
  follow: clayColors.primary,
  followPressed: clayColors.primaryPressed,
  primary: clayColors.primary,
  primaryPressed: clayColors.primaryPressed,
  surface: clayColors.surface,
  text: clayColors.text,
  textSecondary: clayColors.textSecondary,
  unfollow: clayColors.surfaceWell,
  unfollowText: clayColors.text,
  canvas: clayColors.canvas,
  surfaceWell: clayColors.surfaceWell,
  onPrimary: clayColors.onPrimary,
} as const;

export const profileRadii = {
  avatar: 48,
  button: clayRadii.control,
  card: clayRadii.card,
  modal: clayRadii.modal,
} as const;
