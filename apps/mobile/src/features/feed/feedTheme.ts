/**
 * Design tokens for the Feed feature.
 *
 * Palette is derived from the auth theme (`authTheme.ts`) so the app feels
 * visually cohesive, with additional surface/text tones specific to the feed.
 */
export const feedColors = {
  /** Feed background behind the card list. */
  background: '#F4F7FB',
  /** Card borders / hairline dividers. */
  border: '#E8ECF2',
  /** Muted secondary text (timestamps, meta info). */
  caption: '#667085',
  /** Destructive / error red (unused in feed but kept for parity). */
  error: '#B42318',
  /** Active "liked" heart colour. */
  liked: '#EF4444',
  /** Primary brand accent. */
  primary: '#2563EB',
  /** Active "saved" bookmark colour. */
  saved: '#F59E0B',
  /** Card surface colour. */
  surface: '#FFFFFF',
  /** Primary heading text. */
  text: '#172033',
  /** Secondary body text. */
  textSecondary: '#4B5563',
} as const;

export const feedRadii = {
  /** Outer card radius. */
  card: 16,
  /** Media / avatar radius. */
  media: 12,
} as const;

export const feedSpacing = {
  /** Standard horizontal padding inside a card. */
  cardPadding: 16,
  /** Gap between cards in the list. */
  cardGap: 12,
} as const;
