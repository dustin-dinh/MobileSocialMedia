/**
 * Maps the backend post payload onto the UI `Post` model.
 *
 * The API and the UI disagree on a few field names (`likeCount` vs `likesCount`,
 * lower-case media `type`, nullable `content`, `PRIVATE` vs `ONLY_ME`), and the
 * feed mixes plain posts with reposts. Every post-shaped response goes through
 * `mapApiPost` / `mapApiFeedItem`.
 */
import type { FeedResponse, Post, PostAuthor, PostMediaType, PostPrivacy } from '../types';

export type ApiPost = {
  author: PostAuthor;
  commentsCount?: number;
  content: string | null;
  createdAt: string;
  id: string;
  isLiked?: boolean;
  isReposted?: boolean;
  isSaved?: boolean;
  likeCount?: number;
  media: Array<{
    durationMs?: number | null;
    height?: number | null;
    id: string;
    order: number;
    thumbnailUrl?: string | null;
    type: string;
    url: string;
    width?: number | null;
  }>;
  privacy?: string;
  repostsCount?: number;
};

/** A row of `GET /posts/feed` or `GET /users/:id/reposts`. */
export type ApiFeedItem =
  | (ApiPost & { type?: 'POST' })
  | {
      createdAt: string;
      id: string;
      /** `available: false` when the original was deleted or is no longer visible. */
      originalPost: (Partial<ApiPost> & { available: boolean }) | null;
      repostedBy: PostAuthor;
      type: 'REPOST';
    };

export type ApiPageMeta = {
  limit: number;
  page: number;
  total: number;
  totalPages: number;
};

export type ApiPostListResponse = {
  data: ApiFeedItem[];
  meta: ApiPageMeta;
};

function mapMediaType(type: string): PostMediaType {
  return type.toUpperCase() === 'VIDEO' ? 'VIDEO' : 'IMAGE';
}

/** The backend calls the "only me" level `PRIVATE`. */
export function fromApiPrivacy(privacy: string | undefined): PostPrivacy | undefined {
  if (privacy === 'PRIVATE') {
    return 'ONLY_ME';
  }

  return privacy === 'PUBLIC' || privacy === 'FRIENDS' ? privacy : undefined;
}

export function toApiPrivacy(privacy: PostPrivacy): string {
  return privacy === 'ONLY_ME' ? 'PRIVATE' : privacy;
}

export function mapApiPost(post: ApiPost): Post {
  return {
    author: post.author,
    commentsCount: post.commentsCount ?? 0,
    content: post.content ?? '',
    createdAt: post.createdAt,
    id: post.id,
    isLiked: post.isLiked ?? false,
    isReposted: post.isReposted ?? false,
    isSaved: post.isSaved ?? false,
    likesCount: post.likeCount ?? 0,
    media: (post.media ?? []).map((item) => ({
      durationMs: item.durationMs ?? undefined,
      height: item.height ?? undefined,
      id: item.id,
      order: item.order,
      thumbnailUrl: item.thumbnailUrl ?? undefined,
      type: mapMediaType(item.type),
      url: item.url,
      width: item.width ?? undefined,
    })),
    privacy: fromApiPrivacy(post.privacy),
    repostsCount: post.repostsCount ?? 0,
  };
}

/** Maps one feed row; returns null for a shape this app version does not know. */
export function mapApiFeedItem(item: ApiFeedItem): Post | null {
  if (item.type !== 'REPOST') {
    return item.author ? mapApiPost(item) : null;
  }

  const repost = { by: item.repostedBy, createdAt: item.createdAt, id: item.id };
  const original = item.originalPost;

  if (original?.available && original.id && original.author) {
    return { ...mapApiPost(original as ApiPost), repost };
  }

  // The original is gone: keep the row so the reposter's timeline has no hole.
  return {
    author: item.repostedBy,
    commentsCount: 0,
    content: '',
    createdAt: item.createdAt,
    id: `unavailable-${item.id}`,
    isLiked: false,
    isSaved: false,
    likesCount: 0,
    media: [],
    repost,
    unavailable: true,
  };
}

export function mapApiPostList(response: ApiPostListResponse): FeedResponse {
  return {
    data: response.data
      .map(mapApiFeedItem)
      .filter((post): post is Post => post !== null),
    meta: {
      hasMore: response.meta.page < response.meta.totalPages,
      page: response.meta.page,
      totalCount: response.meta.total,
    },
  };
}

/** List key: a repost row and its original share the post id, so key by row. */
export function postKey(post: Post): string {
  return post.repost?.id ?? post.id;
}
