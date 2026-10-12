/**
 * Data models for the Comment feature.
 */

export type CommentAuthor = {
  avatarUrl: string | null;
  displayName: string | null;
  id: string;
  username: string;
};

export type PostComment = {
  author: CommentAuthor;
  content: string;
  createdAt: string;
  /** Set once the author has edited the comment. */
  editedAt?: string | null;
  id: string;
  isLiked: boolean;
  likesCount: number;
  /** Id of the top-level comment this one replies to (threads are two levels deep). */
  parentId?: string | null;
  postId: string;
  /** Number of replies under a top-level comment. */
  repliesCount?: number;
};

export type CommentsResponse = {
  data: PostComment[];
};

export type CreateCommentPayload = {
  content: string;
  parentId?: string | null;
};
