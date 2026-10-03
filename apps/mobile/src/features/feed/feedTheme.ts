import { clayColors } from '../../theme/colors';
import { clayRadii, claySpacing } from '../../theme/spacing';

export const feedColors = {
  background: clayColors.canvas,
  border: clayColors.border,
  caption: clayColors.caption,
  error: clayColors.error,
  liked: clayColors.liked,
  primary: clayColors.primary,
  saved: clayColors.saved,
  surface: clayColors.surface,
  text: clayColors.text,
  textSecondary: clayColors.textSecondary,
} as const;

export const feedRadii = {
  card: clayRadii.card,
  media: 20,
} as const;

export const feedSpacing = {
  cardPadding: claySpacing.base,
  cardGap: claySpacing.md,
} as const;
