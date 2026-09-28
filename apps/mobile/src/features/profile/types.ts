/**
 * Data models for the Profile feature.
 */
import type { Post } from '../feed/types';

/** Full user profile as returned by the profile endpoint. */
export type UserProfile = {
  avatarUrl: string | null;
  bio: string | null;
  displayName: string | null;
  followersCount: number;
  followingCount: number;
  id: string;
  /** True when viewing another user's profile and you follow them. */
  isFollowing: boolean;
  postsCount: number;
  username: string;
};

/** Payload for updating the current user's profile. */
export type UpdateProfilePayload = {
  avatarUrl?: string;
  bio?: string;
  displayName?: string;
};

/** Response shape for a user's posts list. */
export type UserPostsResponse = {
  data: Post[];
  meta: {
    hasMore: boolean;
    page: number;
    totalCount: number;
  };
};
