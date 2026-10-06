/**
 * Feed service — data-access layer for the post feed.
 *
 * Talks to `GET /posts/feed` and `POST|DELETE /posts/:id/like`. When
 * `USE_MOCK_API` is on, it serves local mock data after a simulated delay.
 */
import { USE_MOCK_API } from '../../../config/runtime';
import { httpClient } from '../../../services/httpClient';
import { MOCK_POSTS } from '../mockData';
import type { FeedResponse, Post } from '../types';
import { mapApiPostList, setPostSavedLocally, type ApiPostListResponse } from './postMapper';

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

    // The backend has no bookmark endpoint yet, so the flag is kept in
    // memory for this app session and re-applied when posts are reloaded.
    setPostSavedLocally(post.id, !post.isSaved);

    return {
      ...post,
      isSaved: !post.isSaved,
    };
  },
} as const;
