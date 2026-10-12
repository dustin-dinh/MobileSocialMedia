/**
 * Data models for posts and the feed.
 *
 * These types mirror the backend API contract that Dev B is building.
 * Keeping them here (inside the feature) keeps the coupling local; if multiple
 * features eventually share them, they can be promoted to `src/types/`.
 */

/** Lightweight author embedded in every post. */
import type { ReactionType } from './reactions';

export type PostAuthor = {
  avatarUrl: string | null;
  displayName: string | null;
  id: string;
  username: string;
};

/** Media attachment types supported by the backend. */
export type PostMediaType = 'IMAGE' | 'VIDEO';

/** Single media attachment on a post. */
export type PostMedia = {
  /** Video length in milliseconds, when the backend reports it. */
  durationMs?: number;
  height?: number;
  id: string;
  /** Display order (0-based). */
  order: number;
  /** Poster image for a video. */
  thumbnailUrl?: string;
  type: PostMediaType;
  url: string;
  width?: number;
};

/** Post privacy levels. */
export type PostPrivacy = 'PUBLIC' | 'FRIENDS' | 'ONLY_ME';

/** A single post as returned by the API. */
export type Post = {
  author: PostAuthor;
  commentsCount: number;
  content: string;
  createdAt: string;
  id: string;
  isLiked: boolean;
  /** Whether the signed-in user has reposted this post. */
  isReposted?: boolean;
  /** Placeholder content (sample reels): interactions stay on the device. */
  isSample?: boolean;
  isSaved: boolean;
  likesCount: number;
  media: PostMedia[];
  /** The viewer's reaction; `LIKE` is the plain heart. Null or absent when there is none. */
  myReaction?: ReactionType | null;
  privacy?: PostPrivacy;
  /** Set when this feed row is someone's repost of the post. */
  repost?: {
    by: PostAuthor;
    createdAt: string;
    /** Id of the repost row; unique even when the original is also listed. */
    id: string;
  };
  repostsCount?: number;
  /** A repost whose original was deleted or is no longer visible to the viewer. */
  unavailable?: boolean;
};

/** Paginated feed response shape from `GET /posts/feed`. */
export type FeedResponse = {
  data: Post[];
  meta: {
    hasMore: boolean;
    page: number;
    totalCount: number;
  };
};
