import { clayColors } from '../../theme/colors';
import { clayRadii } from '../../theme/spacing';

export const searchColors = {
  background: clayColors.canvas,
  border: clayColors.border,
  caption: clayColors.caption,
  clearButton: clayColors.caption,
  followBg: clayColors.primary,
  followBgPressed: clayColors.primaryPressed,
  followText: clayColors.onPrimary,
  followingBg: clayColors.surfaceWell,
  followingBgPressed: clayColors.border,
  followingBorder: clayColors.border,
  followingText: clayColors.text,
  inputBg: clayColors.surfaceWell,
  placeholder: clayColors.caption,
  primary: clayColors.primary,
  searchIcon: clayColors.caption,
  surface: clayColors.surface,
  text: clayColors.text,
  textSecondary: clayColors.textSecondary,
  surfaceWell: clayColors.surfaceWell,
} as const;

export const searchRadii = {
  button: clayRadii.control,
  card: clayRadii.card,
  input: clayRadii.control,
} as const;
