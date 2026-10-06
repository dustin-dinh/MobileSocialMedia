/**
 * Post service — data-access layer for creating posts.
 *
 * Sends `POST /posts` as multipart/form-data (text in `content`, files in the
 * repeated `images` field). When `USE_MOCK_API` is on, it simulates network
 * delay and returns a fully-formed Post so the UI flow stays testable offline.
 */
import { File } from 'expo-file-system';

import { USE_MOCK_API } from '../../../config/runtime';
import { httpClient } from '../../../services/httpClient';
import type { AuthUser } from '../../auth/services/authService';
import { mapApiPost, type ApiPost } from '../../feed/services/postMapper';
import type { Post, PostMedia, PostPrivacy } from '../../feed/types';

const USE_MOCK_CREATE = USE_MOCK_API;

/** Simulated network latency for the mock path (ms). */
const MOCK_DELAY_MS = 1_000;

export type CreatePostPayload = {
  /** Post text content. */
  content: string;
  /** Local image URIs selected by the user. */
  mediaUris: string[];
  /** File name / MIME type per URI when the picker reported them. */
  mediaFiles?: Array<{ fileName?: string | null; mimeType?: string | null; uri: string }>;
  /** Post privacy level. */
  privacy?: PostPrivacy;
};

export type UpdatePostPayload = {
  content?: string;
  privacy?: PostPrivacy;
};

const MIME_BY_EXTENSION: Record<string, string> = {
  // `jpg` first: it is the extension used when only the MIME type is known.
  jpg: 'image/jpeg',
  jpeg: 'image/jpeg',
  png: 'image/png',
  webp: 'image/webp',
};

export type UploadPart = {
  /** Reads the file's bytes from disk when the request body is built. */
  bytes: () => Promise<Uint8Array>;
  name: string;
  type: string;
};

/**
 * Build the multipart part for a local image.
 *
 * Expo's `fetch` does not accept React Native's legacy `{ uri, name, type }`
 * file descriptor ("Unsupported FormDataPart implementation"). It takes a
 * Blob, or an object exposing `bytes()`, and writes the part's filename and
 * content type from `name` and `type`. The backend only accepts JPEG, PNG and
 * WebP, and names the stored file after the filename's extension.
 */
export function toUploadPart(
  uri: string,
  index: number,
  hint?: { fileName?: string | null; mimeType?: string | null },
): UploadPart {
  const extension = uri.split('?')[0].split('.').pop()?.toLowerCase() ?? '';
  const type = hint?.mimeType ?? MIME_BY_EXTENSION[extension] ?? 'image/jpeg';
  const fallbackExtension = Object.keys(MIME_BY_EXTENSION).find(
    (key) => MIME_BY_EXTENSION[key] === type,
  );

  return {
    bytes: () => new File(uri).bytes(),
    name: hint?.fileName ?? `image_${index}.${fallbackExtension ?? 'jpg'}`,
    type,
  };
}

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
    privacy: payload.privacy ?? 'PUBLIC',
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

    const form = new FormData();
    const content = payload.content.trim();

    if (content) {
      form.append('content', content);
    }

    if (payload.privacy) {
      form.append('privacy', payload.privacy);
    }

    payload.mediaUris.forEach((uri, index) => {
      const hint = payload.mediaFiles?.find((file) => file.uri === uri);

      form.append('images', toUploadPart(uri, index, hint) as unknown as Blob);
    });

    const response = await httpClient.requestForm<{ data: ApiPost }>({
      form,
      method: 'POST',
      path: 'posts',
    });

    return mapApiPost(response.data);
  },

  /**
   * Update an existing post's content and/or privacy.
   */
  async updatePost(postId: string, payload: UpdatePostPayload, currentPost?: Post): Promise<Post> {
    if (USE_MOCK_CREATE) {
      await delay(MOCK_DELAY_MS);

      if (currentPost) {
        return {
          ...currentPost,
          content: payload.content !== undefined ? payload.content : currentPost.content,
          privacy: payload.privacy !== undefined ? payload.privacy : currentPost.privacy,
        };
      }

      return {
        author: {
          avatarUrl: null,
          displayName: 'You',
          id: 'current-user',
          username: 'you',
        },
        commentsCount: 0,
        content: payload.content ?? '',
        createdAt: new Date().toISOString(),
        id: postId,
        isLiked: false,
        isSaved: false,
        likesCount: 0,
        media: [],
        privacy: payload.privacy ?? 'PUBLIC',
      };
    }

    const response = await httpClient.requestJson<{ data: ApiPost }, UpdatePostPayload>({
      body: payload,
      method: 'PATCH',
      path: `posts/${postId}`,
    });

    return mapApiPost(response.data);
  },

  /**
   * Delete an existing post.
   */
  async deletePost(postId: string): Promise<void> {
    if (USE_MOCK_CREATE) {
      await delay(MOCK_DELAY_MS);
      return;
    }

    await httpClient.requestVoid({
      method: 'DELETE',
      path: `posts/${postId}`,
    });
  },

  /**
   * Update the privacy level of an existing post.
   */
  async updatePrivacy(postId: string, privacy: PostPrivacy, currentPost?: Post): Promise<Post> {
    return this.updatePost(postId, { privacy }, currentPost);
  },
} as const;

