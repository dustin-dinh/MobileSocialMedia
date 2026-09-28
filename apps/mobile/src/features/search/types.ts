/**
 * Data models for the Search feature.
 */

/** A user returned by the search endpoint. */
export type SearchedUser = {
  avatarUrl: string | null;
  bio: string | null;
  displayName: string | null;
  followersCount: number;
  id: string;
  isFollowing: boolean;
  username: string;
};

/** Response shape from `GET /users/search`. */
export type SearchUsersResponse = {
  data: SearchedUser[];
};
