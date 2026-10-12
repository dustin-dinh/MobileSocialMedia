/**
 * Comment service — data-access layer for post comments.
 *
 * Talks to `GET /posts/:id/comments` and `POST /posts/:id/comments`. When
 * `USE_MOCK_API` is on, it serves an in-memory mock store instead.
 */
import { USE_MOCK_API } from '../../../config/runtime';
import { httpClient } from '../../../services/httpClient';
import type { CommentAuthor, CreateCommentPayload, PostComment } from '../types';

const USE_MOCK = USE_MOCK_API;

const COMMENTS_PAGE_SIZE = 50;

/** Comment as returned by the API. */
type ApiComment = {
  author?: CommentAuthor;
  content: string;
  createdAt: string;
  editedAt?: string | null;
  id: string;
  isLiked?: boolean;
  likesCount?: number;
  parentId?: string | null;
  repliesCount?: number;
  user?: CommentAuthor;
};

function mapApiComment(comment: ApiComment, postId: string, fallbackAuthor?: CommentAuthor): PostComment {
  const author = comment.author ?? comment.user ?? fallbackAuthor;

  if (!author) {
    throw new Error('Comment response is missing its author.');
  }

  return {
    author,
    content: comment.content,
    createdAt: comment.createdAt,
    editedAt: comment.editedAt ?? null,
    id: comment.id,
    isLiked: comment.isLiked ?? false,
    likesCount: comment.likesCount ?? 0,
    parentId: comment.parentId ?? null,
    postId,
    repliesCount: comment.repliesCount ?? 0,
  };
}

const MOCK_DELAY_MS = 350;

function delay(ms: number): Promise<void> {
  return new Promise((resolve) => setTimeout(resolve, ms));
}

// ---------------------------------------------------------------------------
// Mock Data Store
// ---------------------------------------------------------------------------

const INITIAL_MOCK_COMMENTS: PostComment[] = [
  {
    author: {
      avatarUrl: 'https://images.unsplash.com/photo-1599566150163-29194dcabd9c?w=100&h=100&fit=crop&crop=face',
      displayName: 'Alex Rivera',
      id: 'user-002',
      username: 'alexrivera',
    },
    content: 'Bộ ảnh chụp góc đẹp quá bạn ơi! Tone màu nhìn nghệ thực sự 👏📸',
    createdAt: new Date(Date.now() - 15 * 60 * 1000).toISOString(), // 15m ago
    id: 'cmt-001',
    isLiked: true,
    likesCount: 5,
    postId: 'post-1',
  },
  {
    author: {
      avatarUrl: 'https://images.unsplash.com/photo-1494790108377-be9c29b29330?w=100&h=100&fit=crop&crop=face',
      displayName: 'Minh Trần',
      id: 'user-003',
      username: 'minhtran',
    },
    content: 'App chạy mượt thật sự! UI/UX clean ghê, hóng bản update tiếp theo của team 🚀',
    createdAt: new Date(Date.now() - 45 * 60 * 1000).toISOString(), // 45m ago
    id: 'cmt-002',
    isLiked: false,
    likesCount: 2,
    postId: 'post-1',
  },
  {
    author: {
      avatarUrl: null,
      displayName: null,
      id: 'user-004',
      username: 'devlife_vn',
    },
    content: 'Awesome work! Cố lên nhé đồng chí 🔥',
    createdAt: new Date(Date.now() - 2 * 60 * 60 * 1000).toISOString(), // 2h ago
    id: 'cmt-003',
    isLiked: false,
    likesCount: 0,
    postId: 'post-1',
  },
  {
    author: {
      avatarUrl: 'https://images.unsplash.com/photo-1438761681033-6461ffad8d80?w=100&h=100&fit=crop&crop=face',
      displayName: 'Linh Phạm',
      id: 'user-006',
      username: 'linhpham',
    },
    content: 'Đẹp tuyệt vời! Cho mình xin preset màu được không ạ? 😍',
    createdAt: new Date(Date.now() - 5 * 60 * 60 * 1000).toISOString(), // 5h ago
    id: 'cmt-004',
    isLiked: true,
    likesCount: 7,
    postId: 'post-2',
  },
  {
    author: {
      avatarUrl: 'https://images.unsplash.com/photo-1507003211169-0a1dd7228f2d?w=100&h=100&fit=crop&crop=face',
      displayName: 'Thanh Nguyễn',
      id: 'user-005',
      username: 'thanhnguyen',
    },
    content: 'Hôm nào làm chuyến đi cà phê chill chill nữa nhé team! ☕',
    createdAt: new Date(Date.now() - 24 * 60 * 60 * 1000).toISOString(), // 1d ago
    id: 'cmt-005',
    isLiked: false,
    likesCount: 3,
    postId: 'post-2',
  },
];

// In-memory mock comments storage
const mockCommentsStore: Map<string, PostComment[]> = new Map();

function getMockCommentsForPost(postId: string): PostComment[] {
  if (!mockCommentsStore.has(postId)) {
    // Filter matching comments or populate default template
    const matched = INITIAL_MOCK_COMMENTS.filter((c) => c.postId === postId);
    if (matched.length > 0) {
      mockCommentsStore.set(postId, [...matched]);
    } else {
      // Create friendly initial mock comments for any other post
      const generated = INITIAL_MOCK_COMMENTS.slice(0, 3).map((c, index) => ({
        ...c,
        id: `cmt-${postId}-${index}`,
        postId,
      }));
      mockCommentsStore.set(postId, generated);
    }
  }

  return mockCommentsStore.get(postId)!;
}

// ---------------------------------------------------------------------------
// Service Implementation
// ---------------------------------------------------------------------------

/** Mock helper: every comment of a post, replies included. */
function findMockComment(commentId: string): PostComment | undefined {
  for (const list of mockCommentsStore.values()) {
    const found = list.find((comment) => comment.id === commentId);

    if (found) {
      return found;
    }
  }

  return undefined;
}

export const commentService = {
  /** Page size of `getComments`; a full page means there may be more. */
  PAGE_SIZE: COMMENTS_PAGE_SIZE,

  /**
   * Get one page of top-level comments for a post, newest first.
   */
  async getComments(postId: string, page = 1): Promise<PostComment[]> {
    if (USE_MOCK) {
      await delay(MOCK_DELAY_MS);

      return page === 1
        ? getMockCommentsForPost(postId)
            .filter((comment) => !comment.parentId)
            .map((comment) => ({ ...comment }))
        : [];
    }

    const response = await httpClient.requestJson<{ data: ApiComment[] }>({
      method: 'GET',
      path: `posts/${postId}/comments?page=${page}&limit=${COMMENTS_PAGE_SIZE}`,
    });

    return response.data.map((comment) => mapApiComment(comment, postId));
  },

  /** Replies under a top-level comment, oldest first. */
  async getReplies(commentId: string, postId: string): Promise<PostComment[]> {
    if (USE_MOCK) {
      await delay(MOCK_DELAY_MS);

      return getMockCommentsForPost(postId)
        .filter((comment) => comment.parentId === commentId)
        .reverse();
    }

    const response = await httpClient.requestJson<{ data: ApiComment[] }>({
      method: 'GET',
      path: `comments/${commentId}/replies?page=1&limit=${COMMENTS_PAGE_SIZE}`,
    });

    return response.data.map((comment) => mapApiComment(comment, postId));
  },

  /**
   * Post a new comment to a post, or a reply when `parentId` is given.
   */
  async addComment(
    postId: string,
    content: string,
    author: CommentAuthor,
    parentId?: string | null,
  ): Promise<PostComment> {
    if (USE_MOCK) {
      await delay(400);

      const newComment: PostComment = {
        author,
        content: content.trim(),
        createdAt: new Date().toISOString(),
        id: `cmt-${Date.now()}`,
        isLiked: false,
        likesCount: 0,
        parentId: parentId ?? null,
        postId,
        repliesCount: 0,
      };

      const existing = getMockCommentsForPost(postId);
      mockCommentsStore.set(postId, [newComment, ...existing]);

      return newComment;
    }

    const response = await httpClient.requestJson<{ data: ApiComment }, CreateCommentPayload>({
      body: { content: content.trim() },
      method: 'POST',
      path: parentId ? `comments/${parentId}/replies` : `posts/${postId}/comments`,
    });

    return mapApiComment(response.data, postId, author);
  },

  /** Edit the text of one of the viewer's own comments. */
  async updateComment(comment: PostComment, content: string): Promise<PostComment> {
    if (USE_MOCK) {
      await delay(300);

      const stored = findMockComment(comment.id);
      const updated = { ...comment, content: content.trim(), editedAt: new Date().toISOString() };

      if (stored) {
        Object.assign(stored, updated);
      }

      return updated;
    }

    const response = await httpClient.requestJson<{ data: ApiComment }, { content: string }>({
      body: { content: content.trim() },
      method: 'PATCH',
      path: `comments/${comment.id}`,
    });

    return mapApiComment(response.data, comment.postId, comment.author);
  },

  /**
   * Delete a comment (and its replies). Resolves to the post's new comment
   * total, which the client cannot compute because replies go with it.
   */
  async deleteComment(comment: PostComment): Promise<number> {
    if (USE_MOCK) {
      await delay(300);

      const remaining = getMockCommentsForPost(comment.postId).filter(
        (item) => item.id !== comment.id && item.parentId !== comment.id,
      );

      mockCommentsStore.set(comment.postId, remaining);

      return remaining.length;
    }

    const response = await httpClient.requestJson<{ data: { commentsCount: number } }>({
      method: 'DELETE',
      path: `comments/${comment.id}`,
    });

    return response.data.commentsCount;
  },

  /**
   * Toggle like on a comment.
   */
  async toggleLikeComment(
    commentId: string,
    currentlyLiked: boolean,
  ): Promise<boolean> {
    if (USE_MOCK) {
      await delay(200);
      return !currentlyLiked;
    }

    await httpClient.requestVoid({
      method: currentlyLiked ? 'DELETE' : 'POST',
      path: `comments/${commentId}/like`,
    });

    return !currentlyLiked;
  },
} as const;
