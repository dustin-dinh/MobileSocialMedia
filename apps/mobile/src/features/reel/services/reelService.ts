/**
 * Reel service — data-access layer for the Reels feed and for posting videos.
 * Mock mode serves sample videos; live mode uses (see docs/api-contract.md):
 *   GET  /reels/feed?limit=&exclude=   -> { data: ApiPost[], meta: { requestId } }
 *   POST /interactions { events: ReelEvent[] }
 *   POST /posts/:id/not-interested
 *   POST /media/upload-url, then PUT to storage, then POST /posts/media
 */
import { USE_MOCK_API } from '../../../config/runtime';
import { httpClient } from '../../../services/httpClient';
import { uploadFile } from '../../../services/uploadFile';
import type { AuthUser } from '../../auth/services/authService';
import { mapApiPost, toApiPrivacy, type ApiPost } from '../../feed/services/postMapper';
import type { Post, PostPrivacy } from '../../feed/types';
import type { SelectedVideo } from '../hooks/useVideoPicker';
import { SAMPLE_REELS } from '../sampleReels';
import type { ReelEvent } from '../types';

const USE_SAMPLES = USE_MOCK_API;
const DEFAULT_BATCH_SIZE = 5;

type UploadTarget = {
  headers: Record<string, string>;
  storageKey: string;
  uploadUrl: string;
};

/** Asks the API where to put a file, then sends the file straight to storage. */
export async function uploadToStorage(
  kind: 'image' | 'thumbnail' | 'video',
  file: { mimeType: string; sizeBytes: number; uri: string },
  onProgress?: (fraction: number) => void,
): Promise<string> {
  const { data } = await httpClient.requestJson<
    { data: UploadTarget },
    { kind: string; mimeType: string; sizeBytes: number }
  >({
    body: { kind, mimeType: file.mimeType, sizeBytes: file.sizeBytes },
    method: 'POST',
    path: 'media/upload-url',
  });

  await uploadFile({ headers: data.headers, onProgress, uri: file.uri, url: data.uploadUrl });

  return data.storageKey;
}

/**
 * Poster frame for the feed. A missing poster must never block posting, so
 * every failure (including a build without the native module) yields null.
 */
export async function createThumbnail(videoUri: string): Promise<string | null> {
  try {
    // Loaded on demand: the module is native and absent from the Jest environment.
    const VideoThumbnails = require('expo-video-thumbnails') as typeof import('expo-video-thumbnails');
    const { uri } = await VideoThumbnails.getThumbnailAsync(videoUri, { quality: 0.7, time: 500 });

    return uri;
  } catch {
    return null;
  }
}

export type ReelBatch = {
  items: Post[];
  /** Id of this recommendation response; echoed back with every view event. */
  requestId: string;
};

function delay(ms: number): Promise<void> {
  return new Promise((resolve) => setTimeout(resolve, ms));
}

export const reelService = {
  /**
   * Fetch the next reels. Ranked feeds have no stable pages, so the client
   * sends the ids it already showed and the server leaves them out.
   */
  async getFeed(excludeIds: string[], limit = DEFAULT_BATCH_SIZE): Promise<ReelBatch> {
    if (USE_SAMPLES) {
      await delay(400);

      const seen = new Set(excludeIds);

      return {
        items: SAMPLE_REELS.filter((reel) => !seen.has(reel.id)).slice(0, limit),
        requestId: `sample-${Date.now()}`,
      };
    }

    const exclude = excludeIds.slice(-50).join(',');
    const response = await httpClient.requestJson<{
      data: ApiPost[];
      meta?: { requestId?: string };
    }>({
      method: 'GET',
      path: `reels/feed?limit=${limit}&exclude=${encodeURIComponent(exclude)}`,
    });

    return {
      items: response.data.map(mapApiPost).filter((post) => post.media[0]?.type === 'VIDEO'),
      requestId: response.meta?.requestId ?? '',
    };
  },

  /**
   * Post a video as a reel, reporting upload progress from 0 to 1.
   */
  async uploadReel(
    payload: { content: string; privacy: PostPrivacy; video: SelectedVideo },
    author: AuthUser,
    onProgress: (fraction: number) => void,
  ): Promise<Post> {
    if (!USE_MOCK_API) {
      const { video } = payload;
      const thumbnailUri = await createThumbnail(video.uri);
      // The poster is small: give it the first 5% of the bar, the video the rest.
      const thumbnailKey = thumbnailUri
        ? await uploadToStorage('thumbnail', {
            mimeType: 'image/jpeg',
            // The real size is unknown here; the server checks the stored file.
            sizeBytes: 1,
            uri: thumbnailUri,
          }).catch(() => null)
        : null;

      onProgress(0.05);

      const storageKey = await uploadToStorage(
        'video',
        { mimeType: video.mimeType, sizeBytes: video.sizeBytes ?? 1, uri: video.uri },
        (fraction) => onProgress(0.05 + fraction * 0.9),
      );

      const response = await httpClient.requestJson<{ data: ApiPost }, unknown>({
        body: {
          content: payload.content,
          media: [
            {
              durationMs: Math.max(1, Math.round(video.durationMs)),
              height: Math.round(video.height),
              storageKey,
              ...(thumbnailKey ? { thumbnailKey } : {}),
              type: 'VIDEO',
              width: Math.round(video.width),
            },
          ],
          privacy: toApiPrivacy(payload.privacy),
        },
        method: 'POST',
        path: 'posts/media',
      });

      onProgress(1);

      return mapApiPost(response.data);
    }

    for (let step = 1; step <= 10; step += 1) {
      await delay(120);
      onProgress(step / 10);
    }

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
      id: `reel-${Date.now()}`,
      isLiked: false,
      isSaved: false,
      likesCount: 0,
      media: [
        {
          durationMs: payload.video.durationMs,
          height: payload.video.height,
          id: `reel-media-${Date.now()}`,
          order: 0,
          type: 'VIDEO',
          url: payload.video.uri,
          width: payload.video.width,
        },
      ],
      privacy: payload.privacy,
    };
  },

  /** Send a batch of view/interaction events. Rejects so the caller can retry later. */
  async sendInteractions(events: ReelEvent[]): Promise<void> {
    if (USE_SAMPLES || events.length === 0) {
      return;
    }

    await httpClient.requestVoid<{ events: ReelEvent[] }>({
      body: { events },
      method: 'POST',
      path: 'interactions',
    });
  },

  /** Tell the recommender to show less of this kind of content. */
  async notInterested(postId: string): Promise<void> {
    if (USE_SAMPLES) {
      return;
    }

    await httpClient.requestVoid({ method: 'POST', path: `posts/${postId}/not-interested` });
  },
} as const;
