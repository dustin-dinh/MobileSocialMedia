/**
 * Search service — data-access layer for user search & follow/unfollow.
 *
 * Talks to `GET /users/search?q=...` and `POST|DELETE /users/:id/follow`.
 * When `USE_MOCK_API` is on, it serves local mock users instead.
 */
import { USE_MOCK_API } from '../../../config/runtime';
import { followApi } from '../../../services/followApi';
import { httpClient } from '../../../services/httpClient';
import type { SearchedUser } from '../types';

const USE_MOCK = USE_MOCK_API;

const SEARCH_PAGE_SIZE = 20;

type ApiSearchedUser = Pick<SearchedUser, 'avatarUrl' | 'displayName' | 'id' | 'username'>;
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

    const trimmedQuery = query.trim();

    // The API rejects an empty `q`, and it has no "suggested users" endpoint.
    if (!trimmedQuery) {
      return [];
    }

    const [response, followingIds, currentUserId] = await Promise.all([
      httpClient.requestJson<{ data: ApiSearchedUser[] }>({
        method: 'GET',
        path: `users/search?q=${encodeURIComponent(trimmedQuery)}&page=1&limit=${SEARCH_PAGE_SIZE}`,
      }),
      followApi.getMyFollowingIds(),
      followApi.getCurrentUserId(),
    ]);

    // The search response carries neither bio, follower totals nor follow
    // state; the follow state is derived from the signed-in user's own list.
    return response.data
      .filter((user) => user.id !== currentUserId)
      .map((user) => ({
        ...user,
        bio: null,
        followersCount: null,
        isFollowing: followingIds.has(user.id),
      }));
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

    if (currentlyFollowing) {
      await followApi.unfollow(userId);
    } else {
      await followApi.follow(userId);
    }

    return !currentlyFollowing;
  },
} as const;
