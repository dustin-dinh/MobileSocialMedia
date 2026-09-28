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
  id: string;
  isLiked: boolean;
  likesCount: number;
  parentId?: string | null;
  postId: string;
};

export type CommentsResponse = {
  data: PostComment[];
};

export type CreateCommentPayload = {
  content: string;
  parentId?: string | null;
};
