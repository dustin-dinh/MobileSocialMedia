/**
 * Profile service — data-access layer for user profiles, their posts and
 * reposts, profile editing, blocking and follow suggestions.
 *
 * When `USE_MOCK_API` is on, it builds mock data from the signed-in user instead.
 */
import { USE_MOCK_API } from '../../../config/runtime';
import { httpClient } from '../../../services/httpClient';
import type { AuthUser } from '../../auth/services/authService';
import { MOCK_POSTS } from '../../feed/mockData';
import { mapApiPostList, type ApiPostListResponse } from '../../feed/services/postMapper';
import type { Post, PostAuthor } from '../../feed/types';
import { toUploadPart } from '../../post/services/postService';
import type {
  SuggestedUser,
  UpdateProfilePayload,
  UserPostsResponse,
  UserProfile,
} from '../types';

const USE_MOCK = USE_MOCK_API;

type ApiUserProfile = Omit<UserProfile, 'isFollowing'> & { isFollowing?: boolean };
/** The pieces of a user the mock builders need. */
type ProfileOwner = Pick<AuthUser, 'avatarUrl' | 'displayName' | 'id' | 'username'> & {
  bio?: string | null;
};

const MOCK_DELAY_MS = 500;
// Mock only: who the viewer muted during this session.
const mockMuted = new Map<string, PostAuthor>();

function delay(ms: number): Promise<void> {
  return new Promise((resolve) => setTimeout(resolve, ms));
}

/**
 * Build a mock profile from a user, enriching it with synthetic social stats.
 */
function buildMockProfile(user: ProfileOwner): UserProfile {
  return {
    avatarUrl: user.avatarUrl,
    bio: user.bio ?? 'Lập trình viên di động ở Đà Nẵng. Sáng cà phê, chiều chạy bộ ven sông Hàn.',
    displayName: user.displayName,
    followersCount: 128,
    followingCount: 64,
    followsYou: false,
    id: user.id,
    isBlocked: false,
    isFollowing: false,
    isMuted: mockMuted.has(user.id),
    postsCount: MOCK_POSTS.length,
    username: user.username,
  };
}

/**
 * Generate mock posts attributed to a user so the profile post list has
 * content to render.
 */
function buildMockUserPosts(user: ProfileOwner): Post[] {
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

/** Mock helper: the author record of a user id that appears in the mock feed. */
function findMockAuthor(userId: string): ProfileOwner {
  return (
    MOCK_POSTS.find((post) => post.author.id === userId)?.author ?? {
      avatarUrl: null,
      displayName: 'Người dùng',
      id: userId,
      username: 'user',
    }
  );
}

function paginate(posts: Post[], page: number, limit: number): UserPostsResponse {
  const start = (page - 1) * limit;

  return {
    data: posts.slice(start, start + limit),
    meta: { hasMore: start + limit < posts.length, page, totalCount: posts.length },
  };
}

export const profileService = {
  /**
   * Get any user's profile, including how the viewer relates to them.
   * Rejects with a 404 `ApiError` when the user does not exist or blocked the viewer.
   */
  async getProfile(userId: string): Promise<UserProfile> {
    if (USE_MOCK) {
      await delay(MOCK_DELAY_MS);

      return buildMockProfile(findMockAuthor(userId));
    }

    const response = await httpClient.requestJson<{ data: ApiUserProfile }>({
      method: 'GET',
      path: `users/${userId}`,
    });

    return { ...response.data, isFollowing: response.data.isFollowing ?? false };
  },

  /**
   * Get the full profile for the currently authenticated user.
   */
  async getCurrentUserProfile(user: AuthUser): Promise<UserProfile> {
    if (USE_MOCK) {
      await delay(MOCK_DELAY_MS);

      return buildMockProfile(user);
    }

    return this.getProfile(user.id);
  },

  /**
   * Get posts authored by a specific user (only those the viewer may see).
   */
  async getUserPosts(user: ProfileOwner, page = 1, limit = 10): Promise<UserPostsResponse> {
    if (USE_MOCK) {
      await delay(MOCK_DELAY_MS);

      return paginate(buildMockUserPosts(user), page, limit);
    }

    const response = await httpClient.requestJson<ApiPostListResponse>({
      method: 'GET',
      path: `users/${user.id}/posts?page=${page}&limit=${limit}`,
    });

    return mapApiPostList(response);
  },

  /** Posts a user has reposted, newest repost first. */
  async getUserReposts(userId: string, page = 1, limit = 10): Promise<UserPostsResponse> {
    if (USE_MOCK) {
      await delay(MOCK_DELAY_MS);

      return paginate([], page, limit);
    }

    const response = await httpClient.requestJson<ApiPostListResponse>({
      method: 'GET',
      path: `users/${userId}/reposts?page=${page}&limit=${limit}`,
    });

    return mapApiPostList(response);
  },

  /**
   * Update the current user's profile fields and, when `avatar` is given,
   * the profile picture (`null` removes it).
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
        avatarUrl:
          payload.avatar === undefined
            ? (payload.avatarUrl ?? user.avatarUrl)
            : (payload.avatar?.uri ?? null),
      };

      return buildMockProfile(updated);
    }

    // The picture goes first: if the upload fails, no text change is saved
    // and the form can simply be submitted again.
    if (payload.avatar) {
      const form = new FormData();

      form.append('avatar', toUploadPart(payload.avatar.uri, 0, payload.avatar) as unknown as Blob);
      await httpClient.requestForm<{ data: AuthUser }>({
        form,
        method: 'POST',
        path: 'users/me/avatar',
      });
    } else if (payload.avatar === null) {
      await httpClient.requestVoid({ method: 'DELETE', path: 'users/me/avatar' });
    }

    if (payload.cover) {
      const form = new FormData();

      form.append('cover', toUploadPart(payload.cover.uri, 0, payload.cover) as unknown as Blob);
      await httpClient.requestForm<{ data: AuthUser }>({
        form,
        method: 'POST',
        path: 'users/me/cover',
      });
    } else if (payload.cover === null) {
      await httpClient.requestVoid({ method: 'DELETE', path: 'users/me/cover' });
    }

    const fields = {
      bio: payload.bio,
      displayName: payload.displayName,
      username: payload.username,
    };

    if (Object.values(fields).some((value) => value !== undefined)) {
      await httpClient.requestJson<{ data: AuthUser }, typeof fields>({
        body: fields,
        method: 'PATCH',
        path: 'users/me',
      });
    }

    return this.getProfile(user.id);
  },

  /** Make the signed-in account private (followers need approval) or public again. */
  async setPrivate(isPrivate: boolean): Promise<void> {
    if (USE_MOCK) {
      await delay(MOCK_DELAY_MS);
      return;
    }

    await httpClient.requestVoid<{ isPrivate: boolean }>({
      body: { isPrivate },
      method: 'PATCH',
      path: 'users/me',
    });
  },

  /** People waiting for the signed-in user to approve their follow. */
  async getFollowRequests(): Promise<PostAuthor[]> {
    if (USE_MOCK) {
      await delay(MOCK_DELAY_MS);
      return [];
    }

    const response = await httpClient.requestJson<{ data: PostAuthor[] }>({
      method: 'GET',
      path: 'users/me/follow-requests',
    });

    return response.data;
  },

  async answerFollowRequest(requesterId: string, accept: boolean): Promise<void> {
    if (USE_MOCK) {
      await delay(MOCK_DELAY_MS);
      return;
    }

    await httpClient.requestVoid(
      accept
        ? { method: 'POST', path: `users/${requesterId}/follow-request/accept` }
        : { method: 'DELETE', path: `users/${requesterId}/follow-request` },
    );
  },

  /** Block or unblock a user. Blocking also removes the follows in both directions. */
  async setBlocked(userId: string, blocked: boolean): Promise<void> {
    if (USE_MOCK) {
      await delay(300);

      return;
    }

    await httpClient.requestVoid({
      method: blocked ? 'POST' : 'DELETE',
      path: `users/${userId}/block`,
    });
  },

  async getBlockedUsers(): Promise<PostAuthor[]> {
    if (USE_MOCK) {
      await delay(MOCK_DELAY_MS);

      return [];
    }

    const response = await httpClient.requestJson<{ data: PostAuthor[] }>({
      method: 'GET',
      path: 'users/me/blocked',
    });

    return response.data;
  },

  /** Mute or unmute a user. The muted user is not told. */
  async setMuted(userId: string, muted: boolean): Promise<void> {
    if (USE_MOCK) {
      await delay(300);
      const { avatarUrl, displayName, id, username } = findMockAuthor(userId);

      if (muted) {
        mockMuted.set(userId, { avatarUrl, displayName, id, username });
      } else {
        mockMuted.delete(userId);
      }

      return;
    }

    await httpClient.requestVoid({
      method: muted ? 'POST' : 'DELETE',
      path: `users/${userId}/mute`,
    });
  },

  async getMutedUsers(): Promise<PostAuthor[]> {
    if (USE_MOCK) {
      await delay(MOCK_DELAY_MS);

      return [...mockMuted.values()].reverse();
    }

    const response = await httpClient.requestJson<{ data: PostAuthor[] }>({
      method: 'GET',
      path: 'users/me/muted',
    });

    return response.data;
  },

  /** People the viewer may know: followers not followed back, then friends of friends. */
  async getSuggestions(limit = 20): Promise<SuggestedUser[]> {
    if (USE_MOCK) {
      await delay(MOCK_DELAY_MS);

      const authors = new Map(MOCK_POSTS.map((post) => [post.author.id, post.author]));

      return [...authors.values()].slice(0, limit).map((author, index) => ({
        ...author,
        isFollowing: false,
        mutualCount: index,
        mutualPreview: index > 0 ? ['Sarah Chen'] : [],
        reason: index > 0 ? 'MUTUAL' : 'POPULAR',
      }));
    }

    const response = await httpClient.requestJson<{ data: SuggestedUser[] }>({
      method: 'GET',
      path: `users/suggestions?limit=${limit}`,
    });

    return response.data;
  },
} as const;
