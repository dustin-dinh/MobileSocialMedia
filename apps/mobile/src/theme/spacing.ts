export const claySpacing = {
  xs: 4,
  sm: 8,
  md: 12,
  base: 16,
  lg: 20,
  xl: 24,
  xxl: 32,
} as const;

/**
 * Corner radii. Content (cards, media, controls) uses small radii so the
 * layout reads as calm and flat; only floating layers are rounder.
 */
export const clayRadii = {
  /** Buttons and text inputs. */
  control: 12,
  /** Post cards and other bordered content blocks. */
  card: 12,
  /** Images and videos inside a card. */
  media: 10,
  /** Centered dialogs. */
  dialog: 16,
  /** Top corners of bottom sheets. */
  modal: 20,
  pill: 999,
  avatar: 999,
} as const;

export const clayDimensions = {
  minTouchTarget: 44,
  /** Horizontal page margin shared by every screen. */
  gutter: 16,
  /** Height of the bottom tab bar, without the safe-area inset. */
  tabBarHeight: 56,
} as const;
