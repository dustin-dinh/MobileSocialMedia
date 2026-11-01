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
 * Corner radii, tight and chosen once: 8 for content and controls, stepping up
 * only for layers that float (dialogs, sheets). People are circles.
 */
export const clayRadii = {
  /** Buttons and text inputs. */
  control: 8,
  /** Bordered content blocks. */
  card: 8,
  /** Photographs and videos. */
  media: 8,
  /** Centered dialogs. */
  dialog: 12,
  /** Top corners of bottom sheets. */
  modal: 16,
  pill: 999,
  avatar: 999,
} as const;

export const clayDimensions = {
  minTouchTarget: 44,
  /** Horizontal page margin shared by every screen. */
  gutter: 16,
  /** Height of the bottom tab bar, without the safe-area inset. */
  tabBarHeight: 60,
} as const;
