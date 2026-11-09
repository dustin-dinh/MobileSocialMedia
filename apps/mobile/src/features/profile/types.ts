/**
 * Data models for the Profile feature.
 */
import type { Post, PostAuthor } from '../feed/types';

/** Full user profile as returned by the profile endpoint. */
export type UserProfile = {
  /** This user accepts anonymous messages from people who follow them. */
  acceptsAnonymousMessages?: boolean;
  avatarUrl: string | null;
  bio: string | null;
  coverUrl?: string | null;
  displayName: string | null;
  /** The viewer asked to follow this private account and is waiting for an answer. */
  followRequested?: boolean;
  followersCount: number;
  followingCount: number;
  /** True when the profile's owner follows the viewer. */
  followsYou?: boolean;
  id: string;
  /** True when the viewer has blocked this user. */
  isBlocked?: boolean;
  /** True when viewing another user's profile and you follow them. */
  isFollowing: boolean;
  /** The viewer muted this user: their posts and stories leave the viewer's feed, Reels and story tray. */
  isMuted?: boolean;
  /** Only followers see this account's posts; following needs approval. */
  isPrivate?: boolean;
  postsCount: number;
  username: string;
};

/** Payload for updating the current user's profile. */
export type UpdateProfilePayload = {
  /** A newly picked picture to upload; `null` removes the current one. */
  avatar?: { fileName?: string | null; mimeType?: string | null; uri: string } | null;
  avatarUrl?: string;
  bio?: string;
  /** A newly picked cover picture to upload; `null` removes the current one. */
  cover?: { fileName?: string | null; mimeType?: string | null; uri: string } | null;
  displayName?: string;
  username?: string;
};

/** One entry of "people you may know". */
export type SuggestedUser = PostAuthor & {
  isFollowing: boolean;
  /** How many people the viewer follows also follow this user. */
  mutualCount: number;
  /** Up to two of their names, for "Followed by A and B". */
  mutualPreview: string[];
  reason: 'FOLLOWS_YOU' | 'MUTUAL' | 'POPULAR';
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
