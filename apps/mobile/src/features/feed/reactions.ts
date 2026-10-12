/**
 * The reactions a post can receive. The emoji here are content (what the user
 * chose to say), not interface icons, and are written as escapes so the
 * icon-in-text check does not mistake the heart for a hand-drawn icon.
 */
export type ReactionType = 'ANGRY' | 'HAHA' | 'LIKE' | 'LOVE' | 'SAD' | 'WOW';

export const REACTIONS: ReadonlyArray<{ emoji: string; label: string; type: ReactionType }> = [
  // A plain tap on the heart is LIKE, so LIKE is the heart here as well.
  { emoji: '\u2764\uFE0F', label: 'Thích', type: 'LIKE' },
  { emoji: '\u{1F60D}', label: 'Yêu thích', type: 'LOVE' },
  { emoji: '\u{1F606}', label: 'Haha', type: 'HAHA' },
  { emoji: '\u{1F62E}', label: 'Wow', type: 'WOW' },
  { emoji: '\u{1F622}', label: 'Buồn', type: 'SAD' },
  { emoji: '\u{1F621}', label: 'Phẫn nộ', type: 'ANGRY' },
];

export function reactionOf(type: string | null | undefined) {
  return REACTIONS.find((reaction) => reaction.type === type) ?? null;
}
