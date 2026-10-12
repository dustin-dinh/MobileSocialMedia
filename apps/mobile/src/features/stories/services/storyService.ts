/**
 * Stories (24-hour posts) — data-access layer. Mock mode keeps stories in
 * memory; live mode uses `/stories` and the direct-upload endpoints
 * (see docs/api-contract.md).
 */
import { USE_MOCK_API } from '../../../config/runtime';
import { httpClient } from '../../../services/httpClient';
import type { AuthUser } from '../../auth/services/authService';
import type { PostAuthor } from '../../feed/types';
import { createThumbnail, uploadToStorage } from '../../reel/services/reelService';

export type Story = {
  createdAt: string;
  /** Videos only. */
  durationMs?: number | null;
  expiresAt: string;
  id: string;
  isSeen: boolean;
  thumbnailUrl?: string | null;
  type: 'IMAGE' | 'VIDEO';
  url: string;
  /** Only on the viewer's own stories. */
  viewsCount?: number;
};

export type StoryGroup = {
  author: PostAuthor;
  hasUnseen: boolean;
  /** Oldest first, the order they are played in. */
  stories: Story[];
};

export type StoryMedia = {
  durationMs?: number;
  isVideo: boolean;
  mimeType: string;
  sizeBytes?: number | null;
  uri: string;
};

type ApiStory = Omit<Story, 'type'> & { type: string };

const mapStory = (story: ApiStory): Story => ({
  ...story,
  type: story.type.toUpperCase() === 'VIDEO' ? 'VIDEO' : 'IMAGE',
});

let mockGroups: StoryGroup[] = [];

export const storyService = {
  /** Active stories of the viewer and the people they follow; the viewer's own group first. */
  async getFeed(): Promise<StoryGroup[]> {
    if (USE_MOCK_API) {
      return mockGroups;
    }

    const response = await httpClient.requestJson<{
      data: Array<{ author: PostAuthor; hasUnseen: boolean; stories: ApiStory[] }>;
    }>({ method: 'GET', path: 'stories/feed' });

    return response.data.map((group) => ({ ...group, stories: group.stories.map(mapStory) }));
  },

  /** Upload a picture or a short video and publish it for 24 hours. */
  async create(media: StoryMedia, author: AuthUser): Promise<void> {
    if (USE_MOCK_API) {
      const now = Date.now();
      const story: Story = {
        createdAt: new Date(now).toISOString(),
        durationMs: media.durationMs,
        expiresAt: new Date(now + 86_400_000).toISOString(),
        id: `mock-story-${now}`,
        isSeen: true,
        type: media.isVideo ? 'VIDEO' : 'IMAGE',
        url: media.uri,
        viewsCount: 0,
      };
      const own = mockGroups.find((group) => group.author.id === author.id);

      if (own) {
        own.stories.push(story);
      } else {
        mockGroups = [
          {
            author: {
              avatarUrl: author.avatarUrl,
              displayName: author.displayName,
              id: author.id,
              username: author.username,
            },
            hasUnseen: false,
            stories: [story],
          },
          ...mockGroups,
        ];
      }

      return;
    }

    const file = { mimeType: media.mimeType, sizeBytes: media.sizeBytes ?? 1, uri: media.uri };
    let body: Record<string, unknown>;

    if (media.isVideo) {
      const thumbnailUri = await createThumbnail(media.uri);
      const thumbnailKey = thumbnailUri
        ? await uploadToStorage('thumbnail', {
            mimeType: 'image/jpeg',
            sizeBytes: 1,
            uri: thumbnailUri,
          }).catch(() => null)
        : null;

      body = {
        durationMs: Math.max(1, Math.round(media.durationMs ?? 0)),
        storageKey: await uploadToStorage('video', file),
        ...(thumbnailKey ? { thumbnailKey } : {}),
        type: 'VIDEO',
      };
    } else {
      body = { storageKey: await uploadToStorage('image', file), type: 'IMAGE' };
    }

    await httpClient.requestVoid({ body, method: 'POST', path: 'stories' });
  },

  async markViewed(storyId: string): Promise<void> {
    if (USE_MOCK_API) {
      return;
    }

    await httpClient.requestVoid({ method: 'POST', path: `stories/${storyId}/view` });
  },

  /** Who watched one of the viewer's own stories. */
  async getViewers(storyId: string): Promise<PostAuthor[]> {
    if (USE_MOCK_API) {
      return [];
    }

    const response = await httpClient.requestJson<{ data: PostAuthor[] }>({
      method: 'GET',
      path: `stories/${storyId}/viewers`,
    });

    return response.data;
  },

  async remove(storyId: string): Promise<void> {
    if (USE_MOCK_API) {
      mockGroups = mockGroups
        .map((group) => ({
          ...group,
          stories: group.stories.filter((story) => story.id !== storyId),
        }))
        .filter((group) => group.stories.length > 0);

      return;
    }

    await httpClient.requestVoid({ method: 'DELETE', path: `stories/${storyId}` });
  },
} as const;
