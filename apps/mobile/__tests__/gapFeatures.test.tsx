import React from 'react';
import { fireEvent, render } from '@testing-library/react-native';

import { RichText } from '../src/components/common/RichText';
import {
  mapApiFeedItem,
  mapApiPostList,
  postKey,
  toApiPrivacy,
  type ApiFeedItem,
} from '../src/features/feed/services/postMapper';
import { suggestionReason } from '../src/features/profile/suggestionReason';
import { formatReelCount } from '../src/features/reel/components/ReelOverlay';
import { summarizeView } from '../src/features/reel/hooks/useReelViewTracker';
import { validateVideo } from '../src/features/reel/hooks/useVideoPicker';

const author = { avatarUrl: null, displayName: 'An', id: 'u1', username: 'an' };
const apiPost = {
  author,
  commentsCount: 2,
  content: 'hello',
  createdAt: '2026-10-12T00:00:00.000Z',
  id: 'p1',
  isLiked: true,
  isReposted: true,
  isSaved: true,
  likeCount: 3,
  media: [{ id: 'm1', order: 0, type: 'image', url: 'https://x/y.jpg' }],
  privacy: 'PRIVATE',
  repostsCount: 4,
};

describe('feed mapper', () => {
  it('maps a plain post, including the server-side flags and privacy name', () => {
    expect(mapApiFeedItem({ ...apiPost, type: 'POST' })).toMatchObject({
      id: 'p1',
      isLiked: true,
      isReposted: true,
      isSaved: true,
      likesCount: 3,
      privacy: 'ONLY_ME',
      repostsCount: 4,
    });
    expect(toApiPrivacy('ONLY_ME')).toBe('PRIVATE');
  });

  it('maps a repost onto its original post and keeps who reposted it', () => {
    const repost: ApiFeedItem = {
      createdAt: '2026-10-12T01:00:00.000Z',
      id: 'r1',
      originalPost: { ...apiPost, available: true },
      repostedBy: { ...author, id: 'u2', username: 'binh' },
      type: 'REPOST',
    };
    const mapped = mapApiFeedItem(repost)!;

    expect(mapped.id).toBe('p1');
    expect(mapped.repost).toEqual({
      by: repost.repostedBy,
      createdAt: repost.createdAt,
      id: 'r1',
    });
    // The original and its repost can both be in one feed: keys must differ.
    expect(postKey(mapped)).toBe('r1');
    expect(postKey(mapApiFeedItem(apiPost)!)).toBe('p1');
  });

  it('keeps a repost of a deleted post as an "unavailable" row instead of crashing', () => {
    const mapped = mapApiFeedItem({
      createdAt: '2026-10-12T01:00:00.000Z',
      id: 'r2',
      originalPost: { author: null as never, available: false, id: null as never, media: [] },
      repostedBy: author,
      type: 'REPOST',
    })!;

    expect(mapped.unavailable).toBe(true);
    expect(mapped.media).toEqual([]);
  });

  it('drops rows of an unknown shape rather than failing the whole page', () => {
    const response = mapApiPostList({
      data: [apiPost, { id: 'weird', type: 'AD' } as unknown as ApiFeedItem],
      meta: { limit: 10, page: 1, total: 2, totalPages: 2 },
    });

    expect(response.data.map((post) => post.id)).toEqual(['p1']);
    expect(response.meta.hasMore).toBe(true);
  });
});

describe('suggestionReason', () => {
  it('explains each kind of suggestion', () => {
    expect(suggestionReason({ mutualCount: 0, mutualPreview: [], reason: 'FOLLOWS_YOU' })).toBe(
      'Đang theo dõi bạn',
    );
    expect(
      suggestionReason({ mutualCount: 2, mutualPreview: ['An', 'Bình'], reason: 'MUTUAL' }),
    ).toBe('Được An, Bình theo dõi');
    expect(
      suggestionReason({ mutualCount: 5, mutualPreview: ['An', 'Bình'], reason: 'MUTUAL' }),
    ).toBe('Được An, Bình và 3 người khác theo dõi');
    expect(suggestionReason({ mutualCount: 0, mutualPreview: [], reason: 'POPULAR' })).toBe(
      'Gợi ý cho bạn',
    );
  });
});

describe('reel view log', () => {
  it('always logs the view, and classifies skip / complete / replay', () => {
    expect(summarizeView({ durationMs: 10_000, loops: 0, watchMs: 1_500 })).toEqual([
      'VIEW',
      'SKIP',
    ]);
    expect(summarizeView({ durationMs: 10_000, loops: 0, watchMs: 5_000 })).toEqual(['VIEW']);
    expect(summarizeView({ durationMs: 10_000, loops: 0, watchMs: 9_200 })).toEqual([
      'VIEW',
      'COMPLETE',
    ]);
    expect(summarizeView({ durationMs: 10_000, loops: 2, watchMs: 25_000 })).toEqual([
      'VIEW',
      'COMPLETE',
      'REPLAY',
    ]);
    // A 1-second clip watched to the end is a completion, not a skip.
    expect(summarizeView({ durationMs: 1_000, loops: 0, watchMs: 950 })).toEqual([
      'VIEW',
      'COMPLETE',
    ]);
  });

  it('formats counts the Vietnamese way', () => {
    expect(formatReelCount(999)).toBe('999');
    expect(formatReelCount(1_200)).toBe('1,2 N');
    expect(formatReelCount(3_400_000)).toBe('3,4 Tr');
    expect(formatReelCount(2_000)).toBe('2 N');
  });
});

describe('validateVideo', () => {
  it('accepts a short MP4 and rejects long, heavy or unsupported files', () => {
    expect(validateVideo({ duration: 30_000, fileSize: 5_000_000, mimeType: 'video/mp4' })).toBeNull();
    expect(validateVideo({ duration: 61_000, mimeType: 'video/mp4' })).toMatch('60 giây');
    expect(validateVideo({ duration: 10_000, fileSize: 31 * 1024 * 1024 })).toMatch('30 MB');
    expect(validateVideo({ mimeType: 'video/x-matroska' })).toMatch('MP4');
  });
});

describe('RichText', () => {
  it('makes hashtags and mentions tappable, including Vietnamese hashtags', async () => {
    const onPressHashtag = jest.fn();
    const onPressMention = jest.fn();
    const { getByText } = await render(
      <RichText
        onPressHashtag={onPressHashtag}
        onPressMention={onPressMention}
        text="Ăn sáng #đồăn với @minh.tran nhé."
      />,
    );

    fireEvent.press(getByText('#đồăn'));
    fireEvent.press(getByText('@minh.tran'));

    expect(onPressHashtag).toHaveBeenCalledWith('đồăn');
    // The sentence's final dot is not part of the username.
    expect(onPressMention).toHaveBeenCalledWith('minh.tran');
  });
});
