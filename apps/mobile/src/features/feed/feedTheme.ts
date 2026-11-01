import { clayColors } from '../../theme/colors';
import { claySpacing } from '../../theme/spacing';

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

/**
 * Posts are full-width blocks on `surface`; `cardPadding` is the page margin
 * inside them and `cardGap` the one step of ground between two posts.
 */
export const feedSpacing = {
  cardPadding: claySpacing.base,
  cardGap: claySpacing.sm,
} as const;
