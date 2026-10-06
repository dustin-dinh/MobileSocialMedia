/**
 * Data models for the Search feature.
 */

/** A user returned by the search endpoint. */
export type SearchedUser = {
  avatarUrl: string | null;
  bio: string | null;
  displayName: string | null;
  /** Null when the API does not report a follower total for this user. */
  followersCount: number | null;
  id: string;
  isFollowing: boolean;
  username: string;
};

/** Response shape from `GET /users/search`. */
export type SearchUsersResponse = {
  data: SearchedUser[];
};
