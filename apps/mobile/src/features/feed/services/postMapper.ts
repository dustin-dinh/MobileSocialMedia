/**
 * Translates the backend's post payloads into the `Post` model the UI renders.
 *
 * The API and the UI disagree on a few names (`likeCount` vs `likesCount`,
 * lower-case media `type`, nullable `content`), and the Create Post response
 * omits the counters entirely, so every post read from the API goes through
 * `mapApiPost`.
 */
import type { FeedResponse, Post, PostAuthor, PostMediaType } from '../types';

export type ApiPost = {
  author: PostAuthor;
  commentsCount?: number;
  content: string | null;
  createdAt: string;
  id: string;
  isLiked?: boolean;
  likeCount?: number;
  media: Array<{ id: string; order: number; type: string; url: string }>;
};

export type ApiPageMeta = {
  limit: number;
  page: number;
  total: number;
  totalPages: number;
};

export type ApiPostListResponse = {
  data: ApiPost[];
  meta: ApiPageMeta;
};

/**
 * Bookmarks have no backend endpoint yet, so they live in memory for the
 * current app session only.
 */
const locallySavedPostIds = new Set<string>();

export function setPostSavedLocally(postId: string, isSaved: boolean): void {
  if (isSaved) {
    locallySavedPostIds.add(postId);
  } else {
    locallySavedPostIds.delete(postId);
  }
}

function mapMediaType(type: string): PostMediaType {
  return type.toUpperCase() === 'VIDEO' ? 'VIDEO' : 'IMAGE';
}

export function mapApiPost(post: ApiPost): Post {
  return {
    author: post.author,
    commentsCount: post.commentsCount ?? 0,
    content: post.content ?? '',
    createdAt: post.createdAt,
    id: post.id,
    isLiked: post.isLiked ?? false,
    isSaved: locallySavedPostIds.has(post.id),
    likesCount: post.likeCount ?? 0,
    media: post.media.map((item) => ({
      id: item.id,
      order: item.order,
      type: mapMediaType(item.type),
      url: item.url,
    })),
  };
}

export function mapApiPostList(response: ApiPostListResponse): FeedResponse {
  return {
    data: response.data.map(mapApiPost),
    meta: {
      hasMore: response.meta.page < response.meta.totalPages,
      page: response.meta.page,
      totalCount: response.meta.total,
    },
  };
}
