/**
 * Profile service — data-access layer for user profiles and user posts.
 *
 * Talks to `GET /users/:id` and `GET /users/:id/posts`. When `USE_MOCK_API`
 * is on, it builds a mock profile from the signed-in user instead.
 */
import { USE_MOCK_API } from '../../../config/runtime';
import { ApiError } from '../../../services/apiError';
import { followApi } from '../../../services/followApi';
import { httpClient } from '../../../services/httpClient';
import type { AuthUser } from '../../auth/services/authService';
import { MOCK_POSTS } from '../../feed/mockData';
import { mapApiPostList, type ApiPostListResponse } from '../../feed/services/postMapper';
import type { Post } from '../../feed/types';
import type { UpdateProfilePayload, UserPostsResponse, UserProfile } from '../types';

const USE_MOCK = USE_MOCK_API;

type ApiUserProfile = Pick<
  UserProfile,
  'avatarUrl' | 'bio' | 'displayName' | 'id' | 'postsCount' | 'username'
>;
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

    // The profile endpoint has no follower/following totals, so they are read
    // from the follow list endpoints.
    const [response, followersCount, followingCount] = await Promise.all([
      httpClient.requestJson<{ data: ApiUserProfile }>({
        method: 'GET',
        path: `users/${user.id}`,
      }),
      followApi.getFollowersCount(user.id),
      followApi.getFollowingCount(user.id),
    ]);

    return {
      ...response.data,
      followersCount,
      followingCount,
      isFollowing: false,
    };
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

    const response = await httpClient.requestJson<ApiPostListResponse>({
      method: 'GET',
      path: `users/${user.id}/posts?page=${page}&limit=${limit}`,
    });

    return mapApiPostList(response);
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

    // The backend has no profile-update endpoint yet. Fail visibly rather
    // than pretend the change was saved.
    throw new ApiError({
      kind: 'server',
      message: 'Máy chủ chưa hỗ trợ cập nhật hồ sơ.',
      status: 501,
    });
  },
} as const;
