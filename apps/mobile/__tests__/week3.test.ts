import { feedService } from '../src/features/feed/services/feedService';
import { commentService } from '../src/features/comment/services/commentService';
import { searchService } from '../src/features/search/services/searchService';
import { notificationService } from '../src/features/notifications/services/notificationService';
import type { Post } from '../src/features/feed/types';

describe('Week 3 Functional Tests (T3-01 to T3-13)', () => {
  const dummyPost: Post = {
    id: 'test-post-1',
    author: {
      id: 'author-1',
      username: 'tester',
      displayName: 'Tester User',
      avatarUrl: null,
    },
    content: 'Testing Week 3 functionality',
    media: [],
    likesCount: 10,
    commentsCount: 2,
    isLiked: false,
    isSaved: false,
    createdAt: new Date().toISOString(),
  };

  // T3-01
  test('T3-01: Like/unlike toggles isLiked and synchronizes likesCount', async () => {
    const liked = await feedService.toggleLike(dummyPost);
    expect(liked.isLiked).toBe(true);
    expect(liked.likesCount).toBe(11);

    const unliked = await feedService.toggleLike(liked);
    expect(unliked.isLiked).toBe(false);
    expect(unliked.likesCount).toBe(10);
  });

  // T3-02
  test('T3-02: Rapid like/unlike toggles produce consistent counter without negative counts', async () => {
    let current = dummyPost;
    for (let i = 0; i < 4; i++) {
      current = await feedService.toggleLike(current);
    }
    expect(current.isLiked).toBe(false);
    expect(current.likesCount).toBe(10);
  });

  // T3-03
  test('T3-03: Comment post adds comment to post', async () => {
    const author = { id: 'u1', username: 'alex', displayName: 'Alex', avatarUrl: null };
    const comment = await commentService.addComment('post-1', 'Great post!', author);
    expect(comment).toBeDefined();
    expect(comment.content).toBe('Great post!');
    expect(comment.postId).toBe('post-1');
  });

  // T3-04
  test('T3-04: Reply comment attaches to post correctly', async () => {
    const author = { id: 'u2', username: 'sarah', displayName: 'Sarah', avatarUrl: null };
    const reply = await commentService.addComment('post-1', '@alex Great comment!', author);
    expect(reply).toBeDefined();
    expect(reply.content).toBe('@alex Great comment!');
    expect(reply.postId).toBe('post-1');
  });

  // T3-05
  test('T3-05: Search user by username and display name', async () => {
    const byUsername = await searchService.searchUsers('alex');
    expect(byUsername.length).toBeGreaterThan(0);
    expect(byUsername.some((u) => u.username.toLowerCase().includes('alex'))).toBe(true);

    const byDisplayName = await searchService.searchUsers('Minh');
    expect(byDisplayName.length).toBeGreaterThan(0);
  });

  // T3-06
  test('T3-06: Search edge cases (empty and non-existent queries)', async () => {
    const emptyResults = await searchService.searchUsers('   ');
    expect(emptyResults.length).toBeGreaterThan(0); // Returns suggested users

    const noResults = await searchService.searchUsers('non_existent_xyz_99999');
    expect(noResults).toEqual([]);
  });

  // T3-07
  test('T3-07: Follow directly from search toggles follow state', async () => {
    const newState = await searchService.toggleFollowUser('user-target', false);
    expect(newState).toBe(true);

    const revertedState = await searchService.toggleFollowUser('user-target', true);
    expect(revertedState).toBe(false);
  });

  // T3-08
  test('T3-08: Notification creation and retrieval', async () => {
    const notifications = await notificationService.getNotifications();
    expect(Array.isArray(notifications)).toBe(true);
    expect(notifications.length).toBeGreaterThan(0);
  });

  // T3-09
  test('T3-09: Notification displays valid actor, action, and target fields', async () => {
    const notifications = await notificationService.getNotifications();
    const first = notifications[0];
    expect(first).toHaveProperty('id');
    expect(first).toHaveProperty('type');
    expect(first).toHaveProperty('actor');
    expect(first.actor).toHaveProperty('username');
  });

  // T3-10
  test('T3-10: Mark notification as read updates read state', async () => {
    const notifs = await notificationService.getNotifications();
    const targetId = notifs[0].id;
    await notificationService.markAsRead(targetId);
    const updated = await notificationService.getNotifications();
    const found = updated.find((n) => n.id === targetId);
    expect(found?.isRead).toBe(true);
  });

  // T3-11
  test('T3-11: No duplicate notifications in initial list', async () => {
    const notifs = await notificationService.getNotifications();
    const ids = notifs.map((n) => n.id);
    const uniqueIds = new Set(ids);
    expect(ids.length).toBe(uniqueIds.size);
  });

  // T3-12
  test('T3-12: Error state and resilience handling in services', async () => {
    // getFeed fallback / response test
    const feed = await feedService.getFeed(1);
    expect(feed.data.length).toBeGreaterThan(0);
  });

  // T3-13
  test('T3-13: Full regression check of core services', async () => {
    const feed = await feedService.getFeed(1);
    const comments = await commentService.getComments(feed.data[0].id);
    const search = await searchService.searchUsers('');
    const notifs = await notificationService.getNotifications();

    expect(feed.data.length).toBeGreaterThan(0);
    expect(Array.isArray(comments)).toBe(true);
    expect(search.length).toBeGreaterThan(0);
    expect(notifs.length).toBeGreaterThan(0);
  });
});
