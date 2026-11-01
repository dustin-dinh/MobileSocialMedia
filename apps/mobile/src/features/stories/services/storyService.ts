/**
 * Stories (24-hour posts) — data-access layer. Mock mode keeps stories in
 * memory; live mode uses `/stories` and the direct-upload endpoints
 * (see docs/api-contract.md).
 *
 * The owner never learns who viewed a story, only who reacted; reactions and
 * replies can be anonymous when the owner allowed it on that story.
 */
import { USE_MOCK_API } from '../../../config/runtime';
import { httpClient } from '../../../services/httpClient';
import type { AuthUser } from '../../auth/services/authService';
import type { ReactionType } from '../../feed/reactions';
import type { PostAuthor } from '../../feed/types';
import { createThumbnail, uploadToStorage } from '../../reel/services/reelService';

export type StoryReactionMark = {
  isAnonymous: boolean;
  type: ReactionType;
};

export type Story = {
  /** The owner allows anonymous reactions and replies on this story. */
  allowAnonymous?: boolean;
  createdAt: string;
  /** Videos only. */
  durationMs?: number | null;
  expiresAt: string;
  id: string;
  isSeen: boolean;
  thumbnailUrl?: string | null;
  type: 'IMAGE' | 'VIDEO';
  url: string;
  /** Someone else's story: your reaction to it. */
  myReaction?: StoryReactionMark | null;
  /** Your own story: how many people reacted. */
  reactionsCount?: number;
};

/** One reaction as the story's owner sees it; `user` is null when it was anonymous. */
export type StoryReaction = {
  createdAt: string;
  isAnonymous: boolean;
  type: ReactionType;
  user: PostAuthor | null;
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

  /**
   * Upload a picture or a short video and publish it for 24 hours.
   * `allowAnonymous`: viewers may react and reply without showing who they are.
   */
  async create(media: StoryMedia, author: AuthUser, allowAnonymous = false): Promise<void> {
    if (USE_MOCK_API) {
      const now = Date.now();
      const story: Story = {
        allowAnonymous,
        createdAt: new Date(now).toISOString(),
        durationMs: media.durationMs,
        expiresAt: new Date(now + 86_400_000).toISOString(),
        id: `mock-story-${now}`,
        isSeen: true,
        type: media.isVideo ? 'VIDEO' : 'IMAGE',
        reactionsCount: 0,
        url: media.uri,
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

    await httpClient.requestVoid({ body: { ...body, allowAnonymous }, method: 'POST', path: 'stories' });
  },

  async markViewed(storyId: string): Promise<void> {
    if (USE_MOCK_API) {
      return;
    }

    await httpClient.requestVoid({ method: 'POST', path: `stories/${storyId}/view` });
  },

  /** Who reacted to one of your own stories, newest first. */
  async getReactions(storyId: string): Promise<StoryReaction[]> {
    if (USE_MOCK_API) {
      return [];
    }

    const response = await httpClient.requestJson<{ data: StoryReaction[] }>({
      method: 'GET',
      path: `stories/${storyId}/reactions`,
    });

    return response.data;
  },

  /** React to someone's story; reacting again replaces the reaction. */
  async react(storyId: string, type: ReactionType, anonymous: boolean): Promise<void> {
    if (USE_MOCK_API) {
      return;
    }

    await httpClient.requestVoid<{ anonymous: boolean; type: ReactionType }>({
      body: { anonymous, type },
      method: 'POST',
      path: `stories/${storyId}/reactions`,
    });
  },

  async removeReaction(storyId: string): Promise<void> {
    if (USE_MOCK_API) {
      return;
    }

    await httpClient.requestVoid({ method: 'DELETE', path: `stories/${storyId}/reactions` });
  },

  /**
   * Reply to a story. It lands in your conversation with its owner, or in an
   * anonymous conversation when `anonymous` (and the owner allowed it).
   */
  async reply(storyId: string, content: string, anonymous: boolean): Promise<{ conversationId: string }> {
    if (USE_MOCK_API) {
      return { conversationId: 'mock-conversation-1' };
    }

    const response = await httpClient.requestJson<
      { data: { conversationId: string } },
      { anonymous: boolean; content: string }
    >({
      body: { anonymous, content },
      method: 'POST',
      path: `stories/${storyId}/reply`,
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
