/**
 * Data models for the Reels feature. A reel is a `Post` whose first media
 * item is a video; only the interaction log has its own shape.
 */

export type ReelEventType =
  | 'COMPLETE'
  | 'LIKE'
  | 'NOT_INTERESTED'
  | 'REPLAY'
  | 'SAVE'
  | 'SKIP'
  | 'VIEW';

/** One row of the interaction log sent to `POST /interactions`. */
export type ReelEvent = {
  createdAt: string;
  durationMs: number | null;
  /** Generated on the device so a retried batch is not counted twice. */
  eventId: string;
  eventType: ReelEventType;
  mediaId: string | null;
  /** Index of the reel in the feed when it was shown. */
  position: number;
  postId: string;
  /** Which recommendation response the reel came from. */
  requestId: string;
  surface: 'reels';
  watchMs: number | null;
};

/** What the player measured while one reel was on screen. */
export type ReelViewStats = {
  durationMs: number;
  /** Times the video restarted from the beginning. */
  loops: number;
  /** Time actually spent playing (pauses and buffering excluded). */
  watchMs: number;
};
