/**
 * Comment service — data-access layer for post comments.
 *
 * Provides mock data for local development and falls back smoothly
 * to real backend endpoints (`GET /posts/:id/comments`, `POST /posts/:id/comments`,
 * `POST/DELETE /comments/:id/like`).
 */
import { ApiError } from '../../../services/apiError';
import { httpClient } from '../../../services/httpClient';
import type { CommentAuthor, CommentsResponse, CreateCommentPayload, PostComment } from '../types';

const USE_MOCK = true;
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

export const commentService = {
  /**
   * Get all comments for a post.
   */
  async getComments(postId: string): Promise<PostComment[]> {
    if (USE_MOCK) {
      await delay(MOCK_DELAY_MS);
      return [...getMockCommentsForPost(postId)];
    }

    try {
      const response = await httpClient.requestJson<CommentsResponse>({
        method: 'GET',
        path: `posts/${postId}/comments`,
      });

      return response.data;
    } catch (error) {
      // Fallback on 404 or network error
      if (error instanceof ApiError && (error.status === 404 || error.kind === 'network')) {
        console.warn('⚠️ Comment endpoint not ready – using mock comments.');
        return [...getMockCommentsForPost(postId)];
      }

      throw error;
    }
  },

  /**
   * Post a new comment to a post.
   */
  async addComment(
    postId: string,
    content: string,
    author: CommentAuthor,
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
        postId,
      };

      const existing = getMockCommentsForPost(postId);
      mockCommentsStore.set(postId, [newComment, ...existing]);

      return newComment;
    }

    try {
      const response = await httpClient.requestJson<{ data: PostComment }, CreateCommentPayload>({
        body: { content: content.trim() },
        method: 'POST',
        path: `posts/${postId}/comments`,
      });

      return response.data;
    } catch (error) {
      if (error instanceof ApiError && (error.status === 404 || error.kind === 'network')) {
        console.warn('⚠️ POST comment endpoint not ready – fallback to mock success.');

        const fallbackComment: PostComment = {
          author,
          content: content.trim(),
          createdAt: new Date().toISOString(),
          id: `cmt-${Date.now()}`,
          isLiked: false,
          likesCount: 0,
          postId,
        };

        const existing = getMockCommentsForPost(postId);
        mockCommentsStore.set(postId, [fallbackComment, ...existing]);

        return fallbackComment;
      }

      throw error;
    }
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

    const method = currentlyLiked ? 'DELETE' : 'POST';

    try {
      await httpClient.requestVoid({
        method,
        path: `comments/${commentId}/like`,
      });

      return !currentlyLiked;
    } catch (error) {
      if (error instanceof ApiError && (error.status === 404 || error.kind === 'network')) {
        return !currentlyLiked;
      }

      throw error;
    }
  },
} as const;
