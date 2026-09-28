/**
 * Post service — data-access layer for creating posts.
 *
 * While Dev B completes the upload pipeline (Supabase/S3), this service uses
 * a mock path that simulates network delay and returns a fully-formed Post
 * object so the UI flow can be tested end-to-end.
 */
import type { AuthUser } from '../../auth/services/authService';
import type { Post, PostMedia } from '../../feed/types';

/** Flip to `false` once `POST /posts` is available on the backend. */
const USE_MOCK_CREATE = true;

/** Simulated network latency for the mock path (ms). */
const MOCK_DELAY_MS = 1_000;

export type CreatePostPayload = {
  /** Post text content. */
  content: string;
  /** Local image URIs selected by the user. */
  mediaUris: string[];
};

function generateId(): string {
  return `post-${Date.now()}-${Math.random().toString(36).slice(2, 8)}`;
}

function delay(ms: number): Promise<void> {
  return new Promise((resolve) => setTimeout(resolve, ms));
}

function buildMockPost(payload: CreatePostPayload, author: AuthUser): Post {
  const media: PostMedia[] = payload.mediaUris.map((uri, index) => ({
    id: `media-${Date.now()}-${index}`,
    order: index,
    type: 'IMAGE' as const,
    url: uri,
  }));

  return {
    author: {
      avatarUrl: author.avatarUrl,
      displayName: author.displayName,
      id: author.id,
      username: author.username,
    },
    commentsCount: 0,
    content: payload.content,
    createdAt: new Date().toISOString(),
    id: generateId(),
    isLiked: false,
    isSaved: false,
    likesCount: 0,
    media,
  };
}

export const postService = {
  /**
   * Create a new post.
   *
   * @param payload  Text content + selected image URIs.
   * @param author   The current authenticated user (for mock path).
   * @returns The newly created Post.
   */
  async createPost(payload: CreatePostPayload, author: AuthUser): Promise<Post> {
    if (USE_MOCK_CREATE) {
      await delay(MOCK_DELAY_MS);

      return buildMockPost(payload, author);
    }

    // ── Real API path (ready for Dev B) ────────────────────────────────
    // When the backend supports file uploads, this will likely become a
    // multipart/form-data request. For now the structure is placeholder-ready:
    //
    //   const formData = new FormData();
    //   formData.append('content', payload.content);
    //   payload.mediaUris.forEach((uri, i) => {
    //     formData.append('media', { uri, name: `image_${i}.jpg`, type: 'image/jpeg' });
    //   });
    //
    //   return httpClient.requestJson<{ data: Post }>({ method: 'POST', path: 'posts', body: formData });

    // Temporary: use mock even in non-mock mode until the endpoint ships.
    await delay(MOCK_DELAY_MS);

    return buildMockPost(payload, author);
  },
} as const;
