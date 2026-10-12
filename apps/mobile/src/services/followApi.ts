/**
 * Follow relationships against the live API.
 *
 * The backend's search, profile and notification responses carry no
 * `isFollowing` flag and no follower totals, so callers derive them here:
 * the set of ids the signed-in user follows is fetched once and kept in
 * memory, and follower/following totals come from the list endpoints' `meta`.
 */
import { showToast } from '../components/common/toast';
import { feedEvents } from '../features/feed/feedEvents';
import { httpClient } from './httpClient';

type UserListResponse = {
  data: Array<{ id: string }>;
  meta: { page: number; total: number; totalPages: number };
};

export type ListedUser = {
  avatarUrl: string | null;
  displayName: string | null;
  id: string;
  isFollowing: boolean;
  username: string;
};

const FOLLOWING_PAGE_SIZE = 50;
/** Upper bound on paging so one account cannot trigger unbounded requests. */
const FOLLOWING_MAX_PAGES = 10;

let currentUserId: string | null = null;
let followingIds: Set<string> | null = null;

async function getCurrentUserId(): Promise<string> {
  if (!currentUserId) {
    const response = await httpClient.requestJson<{ data: { id: string } }>({
      method: 'GET',
      path: 'users/me',
    });

    currentUserId = response.data.id;
  }

  return currentUserId;
}

async function getTotal(path: string): Promise<number> {
  const response = await httpClient.requestJson<UserListResponse>({
    method: 'GET',
    path: `${path}?page=1&limit=1`,
  });

  return response.meta.total;
}

export const followApi = {
  getCurrentUserId,

  /** Forget everything tied to the previous session (sign-in / sign-out). */
  clearCache(): void {
    currentUserId = null;
    followingIds = null;
  },

  /** Resolves an `@username` mention to a user id; null when nobody has that username. */
  async findUserIdByUsername(username: string): Promise<string | null> {
    const response = await httpClient.requestJson<{
      data: Array<{ id: string; username: string }>;
    }>({
      method: 'GET',
      path: `users/search?q=${encodeURIComponent(username)}&page=1&limit=20`,
    });
    const match = response.data.find(
      (user) => user.username.toLowerCase() === username.toLowerCase(),
    );

    return match?.id ?? null;
  },

  async follow(userId: string): Promise<void> {
    const response = await httpClient.requestJson<{ data: { requested?: boolean } }>({
      method: 'POST',
      path: `users/${userId}/follow`,
    });

    // Private account: only a request was sent. Buttons that switched to
    // "following" ahead of the answer switch back.
    if (response.data.requested) {
      feedEvents.emitFollowChanged(userId, false);
      showToast('Đã gửi yêu cầu theo dõi.');
      return;
    }

    followingIds?.add(userId);
    // Every screen showing this user updates its follow button.
    feedEvents.emitFollowChanged(userId, true);
  },

  /**
   * One page of a user-list endpoint (`users/:id/followers`, `posts/:id/likes`...).
   * Endpoints that do not report `isFollowing` get it from the cached follow set.
   */
  async listUsers(
    path: string,
    page: number,
    limit = 20,
  ): Promise<{ hasMore: boolean; users: ListedUser[] }> {
    const response = await httpClient.requestJson<{
      data: Array<Omit<ListedUser, 'isFollowing'> & { isFollowing?: boolean }>;
      meta: { page: number; totalPages: number };
    }>({
      method: 'GET',
      path: `${path}?page=${page}&limit=${limit}`,
    });
    const needsLookup = response.data.some((user) => user.isFollowing === undefined);
    const following = needsLookup ? await this.getMyFollowingIds() : null;

    return {
      hasMore: response.meta.page < response.meta.totalPages,
      users: response.data.map((user) => ({
        ...user,
        isFollowing: user.isFollowing ?? following?.has(user.id) ?? false,
      })),
    };
  },

  getFollowersCount(userId: string): Promise<number> {
    return getTotal(`users/${userId}/followers`);
  },

  getFollowingCount(userId: string): Promise<number> {
    return getTotal(`users/${userId}/following`);
  },

  /** Ids of every user the signed-in user follows. */
  async getMyFollowingIds(): Promise<ReadonlySet<string>> {
    if (followingIds) {
      return followingIds;
    }

    const userId = await getCurrentUserId();
    const ids = new Set<string>();

    for (let page = 1; page <= FOLLOWING_MAX_PAGES; page += 1) {
      const response = await httpClient.requestJson<UserListResponse>({
        method: 'GET',
        path: `users/${userId}/following?page=${page}&limit=${FOLLOWING_PAGE_SIZE}`,
      });

      response.data.forEach((user) => ids.add(user.id));

      if (page >= response.meta.totalPages) {
        break;
      }
    }

    followingIds = ids;

    return ids;
  },

  async unfollow(userId: string): Promise<void> {
    await httpClient.requestVoid({ method: 'DELETE', path: `users/${userId}/follow` });
    followingIds?.delete(userId);
    feedEvents.emitFollowChanged(userId, false);
  },
} as const;
