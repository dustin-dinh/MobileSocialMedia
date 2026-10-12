/**
 * Feed service — data-access layer for the post feed.
 *
 * Talks to `GET /posts/feed` and `POST|DELETE /posts/:id/like`. When
 * `USE_MOCK_API` is on, it serves local mock data after a simulated delay.
 */
import { USE_MOCK_API } from '../../../config/runtime';
import { ApiError } from '../../../services/apiError';
import { httpClient } from '../../../services/httpClient';
import { MOCK_POSTS } from '../mockData';
import type { FeedResponse, Post } from '../types';
import {
  mapApiPost,
  mapApiPostList,
  type ApiPost,
  type ApiPostListResponse,
} from './postMapper';

const USE_MOCK_FEED = USE_MOCK_API;

/** Simulated network latency for the mock path (ms). */
const MOCK_DELAY_MS = 600;

const DEFAULT_PAGE_SIZE = 10;

/**
 * Simulate paginated feed from mock data.
 */
function getMockFeed(page: number, limit: number): FeedResponse {
  const start = (page - 1) * limit;
  const slice = MOCK_POSTS.slice(start, start + limit);

  return {
    data: slice,
    meta: {
      hasMore: start + limit < MOCK_POSTS.length,
      page,
      totalCount: MOCK_POSTS.length,
    },
  };
}

function delay(ms: number): Promise<void> {
  return new Promise((resolve) => setTimeout(resolve, ms));
}

export const feedService = {
  /**
   * Fetch a page of the authenticated user's feed.
   *
   * @param page  1-based page index.
   * @param limit Number of posts per page.
   */
  async getFeed(page = 1, limit = DEFAULT_PAGE_SIZE): Promise<FeedResponse> {
    if (USE_MOCK_FEED) {
      await delay(MOCK_DELAY_MS);

      return getMockFeed(page, limit);
    }

    const response = await httpClient.requestJson<ApiPostListResponse>({
      method: 'GET',
      path: `posts/feed?page=${page}&limit=${limit}`,
    });

    return mapApiPostList(response);
  },

  /**
   * Toggle the like status of a post. Returns the updated post.
   */
  async toggleLike(post: Post): Promise<Post> {
    if (USE_MOCK_FEED) {
      await delay(200);

      return {
        ...post,
        isLiked: !post.isLiked,
        likesCount: post.isLiked ? post.likesCount - 1 : post.likesCount + 1,
      };
    }

    const method = post.isLiked ? 'DELETE' : 'POST';

    await httpClient.requestVoid({
      method,
      path: `posts/${post.id}/like`,
    });

    return {
      ...post,
      isLiked: !post.isLiked,
      likesCount: post.isLiked ? post.likesCount - 1 : post.likesCount + 1,
    };
  },

  /**
   * Toggle the bookmark/save status of a post.
   */
  async toggleSave(post: Post): Promise<Post> {
    if (USE_MOCK_FEED) {
      await delay(200);

      return {
        ...post,
        isSaved: !post.isSaved,
      };
    }

    await httpClient.requestVoid({
      method: post.isSaved ? 'DELETE' : 'POST',
      path: `posts/${post.id}/save`,
    });

    return {
      ...post,
      isSaved: !post.isSaved,
    };
  },

  /**
   * Repost a post to the viewer's followers, or undo it.
   */
  async toggleRepost(post: Post): Promise<Post> {
    const next: Post = {
      ...post,
      isReposted: !post.isReposted,
      repostsCount: Math.max(0, (post.repostsCount ?? 0) + (post.isReposted ? -1 : 1)),
    };

    if (USE_MOCK_FEED) {
      await delay(200);

      return next;
    }

    await httpClient.requestVoid({
      method: post.isReposted ? 'DELETE' : 'POST',
      path: `posts/${post.id}/repost`,
    });

    return next;
  },

  /** Hide a post from the viewer's feed. */
  async hidePost(postId: string): Promise<void> {
    if (USE_MOCK_FEED) {
      await delay(200);

      return;
    }

    await httpClient.requestVoid({ method: 'POST', path: `posts/${postId}/hide` });
  },

  /** Fetch one post; rejects with a 404 `ApiError` when it is gone or not visible. */
  async getPost(postId: string): Promise<Post> {
    if (USE_MOCK_FEED) {
      await delay(200);

      const post = MOCK_POSTS.find((item) => item.id === postId);

      if (!post) {
        throw new ApiError({ kind: 'server', message: 'Post not found', status: 404 });
      }

      return post;
    }

    // This endpoint returns the post itself, without a `data` envelope.
    const response = await httpClient.requestJson<ApiPost>({
      method: 'GET',
      path: `posts/${postId}`,
    });

    return mapApiPost(response);
  },

  /** Posts the viewer has bookmarked, newest first. */
  async getSavedPosts(page = 1, limit = DEFAULT_PAGE_SIZE): Promise<FeedResponse> {
    if (USE_MOCK_FEED) {
      await delay(MOCK_DELAY_MS);

      const saved = MOCK_POSTS.filter((post) => post.isSaved);

      return { data: saved, meta: { hasMore: false, page, totalCount: saved.length } };
    }

    const response = await httpClient.requestJson<ApiPostListResponse>({
      method: 'GET',
      path: `posts/saved?page=${page}&limit=${limit}`,
    });

    return mapApiPostList(response);
  },

  /** Search visible posts by text; a `#tag` query finds hashtags. */
  async searchPosts(query: string, page = 1, limit = DEFAULT_PAGE_SIZE): Promise<FeedResponse> {
    const trimmed = query.trim();

    if (!trimmed) {
      return { data: [], meta: { hasMore: false, page, totalCount: 0 } };
    }

    if (USE_MOCK_FEED) {
      await delay(300);

      const found = MOCK_POSTS.filter((post) =>
        post.content.toLowerCase().includes(trimmed.toLowerCase()),
      );

      return { data: found, meta: { hasMore: false, page, totalCount: found.length } };
    }

    const response = await httpClient.requestJson<ApiPostListResponse>({
      method: 'GET',
      path: `posts/search?q=${encodeURIComponent(trimmed)}&page=${page}&limit=${limit}`,
    });

    return mapApiPostList(response);
  },
} as const;
