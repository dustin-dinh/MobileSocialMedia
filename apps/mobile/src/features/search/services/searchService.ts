/**
 * Search service — data-access layer for user search & follow/unfollow.
 *
 * Uses mock data while Dev B builds `GET /users/search?q=...` and
 * `POST /users/:id/follow` + `DELETE /users/:id/follow`.
 * Flip `USE_MOCK` to false once endpoints are available.
 */
import { ApiError } from '../../../services/apiError';
import { httpClient } from '../../../services/httpClient';
import type { SearchedUser, SearchUsersResponse } from '../types';

const USE_MOCK = true;
const MOCK_DELAY_MS = 400;

function delay(ms: number): Promise<void> {
  return new Promise((resolve) => setTimeout(resolve, ms));
}

// ---------------------------------------------------------------------------
// Mock data
// ---------------------------------------------------------------------------

const MOCK_USERS: SearchedUser[] = [
  {
    avatarUrl: 'https://images.unsplash.com/photo-1599566150163-29194dcabd9c?w=120&h=120&fit=crop&crop=face',
    bio: 'Full-stack developer | Open source enthusiast 🌟',
    displayName: 'Alex Rivera',
    followersCount: 1_240,
    id: 'user-002',
    isFollowing: false,
    username: 'alexrivera',
  },
  {
    avatarUrl: 'https://images.unsplash.com/photo-1494790108377-be9c29b29330?w=120&h=120&fit=crop&crop=face',
    bio: 'UI/UX Designer at Creative Studio • Đà Nẵng 🇻🇳',
    displayName: 'Minh Trần',
    followersCount: 3_520,
    id: 'user-003',
    isFollowing: true,
    username: 'minhtran',
  },
  {
    avatarUrl: null,
    bio: '#100DaysOfCode | React Native | TypeScript',
    displayName: null,
    followersCount: 890,
    id: 'user-004',
    isFollowing: false,
    username: 'devlife_vn',
  },
  {
    avatarUrl: 'https://images.unsplash.com/photo-1507003211169-0a1dd7228f2d?w=120&h=120&fit=crop&crop=face',
    bio: 'Photography • Travel • Coffee addict ☕',
    displayName: 'Thanh Nguyễn',
    followersCount: 5_100,
    id: 'user-005',
    isFollowing: true,
    username: 'thanhnguyen',
  },
  {
    avatarUrl: 'https://images.unsplash.com/photo-1438761681033-6461ffad8d80?w=120&h=120&fit=crop&crop=face',
    bio: 'Product Manager • Startup life 🚀',
    displayName: 'Linh Phạm',
    followersCount: 720,
    id: 'user-006',
    isFollowing: false,
    username: 'linhpham',
  },
  {
    avatarUrl: 'https://images.unsplash.com/photo-1500648767791-00dcc994a43e?w=120&h=120&fit=crop&crop=face',
    bio: 'Backend engineer | Golang | Kubernetes',
    displayName: 'Đức Hoàng',
    followersCount: 2_340,
    id: 'user-007',
    isFollowing: false,
    username: 'duchoang',
  },
];

function filterMockUsers(query: string): SearchedUser[] {
  const normalised = query.toLowerCase().trim();

  if (!normalised) {
    return MOCK_USERS;
  }

  return MOCK_USERS.filter(
    (u) =>
      u.username.toLowerCase().includes(normalised) ||
      (u.displayName?.toLowerCase().includes(normalised) ?? false),
  );
}

// ---------------------------------------------------------------------------
// Service
// ---------------------------------------------------------------------------

export const searchService = {
  /**
   * Search users by username or display name.
   *
   * When `query` is empty / blank, returns suggested users.
   */
  async searchUsers(query: string): Promise<SearchedUser[]> {
    if (USE_MOCK) {
      await delay(MOCK_DELAY_MS);

      return filterMockUsers(query);
    }

    try {
      const response = await httpClient.requestJson<SearchUsersResponse>({
        method: 'GET',
        path: `users/search?q=${encodeURIComponent(query.trim())}`,
      });

      return response.data;
    } catch (error) {
      // Fallback to mock on 404 / network error during development.
      if (error instanceof ApiError && (error.status === 404 || error.kind === 'network')) {
        console.warn('⚠️ Search endpoint unavailable – falling back to mock data.');

        return filterMockUsers(query);
      }

      throw error;
    }
  },

  /**
   * Toggle follow/unfollow for a user.
   *
   * @returns The updated `isFollowing` state.
   */
  async toggleFollowUser(
    userId: string,
    currentlyFollowing: boolean,
  ): Promise<boolean> {
    if (USE_MOCK) {
      await delay(300);

      return !currentlyFollowing;
    }

    const method = currentlyFollowing ? 'DELETE' : 'POST';

    await httpClient.requestVoid({
      method,
      path: `users/${userId}/follow`,
    });

    return !currentlyFollowing;
  },
} as const;
