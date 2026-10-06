/**
 * Live integration suite: drives the real Mobile services against a running
 * NestJS backend, with two throwaway accounts acting on each other.
 *
 * It is skipped in the normal `jest` run. To execute it, start the backend
 * and run:
 *
 *   LIVE_API=1 EXPO_PUBLIC_API_BASE_URL=http://127.0.0.1:3000/api \
 *     corepack pnpm exec jest __tests__/live
 *
 * Each run registers two `qa_live_*` users in the target database.
 */
import * as SecureStore from 'expo-secure-store';
import { io } from 'socket.io-client';

import { authService } from '../../src/features/auth/services/authService';
import type { AuthUser } from '../../src/features/auth/services/authService';
import { commentService } from '../../src/features/comment/services/commentService';
import { feedService } from '../../src/features/feed/services/feedService';
import type { Post } from '../../src/features/feed/types';
import { notificationService } from '../../src/features/notifications/services/notificationService';
import { postService } from '../../src/features/post/services/postService';
import { profileService } from '../../src/features/profile/services/profileService';
import { searchService } from '../../src/features/search/services/searchService';
import { ApiError } from '../../src/services/apiError';
import { followApi } from '../../src/services/followApi';
import { installNodeFetch } from './nodeFetch';

const isLive = process.env.LIVE_API === '1';
const describeLive = isLive ? describe : describe.skip;

type Account = { token: string; user: AuthUser };

const PASSWORD = 'qa-live-password-123';
const stamp = Date.now().toString(36);

/** Token the mocked SecureStore hands to httpClient — i.e. "who is signed in". */
let activeToken: string | null = null;

async function createAccount(tag: string): Promise<Account> {
  const username = `qa_live_${tag}_${stamp}`;
  const email = `${username}@example.com`;

  await authService.register({ confirmPassword: PASSWORD, email, password: PASSWORD, username });

  const { accessToken } = await authService.login({ email, password: PASSWORD });
  const user = await authService.getCurrentUser(accessToken);

  return { token: accessToken, user };
}

function actAs(account: Account): void {
  activeToken = account.token;
  followApi.clearCache();
}

describeLive('Mobile services against the live API', () => {
  let alice: Account;
  let bob: Account;
  let bobPost: Post;

  beforeAll(async () => {
    if (!process.env.LIVE_DEBUG) {
      jest.spyOn(console, 'log').mockImplementation(() => undefined);
    }
    installNodeFetch();
    (SecureStore.getItemAsync as jest.Mock).mockImplementation(() => Promise.resolve(activeToken));

    alice = await createAccount('a');
    bob = await createAccount('b');
  }, 60_000);

  it('auth: login returns a token that resolves the current user', () => {
    expect(alice.token.length).toBeGreaterThan(20);
    expect(alice.user.username).toBe(`qa_live_a_${stamp}`);
  });

  it('auth: wrong password is rejected as unauthorized', async () => {
    await expect(
      authService.login({ email: alice.user.email, password: 'wrong-password' }),
    ).rejects.toMatchObject({ kind: 'unauthorized', status: 401 });
  });

  it('post: creates a text post and maps it to the UI model', async () => {
    actAs(bob);
    bobPost = await postService.createPost({ content: `Hello ${stamp}`, mediaUris: [] }, bob.user);

    expect(bobPost.id).toBeTruthy();
    expect(bobPost.content).toBe(`Hello ${stamp}`);
    expect(bobPost.author.id).toBe(bob.user.id);
    expect(bobPost).toMatchObject({ commentsCount: 0, isLiked: false, likesCount: 0, media: [] });
  });

  it('post: an empty post is rejected by the server', async () => {
    actAs(bob);

    await expect(postService.createPost({ content: '   ', mediaUris: [] }, bob.user)).rejects.toBeInstanceOf(
      ApiError,
    );
  });

  it('search: finds another user by username, not following yet', async () => {
    actAs(alice);
    const results = await searchService.searchUsers(`qa_live_b_${stamp}`);

    expect(results).toHaveLength(1);
    expect(results[0]).toMatchObject({ id: bob.user.id, isFollowing: false });
  });

  it('search: never lists the signed-in user and tolerates an empty query', async () => {
    actAs(alice);

    expect(await searchService.searchUsers(`qa_live_a_${stamp}`)).toEqual([]);
    expect(await searchService.searchUsers('   ')).toEqual([]);
  });

  it('feed: a stranger\'s post is absent until followed', async () => {
    actAs(alice);
    const before = await feedService.getFeed(1);

    expect(before.data.find((post) => post.id === bobPost.id)).toBeUndefined();

    expect(await searchService.toggleFollowUser(bob.user.id, false)).toBe(true);

    const after = await feedService.getFeed(1);
    const seen = after.data.find((post) => post.id === bobPost.id);

    expect(seen).toMatchObject({ content: `Hello ${stamp}`, isLiked: false, likesCount: 0 });
    expect(after.meta.page).toBe(1);
  });

  it('search: follow state is reflected after following', async () => {
    actAs(alice);
    const results = await searchService.searchUsers(`qa_live_b_${stamp}`);

    expect(results[0].isFollowing).toBe(true);
  });

  it('like: toggles on and off and the feed reflects the server state', async () => {
    actAs(alice);
    const liked = await feedService.toggleLike({ ...bobPost, isLiked: false, likesCount: 0 });

    expect(liked).toMatchObject({ isLiked: true, likesCount: 1 });

    let feed = await feedService.getFeed(1);

    expect(feed.data.find((post) => post.id === bobPost.id)).toMatchObject({ isLiked: true, likesCount: 1 });

    await feedService.toggleLike(liked);
    feed = await feedService.getFeed(1);

    expect(feed.data.find((post) => post.id === bobPost.id)).toMatchObject({ isLiked: false, likesCount: 0 });

    // Leave the post liked so Bob has a LIKE notification with a live like.
    await feedService.toggleLike({ ...bobPost, isLiked: false, likesCount: 0 });
  });

  it('save: bookmark is kept locally and re-applied on reload', async () => {
    actAs(alice);
    const saved = await feedService.toggleSave({ ...bobPost, isSaved: false });

    expect(saved.isSaved).toBe(true);

    const feed = await feedService.getFeed(1);

    expect(feed.data.find((post) => post.id === bobPost.id)?.isSaved).toBe(true);
  });

  it('comment: adds a comment and lists it with its author', async () => {
    actAs(alice);
    const author = {
      avatarUrl: alice.user.avatarUrl,
      displayName: alice.user.displayName,
      id: alice.user.id,
      username: alice.user.username,
    };
    const created = await commentService.addComment(bobPost.id, 'Nice post', author);

    expect(created).toMatchObject({ content: 'Nice post', postId: bobPost.id });
    expect(created.author.id).toBe(alice.user.id);

    const comments = await commentService.getComments(bobPost.id);

    expect(comments).toHaveLength(1);
    expect(comments[0]).toMatchObject({ content: 'Nice post', id: created.id, isLiked: false });
    expect(comments[0].author.username).toBe(alice.user.username);

    expect(await commentService.toggleLikeComment(created.id, false)).toBe(true);
    expect((await commentService.getComments(bobPost.id))[0].isLiked).toBe(true);
  });

  it('profile: reports real post, follower and following totals', async () => {
    actAs(bob);
    const bobProfile = await profileService.getCurrentUserProfile(bob.user);

    expect(bobProfile).toMatchObject({
      followersCount: 1,
      followingCount: 0,
      id: bob.user.id,
      postsCount: 1,
      username: bob.user.username,
    });

    const posts = await profileService.getUserPosts(bob.user);

    expect(posts.data).toHaveLength(1);
    expect(posts.data[0]).toMatchObject({ commentsCount: 1, id: bobPost.id, likesCount: 1 });

    actAs(alice);
    const aliceProfile = await profileService.getCurrentUserProfile(alice.user);

    expect(aliceProfile).toMatchObject({ followersCount: 0, followingCount: 1, postsCount: 0 });
  });

  it('profile: editing fails visibly because the backend has no endpoint', async () => {
    actAs(bob);

    await expect(profileService.updateProfile(bob.user, { displayName: 'Bob' })).rejects.toBeInstanceOf(
      ApiError,
    );
  });

  it('notifications: recipient sees FOLLOW, LIKE and COMMENT, unread', async () => {
    actAs(bob);
    const notifications = await notificationService.getNotifications();
    const types = notifications.map((notification) => notification.type).sort();

    // One FOLLOW, one COMMENT, and a LIKE per like (liked twice above).
    expect(types).toEqual(['COMMENT', 'FOLLOW', 'LIKE', 'LIKE']);
    expect(notifications.every((notification) => !notification.isRead)).toBe(true);
    expect(notifications.every((notification) => notification.actor.id === alice.user.id)).toBe(true);
    expect(notifications.find((notification) => notification.type === 'FOLLOW')?.isFollowingBack).toBe(false);
    expect(notifications.find((notification) => notification.type === 'LIKE')?.postId).toBe(bobPost.id);
  });

  it('notifications: mark one read, follow back, then mark all read', async () => {
    actAs(bob);
    const [first] = await notificationService.getNotifications();

    await notificationService.markAsRead(first.id);

    let notifications = await notificationService.getNotifications();

    expect(notifications.filter((notification) => notification.isRead)).toHaveLength(1);

    expect(await notificationService.toggleFollowBack(alice.user.id, false)).toBe(true);
    notifications = await notificationService.getNotifications();

    expect(notifications.find((notification) => notification.type === 'FOLLOW')?.isFollowingBack).toBe(true);

    await notificationService.markAllAsRead();
    notifications = await notificationService.getNotifications();

    expect(notifications.every((notification) => notification.isRead)).toBe(true);
  });

  it('realtime: recipient socket receives notification:new', async () => {
    const socketUrl = `${process.env.EXPO_PUBLIC_API_BASE_URL?.replace(/\/api$/, '')}/notifications`;
    const socket = io(socketUrl, { auth: { token: alice.token }, transports: ['websocket'] });

    try {
      await new Promise<void>((resolve, reject) => {
        socket.on('connect', () => resolve());
        socket.on('connect_error', reject);
      });
      // The gateway joins the user's room asynchronously after the handshake.
      await new Promise((resolve) => setTimeout(resolve, 500));

      const received = new Promise<unknown>((resolve) => socket.on('notification:new', resolve));

      // Bob already follows Alice from the previous test, and a duplicate
      // follow creates no notification — so unfollow first, then follow.
      actAs(bob);
      await notificationService.toggleFollowBack(alice.user.id, true);
      await notificationService.toggleFollowBack(alice.user.id, false);

      await expect(received).resolves.toMatchObject({ recipientId: alice.user.id, type: 'FOLLOW' });
    } finally {
      socket.disconnect();
    }
  }, 20_000);

  it('unfollow: removes the post from the feed again', async () => {
    actAs(alice);

    expect(await searchService.toggleFollowUser(bob.user.id, true)).toBe(false);

    const feed = await feedService.getFeed(1);

    expect(feed.data.find((post) => post.id === bobPost.id)).toBeUndefined();
  });

  it('logout: succeeds with a valid token', async () => {
    await expect(authService.logout(alice.token)).resolves.toBeUndefined();
  });
});
