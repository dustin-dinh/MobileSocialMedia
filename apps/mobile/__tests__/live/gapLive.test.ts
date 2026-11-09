/**
 * Live integration suite for the features added on 2026-10-12: drives the
 * real Mobile services against a running NestJS backend to check that the
 * response shapes the app expects are the ones the API returns.
 *
 * Skipped in the normal `jest` run. To execute it:
 *
 *   # in apps/api — fresh, email-verified test accounts (gaptest_a / gaptest_b)
 *   node scripts/seed-test-users.cjs clean && node scripts/seed-test-users.cjs
 *
 *   # in apps/mobile, with the backend running
 *   LIVE_API=1 EXPO_PUBLIC_API_BASE_URL=http://127.0.0.1:3000/api \
 *     corepack pnpm exec jest __tests__/live/gapLive
 */
import * as SecureStore from 'expo-secure-store';

import { authService } from '../../src/features/auth/services/authService';
import type { AuthUser } from '../../src/features/auth/services/authService';
import { commentService } from '../../src/features/comment/services/commentService';
import { feedService } from '../../src/features/feed/services/feedService';
import type { Post } from '../../src/features/feed/types';
import { notificationService } from '../../src/features/notifications/services/notificationService';
import { postService } from '../../src/features/post/services/postService';
import { profileService } from '../../src/features/profile/services/profileService';
import { reportService } from '../../src/features/report/reportService';
import { accountService } from '../../src/features/settings/accountService';
import { followApi } from '../../src/services/followApi';
import { installNodeFetch } from './nodeFetch';

const describeLive = process.env.LIVE_API === '1' ? describe : describe.skip;

type Account = { token: string; user: AuthUser };

// Seeded by apps/api/scripts/seed-test-users.cjs.
const SEED_PASSWORD = 'Passw0rd!gap';
const stamp = Date.now().toString(36);

let activeToken: string | null = null;

async function signIn(tag: string): Promise<Account> {
  const { accessToken } = await authService.login({
    email: `gaptest_${tag}@example.invalid`,
    password: SEED_PASSWORD,
  });

  return { token: accessToken, user: await authService.getCurrentUser(accessToken) };
}

function actAs(account: Account): void {
  activeToken = account.token;
  followApi.clearCache();
}

describeLive('New features against the live API', () => {
  let alice: Account;
  let bob: Account;
  let publicPost: Post;

  beforeAll(async () => {
    if (!process.env.LIVE_DEBUG) {
      jest.spyOn(console, 'log').mockImplementation(() => undefined);
    }
    installNodeFetch();
    (SecureStore.getItemAsync as jest.Mock).mockImplementation(() => Promise.resolve(activeToken));

    alice = await signIn('a');
    bob = await signIn('b');
  }, 60_000);

  it('auth: an unverified account is told apart from a wrong password', async () => {
    await expect(
      authService.login({ email: 'gaptest_d@example.invalid', password: SEED_PASSWORD }),
    ).rejects.toMatchObject({ code: 'EMAIL_NOT_VERIFIED', status: 401 });
  });

  it('auth: the current user carries onboarding and password info', () => {
    expect(alice.user.onboardedAt).toBeNull();
    expect(alice.user.hasPassword).toBe(true);
  });

  it('post: "only me" round-trips through the API name PRIVATE', async () => {
    actAs(bob);
    const secret = await postService.createPost(
      { content: `secret ${stamp}`, mediaUris: [], privacy: 'ONLY_ME' },
      bob.user,
    );

    expect(secret.privacy).toBe('ONLY_ME');

    publicPost = await postService.createPost(
      { content: `public ${stamp} #gap${stamp}`, mediaUris: [], privacy: 'PUBLIC' },
      bob.user,
    );

    actAs(alice);
    const visible = await profileService.getUserPosts({ ...bob.user }, 1, 50);

    // A stranger sees the public post on the profile, never the private one.
    expect(visible.data.map((post) => post.id)).toContain(publicPost.id);
    expect(visible.data.map((post) => post.id)).not.toContain(secret.id);
    await expect(feedService.getPost(secret.id)).rejects.toMatchObject({ status: 404 });
  });

  it('profile: relation flags and totals follow follow / unfollow', async () => {
    actAs(alice);
    expect(await profileService.getProfile(bob.user.id)).toMatchObject({
      followersCount: 0,
      followsYou: false,
      isBlocked: false,
      isFollowing: false,
    });

    await followApi.follow(bob.user.id);

    expect(await profileService.getProfile(bob.user.id)).toMatchObject({
      followersCount: 1,
      isFollowing: true,
    });

    const followers = await followApi.listUsers(`users/${bob.user.id}/followers`, 1);

    expect(followers.users.map((user) => user.id)).toEqual([alice.user.id]);
  });

  it('profile: editing name and bio is saved', async () => {
    actAs(alice);
    const updated = await profileService.updateProfile(alice.user, {
      bio: `bio ${stamp}`,
      displayName: 'Alice Gap',
    });

    expect(updated).toMatchObject({ bio: `bio ${stamp}`, displayName: 'Alice Gap' });
  });

  it('repost: shows in the feed and on the profile, and can be undone', async () => {
    actAs(alice);
    const reposted = await feedService.toggleRepost(publicPost);

    expect(reposted).toMatchObject({ isReposted: true, repostsCount: 1 });

    const feed = await feedService.getFeed(1, 50);
    const row = feed.data.find((post) => post.repost?.by.id === alice.user.id);

    expect(row).toMatchObject({ id: publicPost.id, isReposted: true, repostsCount: 1 });

    const profileReposts = await profileService.getUserReposts(alice.user.id);

    expect(profileReposts.data.map((post) => post.id)).toEqual([publicPost.id]);

    await feedService.toggleRepost(reposted);
    expect((await profileService.getUserReposts(alice.user.id)).data).toHaveLength(0);
  });

  it('save: bookmarks live on the server', async () => {
    actAs(alice);
    await feedService.toggleSave({ ...publicPost, isSaved: false });

    const saved = await feedService.getSavedPosts();

    expect(saved.data.map((post) => post.id)).toEqual([publicPost.id]);
    expect(saved.data[0].isSaved).toBe(true);

    await feedService.toggleSave({ ...publicPost, isSaved: true });
    expect((await feedService.getSavedPosts()).data).toHaveLength(0);
  });

  it('comment: reply, edit, like and delete', async () => {
    actAs(alice);
    const author = { ...alice.user };
    const comment = await commentService.addComment(publicPost.id, 'first', author);

    actAs(bob);
    const reply = await commentService.addComment(publicPost.id, 'reply', { ...bob.user }, comment.id);

    expect(reply.parentId).toBe(comment.id);
    expect(await commentService.toggleLikeComment(comment.id, false)).toBe(true);

    actAs(alice);
    const edited = await commentService.updateComment(comment, 'first (edited)');

    expect(edited.content).toBe('first (edited)');
    expect(edited.editedAt).toBeTruthy();

    const [listed] = await commentService.getComments(publicPost.id);

    expect(listed).toMatchObject({
      content: 'first (edited)',
      id: comment.id,
      isLiked: false,
      likesCount: 1,
      repliesCount: 1,
    });
    expect((await commentService.getReplies(comment.id, publicPost.id)).map((item) => item.id)).toEqual([
      reply.id,
    ]);

    // The reply goes with its parent, so the post is back to zero comments.
    expect(await commentService.deleteComment(comment)).toBe(0);
  });

  it('notifications: new kinds are mapped with their targets', async () => {
    actAs(bob);
    const kinds = (await notificationService.getNotifications()).items.map((item) => item.type);

    expect(kinds).toEqual(expect.arrayContaining(['FOLLOW', 'REPOST']));
    // The comment was deleted in the previous test, and its notification went with it.
    expect(kinds).not.toContain('COMMENT');
  });

  it('search and suggestions', async () => {
    actAs(alice);
    const found = await feedService.searchPosts(`#gap${stamp}`);

    expect(found.data.map((post) => post.id)).toEqual([publicPost.id]);

    const suggestions = await profileService.getSuggestions();

    // Bob is already followed, so he must not be suggested.
    expect(suggestions.map((user) => user.id)).not.toContain(bob.user.id);
    suggestions.forEach((user) =>
      expect(['FOLLOWS_YOU', 'MUTUAL', 'POPULAR']).toContain(user.reason),
    );
  });

  it('report and hide', async () => {
    actAs(alice);
    await expect(reportService.report({ id: publicPost.id, type: 'POST' }, 'SPAM')).resolves.toBeUndefined();

    await feedService.hidePost(publicPost.id);

    const feed = await feedService.getFeed(1, 50);

    expect(feed.data.map((post) => post.id)).not.toContain(publicPost.id);
  });

  it('block: removes the follow and hides the profile from the blocked user', async () => {
    actAs(alice);
    await profileService.setBlocked(bob.user.id, true);

    expect(await profileService.getProfile(bob.user.id)).toMatchObject({
      isBlocked: true,
      isFollowing: false,
    });
    expect((await profileService.getBlockedUsers()).map((user) => user.id)).toEqual([bob.user.id]);

    actAs(bob);
    await expect(profileService.getProfile(alice.user.id)).rejects.toMatchObject({ status: 404 });

    actAs(alice);
    await profileService.setBlocked(bob.user.id, false);
    expect((await profileService.getBlockedUsers())).toHaveLength(0);
  });

  it('account: a wrong current password does not end the session', async () => {
    actAs(alice);

    // 400, not 401: the HTTP client treats 401 as "signed out".
    await expect(accountService.changePassword('wrong-password', 'new-password-1')).rejects.toMatchObject({
      kind: 'server',
      status: 400,
    });
    await expect(authService.getCurrentUser(alice.token)).resolves.toMatchObject({ id: alice.user.id });
  });

  it('account: onboarding completion and account deletion', async () => {
    actAs(bob);
    await accountService.completeOnboarding();
    expect((await authService.getCurrentUser(bob.token)).onboardedAt).toBeTruthy();

    await expect(accountService.deleteAccount({ password: 'wrong-password' })).rejects.toMatchObject({
      status: 400,
    });
    await accountService.deleteAccount({ password: SEED_PASSWORD });
    await expect(authService.getCurrentUser(bob.token)).rejects.toMatchObject({ status: 401 });
  });
});
