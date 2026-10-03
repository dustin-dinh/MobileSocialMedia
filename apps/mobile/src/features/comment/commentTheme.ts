import { clayColors } from '../../theme/colors';
import { clayRadii } from '../../theme/spacing';

export const commentColors = {
  background: clayColors.canvas,
  border: clayColors.border,
  caption: clayColors.caption,
  handle: clayColors.border,
  inputBg: clayColors.surfaceWell,
  liked: clayColors.liked,
  overlay: 'rgba(74, 42, 53, 0.45)',
  placeholder: clayColors.caption,
  primary: clayColors.primary,
  primaryDisabled: clayColors.primarySoft,
  primaryPressed: clayColors.primaryPressed,
  surface: clayColors.surface,
  text: clayColors.text,
  textSecondary: clayColors.textSecondary,
  unliked: clayColors.caption,
} as const;

export const commentRadii = {
  avatar: 20,
  button: clayRadii.control,
  input: clayRadii.control,
  modal: clayRadii.modal,
} as const;
