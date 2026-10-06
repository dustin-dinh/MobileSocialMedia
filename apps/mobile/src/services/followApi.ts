/**
 * Follow relationships against the live API.
 *
 * The backend's search, profile and notification responses carry no
 * `isFollowing` flag and no follower totals, so callers derive them here:
 * the set of ids the signed-in user follows is fetched once and kept in
 * memory, and follower/following totals come from the list endpoints' `meta`.
 */
import { httpClient } from './httpClient';

type UserListResponse = {
  data: Array<{ id: string }>;
  meta: { page: number; total: number; totalPages: number };
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

  async follow(userId: string): Promise<void> {
    await httpClient.requestVoid({ method: 'POST', path: `users/${userId}/follow` });
    followingIds?.add(userId);
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
  },
} as const;
