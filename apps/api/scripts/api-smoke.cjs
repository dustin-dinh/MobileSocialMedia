// Kiểm tra nhanh các endpoint thêm ngày 2026-10-12 trên một API đang chạy.
//
//   node scripts/seed-test-users.cjs clean && node scripts/seed-test-users.cjs
//   API=http://localhost:3000/api node scripts/api-smoke.cjs
//   node scripts/seed-test-users.cjs clean
//
// Lưu ý: bước cuối làm đầy giới hạn đăng nhập (10 lần/phút) nên phải chờ 1 phút mới chạy lại được,
// và tài khoản gaptest_a bị xóa trong lúc chạy (thử chức năng xóa tài khoản) nên phải seed lại.
const BASE = process.env.API ?? 'http://localhost:3000/api';
const PASSWORD = 'Passw0rd!gap';
let failed = 0;

function check(name, ok, detail) {
  if (!ok) failed++;
  console.log(`${ok ? 'PASS' : 'FAIL'}  ${name}${ok ? '' : '  -> ' + JSON.stringify(detail)?.slice(0, 300)}`);
}

async function call(method, path, token, body, form) {
  const headers = {};
  if (token) headers.Authorization = `Bearer ${token}`;
  let payload;
  if (form) payload = form;
  else if (body !== undefined) { headers['Content-Type'] = 'application/json'; payload = JSON.stringify(body); }
  const res = await fetch(`${BASE}/${path}`, { method, headers, body: payload });
  const text = await res.text();
  let json = null;
  try { json = text ? JSON.parse(text) : null; } catch { json = text; }
  return { status: res.status, body: json };
}

async function login(name, password = PASSWORD) {
  return call('POST', 'auth/login', null, { email: `gaptest_${name}@example.invalid`, password });
}

function formPost(content, privacy) {
  const form = new FormData();
  form.append('content', content);
  form.append('privacy', privacy);
  return form;
}

(async () => {
  const sessions = {};
  for (const n of ['a', 'b', 'c']) {
    const r = await login(n);
    sessions[n] = { token: r.body?.data?.accessToken, id: r.body?.data?.user?.id };
    check(`login ${n}`, r.status < 300 && sessions[n].token, r);
    if (n === 'a') check('login user has onboardedAt=null, hasPassword=true', r.body.data.user.onboardedAt === null && r.body.data.user.hasPassword === true, r.body.data.user);
  }
  const { a, b, c } = sessions;

  let r = await login('d');
  check('unverified login -> 401 EMAIL_NOT_VERIFIED', r.status === 401 && r.body?.code === 'EMAIL_NOT_VERIFIED', r);

  // profile update
  r = await call('PATCH', 'users/me', a.token, { displayName: '  Gap A  ', bio: 'hello' });
  check('PATCH users/me trims + saves', r.status === 200 && r.body.data.displayName === 'Gap A' && r.body.data.bio === 'hello', r);
  r = await call('PATCH', 'users/me', a.token, { username: 'gaptest_b' });
  check('PATCH users/me duplicate username -> 409', r.status === 409, r);
  r = await call('PATCH', 'users/me', a.token, { username: 'x' });
  check('PATCH users/me short username -> 400', r.status === 400, r);

  // avatar
  const png = Buffer.from('iVBORw0KGgoAAAANSUhEUgAAAAEAAAABCAYAAAAfFcSJAAAADUlEQVR42mNkYPhfDwAChwGA60e6kgAAAABJRU5ErkJggg==', 'base64');
  let form = new FormData();
  form.append('avatar', new Blob([png], { type: 'image/png' }), 'a.png');
  r = await call('POST', 'users/me/avatar', a.token, undefined, form);
  const avatarUrl = r.body?.data?.avatarUrl;
  check('POST users/me/avatar', r.status === 201 && /avatars\//.test(avatarUrl ?? ''), r);
  const pub = avatarUrl ? await fetch(avatarUrl) : { status: 0 };
  check('avatar URL is publicly readable', pub.status === 200, pub.status);
  r = await call('DELETE', 'users/me/avatar', a.token);
  check('DELETE users/me/avatar', r.status === 200 && r.body.data.avatarUrl === null, r);

  // follows + suggestions
  await call('POST', `users/${b.id}/follow`, a.token);
  await call('POST', `users/${c.id}/follow`, b.token);
  r = await call('GET', 'users/suggestions?limit=50', a.token);
  let s = r.body?.data?.find((u) => u.id === c.id);
  check('suggestions(a) has c as MUTUAL via b', s?.reason === 'MUTUAL' && s.mutualCount === 1 && s.mutualPreview[0] === 'gaptest_b', s ?? r);
  check('suggestions(a) excludes self and followed', !r.body.data.some((u) => u.id === a.id || u.id === b.id), null);
  r = await call('GET', 'users/suggestions?limit=50', b.token);
  s = r.body?.data?.find((u) => u.id === a.id);
  check('suggestions(b) has a as FOLLOWS_YOU', s?.reason === 'FOLLOWS_YOU', s ?? r);

  r = await call('GET', `users/${b.id}`, a.token);
  check('profile(b) seen by a: isFollowing, counts', r.body?.data?.isFollowing === true && r.body.data.followsYou === false && r.body.data.followersCount === 1 && r.body.data.followingCount === 1, r);
  r = await call('GET', `users/${b.id}/followers`, c.token);
  check('followers(b) item has isFollowing', r.body?.data?.[0]?.id === a.id && r.body.data[0].isFollowing === false, r);

  // posts + privacy
  const posts = {};
  for (const [key, privacy] of [['pub', 'PUBLIC'], ['fr', 'FRIENDS'], ['priv', 'PRIVATE']]) {
    r = await call('POST', 'posts', b.token, undefined, formPost(`gaptest ${key} zebraquokka`, privacy));
    posts[key] = r.body?.data?.id;
    check(`create ${privacy} post returns privacy`, r.status === 201 && r.body.data.privacy === privacy, r);
  }
  const ids = (resp) => (resp.body?.data ?? []).map((p) => p.id);
  r = await call('GET', `users/${b.id}/posts`, a.token);
  check('user posts: non-mutual follower sees only PUBLIC', ids(r).join() === posts.pub, ids(r));
  r = await call('GET', `users/${b.id}`, a.token);
  check('profile postsCount respects privacy', r.body.data.postsCount === 1, r.body.data);
  await call('POST', `users/${a.id}/follow`, b.token);
  r = await call('GET', `users/${b.id}/posts`, a.token);
  check('user posts: mutual sees PUBLIC+FRIENDS, never PRIVATE', ids(r).length === 2 && !ids(r).includes(posts.priv), ids(r));
  r = await call('GET', `users/${b.id}/posts`, b.token);
  check('user posts: owner sees all 3', ids(r).length === 3, ids(r));
  r = await call('GET', `posts/${posts.priv}`, a.token);
  check('GET private post by other -> 404', r.status === 404, r);

  r = await call('GET', 'posts/feed?limit=50', a.token);
  const feedPub = r.body?.data?.find((p) => p.id === posts.pub);
  check('feed item has type POST + privacy + flags', feedPub?.type === 'POST' && feedPub.privacy === 'PUBLIC' && feedPub.isSaved === false && feedPub.isReposted === false && feedPub.repostsCount === 0, feedPub ?? r.status);

  // repost
  r = await call('POST', `posts/${posts.pub}/repost`, a.token);
  check('repost', r.status === 201 && r.body.reposted === true, r);
  r = await call('POST', `posts/${posts.pub}/repost`, a.token);
  check('repost twice is idempotent', r.status === 201, r);
  r = await call('POST', `posts/${posts.pub}/repost`, b.token);
  check('repost own post -> 409', r.status === 409, r);
  r = await call('GET', 'posts/feed?limit=50', a.token);
  const rp = r.body?.data?.find((p) => p.type === 'REPOST' && p.originalPost?.id === posts.pub);
  check('feed has REPOST item with original + flags', rp?.repostedBy?.id === a.id && rp.originalPost.available === true && rp.originalPost.isReposted === true && rp.originalPost.repostsCount === 1, rp ?? null);
  r = await call('GET', `users/${a.id}/reposts`, c.token);
  check('GET users/:id/reposts', r.body?.data?.length === 1 && r.body.data[0].originalPost.id === posts.pub, r);
  r = await call('GET', 'notifications?limit=50', b.token);
  check('author got REPOST notification', r.body?.data?.some((n) => n.type === 'REPOST' && n.actor.id === a.id), r.body?.data?.map((n) => n.type));

  // comments
  r = await call('POST', `posts/${posts.pub}/comments`, a.token, { content: 'first @gaptest_c' });
  const c1 = r.body?.data?.id;
  check('create comment returns author + counts', r.status === 201 && r.body.data.author?.id === a.id && r.body.data.likesCount === 0, r);
  r = await call('POST', `comments/${c1}/replies`, c.token, { content: 'reply' });
  const r1 = r.body?.data?.id;
  check('reply', r.status === 201 && r.body.data.parentId === c1, r);
  r = await call('POST', `comments/${r1}/replies`, a.token, { content: 'reply to reply' });
  check('reply to a reply attaches to the root comment', r.body?.data?.parentId === c1, r);
  r = await call('PATCH', `comments/${c1}`, a.token, { content: '  edited  ' });
  check('edit own comment sets editedAt', r.status === 200 && r.body.data.content === 'edited' && r.body.data.editedAt, r);
  r = await call('PATCH', `comments/${c1}`, c.token, { content: 'hack' });
  check('edit someone else comment -> 403', r.status === 403, r);
  r = await call('PATCH', `comments/${c1}`, a.token, { content: '   ' });
  check('edit to blank -> 400', r.status === 400, r);
  r = await call('POST', `comments/${c1}/like`, c.token);
  check('like comment', r.body?.data?.isLiked === true && r.body.data.likesCount === 1, r);
  r = await call('GET', `posts/${posts.pub}/comments`, c.token);
  check('list comments: likes, replies, isLiked', r.body?.data?.[0]?.likesCount === 1 && r.body.data[0].repliesCount === 2 && r.body.data[0].isLiked === true, r);
  r = await call('GET', `comments/${c1}/replies`, a.token);
  check('list replies', r.body?.data?.length === 2, r);
  r = await call('GET', `posts/${posts.priv}/comments`, a.token);
  check('comments of a private post by other -> 404', r.status === 404, r);
  r = await call('GET', 'notifications?limit=50', c.token);
  check('mention in comment -> MENTION notification', r.body?.data?.some((n) => n.type === 'MENTION'), r.body?.data?.map((n) => n.type));
  r = await call('GET', 'notifications?limit=50', a.token);
  check('reply -> REPLY notification', r.body?.data?.some((n) => n.type === 'REPLY'), r.body?.data?.map((n) => n.type));
  r = await call('DELETE', `comments/${c1}`, c.token);
  check('delete by unrelated user -> 403', r.status === 403, r);
  r = await call('DELETE', `comments/${c1}`, b.token);
  check('post author deletes comment, commentsCount drops to 0', r.status === 200 && r.body.data.commentsCount === 0, r);

  // save / hide / search / likers
  r = await call('POST', `posts/${posts.pub}/save`, a.token);
  r = await call('GET', 'posts/saved', a.token);
  check('saved list', ids(r).join() === posts.pub && r.body.data[0].isSaved === true, r);
  await call('DELETE', `posts/${posts.pub}/save`, a.token);
  r = await call('GET', 'posts/saved', a.token);
  check('unsave', ids(r).length === 0, r);
  await call('POST', `posts/${posts.pub}/hide`, c.token);
  r = await call('GET', 'posts/feed?limit=50', c.token);
  check('hidden post leaves feed (also as repost)', !r.body.data.some((p) => p.id === posts.pub || p.originalPost?.id === posts.pub), null);
  await call('DELETE', `posts/${posts.pub}/hide`, c.token);
  r = await call('GET', 'posts/search?q=ZEBRAQUOKKA', c.token);
  check('search posts: case-insensitive, only visible', ids(r).join() === posts.pub, ids(r));
  await call('POST', `posts/${posts.pub}/like`, c.token);
  r = await call('GET', `posts/${posts.pub}/likes`, a.token);
  check('likers list', r.body?.data?.[0]?.id === c.id, r);
  r = await call('POST', `posts/${posts.priv}/like`, a.token);
  check('like a private post by other -> 404', r.status === 404, r);

  // report
  r = await call('POST', 'reports', a.token, { targetType: 'POST', targetId: posts.pub, reason: 'SPAM' });
  const r2 = await call('POST', 'reports', a.token, { targetType: 'POST', targetId: posts.pub, reason: 'OTHER', note: 'x' });
  check('report + duplicate report', r.status === 201 && r2.status === 201, [r, r2]);
  r = await call('POST', 'reports', a.token, { targetType: 'POST', targetId: posts.pub, reason: 'NOPE' });
  check('report bad reason -> 400', r.status === 400, r);

  // block
  r = await call('POST', `users/${b.id}/block`, c.token);
  check('block', r.body?.data?.isBlocked === true, r);
  r = await call('GET', `users/${b.id}`, c.token);
  check('blocker sees profile with isBlocked, follow removed', r.body?.data?.isBlocked === true && r.body.data.followsYou === false, r);
  r = await call('GET', `users/${c.id}`, b.token);
  check('blocked user gets 404 on blocker profile', r.status === 404, r);
  r = await call('GET', 'posts/feed?limit=50', c.token);
  check('blocker feed has no posts by blocked user', !r.body.data.some((p) => p.author?.id === b.id || p.originalPost?.author?.id === b.id), null);
  r = await call('POST', `users/${c.id}/follow`, b.token);
  check('blocked user cannot follow blocker', r.status === 404, r);
  r = await call('GET', 'users/search?q=gaptest', c.token);
  check('search users excludes blocked', !r.body.data.some((u) => u.id === b.id), null);
  r = await call('GET', 'users/me/blocked', c.token);
  check('blocked list', r.body?.data?.[0]?.id === b.id, r);
  r = await call('DELETE', `users/${b.id}/block`, c.token);
  check('unblock', r.body?.data?.isBlocked === false, r);

  // devices
  r = await call('POST', 'notifications/devices', a.token, { token: 'ExponentPushToken[gaptest-xxxxxxxx]', platform: 'android' });
  check('register device', r.status === 201, r);
  r = await call('DELETE', `notifications/devices?token=${encodeURIComponent('ExponentPushToken[gaptest-xxxxxxxx]')}`, a.token);
  check('unregister device', r.status === 200, r);

  // onboarding
  r = await call('POST', 'users/me/onboarding/complete', a.token);
  check('complete onboarding', Boolean(r.body?.data?.onboardedAt), r);

  // password
  r = await call('PATCH', 'auth/password', a.token, { currentPassword: 'wrong-password', newPassword: 'NewPassw0rd!' });
  check('change password wrong current -> 400 (not 401)', r.status === 400, r);
  r = await call('PATCH', 'auth/password', a.token, { currentPassword: PASSWORD, newPassword: 'NewPassw0rd!' });
  check('change password', r.status === 200 && Boolean(r.body?.data?.accessToken), r);
  // Đổi mật khẩu thu hồi token cũ và trả token mới cho thiết bị đang dùng.
  a.token = r.body?.data?.accessToken ?? a.token;
  r = await login('a', 'NewPassw0rd!');
  check('login with new password', r.status < 300, r);

  // delete account
  r = await call('DELETE', 'users/me', a.token, { password: 'wrong-password' });
  check('delete account wrong password -> 400', r.status === 400, r);
  r = await call('DELETE', 'users/me', a.token, { password: 'NewPassw0rd!' });
  check('delete account', r.status === 200 && r.body.data.deleted === true, r);
  r = await call('GET', 'users/me', a.token);
  check('deleted account token no longer works', r.status === 401, r);
  r = await call('GET', `users/${b.id}`, b.token);
  check('followers of others drop after account deletion', r.body?.data?.followersCount === 0, r.body?.data);

  // throttle (cuối cùng vì nó khóa login trong 1 phút)
  const statuses = [];
  // Email không tồn tại: không làm khóa tài khoản thử 15 phút (khóa theo tài khoản sau 5 lần sai).
  for (let i = 0; i < 12; i++) statuses.push((await login('nobody', 'wrong-password')).status);
  check('login throttled after 10/min', statuses.includes(429) && statuses.at(-1) === 429, statuses);

  console.log(failed ? `\n${failed} FAILED` : '\nALL PASSED');
  process.exit(failed ? 1 : 0);
})().catch((e) => { console.error(e); process.exit(1); });
