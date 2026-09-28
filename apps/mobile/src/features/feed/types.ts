/**
 * Data models for posts and the feed.
 *
 * These types mirror the backend API contract that Dev B is building.
 * Keeping them here (inside the feature) keeps the coupling local; if multiple
 * features eventually share them, they can be promoted to `src/types/`.
 */

/** Lightweight author embedded in every post. */
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
  id: string;
  /** Display order (0-based). */
  order: number;
  type: PostMediaType;
  url: string;
};

/** A single post as returned by the API. */
export type Post = {
  author: PostAuthor;
  commentsCount: number;
  content: string;
  createdAt: string;
  id: string;
  isLiked: boolean;
  isSaved: boolean;
  likesCount: number;
  media: PostMedia[];
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
