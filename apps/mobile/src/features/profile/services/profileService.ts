/**
 * Profile service — data-access layer for user profiles and user posts.
 *
 * Uses mock data while the backend endpoints are being built by Dev B.
 * Flip `USE_MOCK` to false once `GET /users/:id/profile` and
 * `GET /users/:id/posts` are available.
 */
import type { AuthUser } from '../../auth/services/authService';
import { MOCK_POSTS } from '../../feed/mockData';
import type { Post } from '../../feed/types';
import type { UpdateProfilePayload, UserPostsResponse, UserProfile } from '../types';

const USE_MOCK = true;
const MOCK_DELAY_MS = 500;

function delay(ms: number): Promise<void> {
  return new Promise((resolve) => setTimeout(resolve, ms));
}

/**
 * Build a mock profile from the current AuthUser, enriching it with
 * synthetic social stats.
 */
function buildMockProfile(user: AuthUser): UserProfile {
  return {
    avatarUrl: user.avatarUrl,
    bio: user.bio ?? 'Mobile developer • Coffee lover ☕ • Building cool stuff 🚀',
    displayName: user.displayName,
    followersCount: 128,
    followingCount: 64,
    id: user.id,
    isFollowing: false,
    postsCount: MOCK_POSTS.length,
    username: user.username,
  };
}

/**
 * Generate mock posts attributed to the current user so the profile
 * post list has content to render.
 */
function buildMockUserPosts(user: AuthUser): Post[] {
  return MOCK_POSTS.slice(0, 3).map((post, index) => ({
    ...post,
    id: `profile-post-${index}`,
    author: {
      avatarUrl: user.avatarUrl,
      displayName: user.displayName,
      id: user.id,
      username: user.username,
    },
  }));
}

export const profileService = {
  /**
   * Get the full profile for the currently authenticated user.
   */
  async getCurrentUserProfile(user: AuthUser): Promise<UserProfile> {
    if (USE_MOCK) {
      await delay(MOCK_DELAY_MS);

      return buildMockProfile(user);
    }

    // Future: httpClient.requestJson<{ data: UserProfile }>({ method: 'GET', path: 'users/me/profile' });
    await delay(MOCK_DELAY_MS);

    return buildMockProfile(user);
  },

  /**
   * Get posts authored by a specific user.
   */
  async getUserPosts(user: AuthUser, page = 1, limit = 10): Promise<UserPostsResponse> {
    if (USE_MOCK) {
      await delay(MOCK_DELAY_MS);

      const allPosts = buildMockUserPosts(user);
      const start = (page - 1) * limit;
      const slice = allPosts.slice(start, start + limit);

      return {
        data: slice,
        meta: {
          hasMore: start + limit < allPosts.length,
          page,
          totalCount: allPosts.length,
        },
      };
    }

    // Future: httpClient.requestJson<UserPostsResponse>({ method: 'GET', path: `users/${userId}/posts?page=${page}&limit=${limit}` });
    await delay(MOCK_DELAY_MS);

    const allPosts = buildMockUserPosts(user);

    return {
      data: allPosts,
      meta: { hasMore: false, page: 1, totalCount: allPosts.length },
    };
  },

  /**
   * Update the current user's profile fields.
   */
  async updateProfile(
    user: AuthUser,
    payload: UpdateProfilePayload,
  ): Promise<UserProfile> {
    if (USE_MOCK) {
      await delay(800);

      const updated: AuthUser = {
        ...user,
        displayName: payload.displayName ?? user.displayName,
        bio: payload.bio ?? user.bio,
        avatarUrl: payload.avatarUrl ?? user.avatarUrl,
      };

      return buildMockProfile(updated);
    }

    // Future: httpClient.requestJson<{ data: UserProfile }>({ method: 'PATCH', path: 'users/me', body: payload });
    await delay(800);

    const updated: AuthUser = {
      ...user,
      displayName: payload.displayName ?? user.displayName,
      bio: payload.bio ?? user.bio,
      avatarUrl: payload.avatarUrl ?? user.avatarUrl,
    };

    return buildMockProfile(updated);
  },
} as const;
