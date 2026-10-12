/**
 * Reel service — data-access layer for the Reels feed.
 *
 * The Reel backend (feed, uploads, interaction log) is owned by another
 * developer and is not built yet. Until it is, this service serves sample
 * videos; set `EXPO_PUBLIC_REELS_API=true` once the endpoints below exist.
 *
 * Contract expected from the backend (see docs/reel/REEL_FINAL_SPEC_AND_PLAN.md §5):
 *   GET  /reels/feed?limit=&exclude=   -> { data: ApiPost[], meta: { requestId } }
 *   POST /interactions { events: ReelEvent[] }
 *   POST /posts/:id/not-interested
 */
import { USE_MOCK_API } from '../../../config/runtime';
import { ApiError } from '../../../services/apiError';
import { httpClient } from '../../../services/httpClient';
import type { AuthUser } from '../../auth/services/authService';
import { mapApiPost, type ApiPost } from '../../feed/services/postMapper';
import type { Post, PostPrivacy } from '../../feed/types';
import type { SelectedVideo } from '../hooks/useVideoPicker';
import { SAMPLE_REELS } from '../sampleReels';
import type { ReelEvent } from '../types';

/** True once the real Reel endpoints are available. */
export const REELS_API_READY = process.env.EXPO_PUBLIC_REELS_API === 'true';

/**
 * Posting a video needs the direct-upload endpoints (`POST /media/upload-url`,
 * `POST /posts/media`), which do not exist yet, so the "Video" button is only
 * offered in mock mode. Implement the live branch of `uploadReel` against the
 * final contract, then turn this on for live mode too.
 */
export const REEL_UPLOAD_AVAILABLE = USE_MOCK_API;

const USE_SAMPLES = USE_MOCK_API || !REELS_API_READY;
const DEFAULT_BATCH_SIZE = 5;

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
      throw new ApiError({
        kind: 'server',
        message: 'Máy chủ chưa hỗ trợ đăng video.',
        status: 501,
      });
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
