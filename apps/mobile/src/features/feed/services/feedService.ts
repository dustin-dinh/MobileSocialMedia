/**
 * Feed service — data-access layer for the post feed.
 *
 * During development (before Dev B ships the `/posts/feed` endpoint), calls
 * automatically fall back to local mock data after a simulated network delay.
 * Once the endpoint is live, remove the `USE_MOCK_FEED` flag.
 */
import { ApiError } from '../../../services/apiError';
import { httpClient } from '../../../services/httpClient';
import { MOCK_POSTS } from '../mockData';
import type { FeedResponse, Post } from '../types';

/** Flip this to `false` once the real endpoint is available. */
const USE_MOCK_FEED = true;

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

    try {
      return await httpClient.requestJson<FeedResponse>({
        method: 'GET',
        path: `posts/feed?page=${page}&limit=${limit}`,
      });
    } catch (error) {
      // Graceful fallback: if the endpoint doesn't exist yet (404) or the
      // server is down, return mock data so the UI remains testable.
      if (error instanceof ApiError && (error.status === 404 || error.kind === 'network')) {
        console.warn('⚠️ Feed endpoint unavailable – falling back to mock data.');

        return getMockFeed(page, limit);
      }

      throw error;
    }
  },

  /**
   * Toggle the like status of a post. Returns the updated post.
   *
   * Stub implementation: flips the value locally until the endpoint exists.
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

    const method = post.isSaved ? 'DELETE' : 'POST';

    await httpClient.requestVoid({
      method,
      path: `posts/${post.id}/save`,
    });

    return {
      ...post,
      isSaved: !post.isSaved,
    };
  },
} as const;
