// Kiểm tra nhanh các tính năng thêm ngày 2026-10-13: bảng tin theo người theo dõi, ảnh bìa,
// cảm xúc, hashtag xu hướng, tài khoản riêng tư, nhắn tin, tin 24 giờ, quản trị.
//
//   docker compose up -d
//   node scripts/seed-test-users.cjs clean && node scripts/seed-test-users.cjs
//   node scripts/make-admin.cjs gaptest_c@example.invalid
//   API=http://localhost:3000/api node scripts/social-smoke.cjs
//   node scripts/seed-test-users.cjs clean
const BASE = process.env.API ?? 'http://localhost:3000/api';
const PASSWORD = 'Passw0rd!gap';
let failed = 0;

function check(name, ok, detail) {
  if (!ok) failed++;
  console.log(`${ok ? 'PASS' : 'FAIL'}  ${name}${ok ? '' : '  -> ' + JSON.stringify(detail)?.slice(0, 400)}`);
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

async function login(name) {
  const r = await call('POST', 'auth/login', null, { email: `gaptest_${name}@example.invalid`, password: PASSWORD });
  return { token: r.body?.data?.accessToken, id: r.body?.data?.user?.id, user: r.body?.data?.user, raw: r };
}

function textPost(content) {
  const form = new FormData();
  form.append('content', content);
  return form;
}

function imageForm(field) {
  const form = new FormData();
  form.append(field, new Blob([Buffer.alloc(2_000, 5)], { type: 'image/png' }), 'x.png');
  return form;
}

async function upload(token, kind, mimeType, bytes) {
  const r = await call('POST', 'media/upload-url', token, { kind, mimeType, sizeBytes: bytes.length });
  await fetch(r.body.data.uploadUrl, { method: 'PUT', headers: r.body.data.headers, body: bytes });
  return r.body.data.storageKey;
}

(async () => {
  const a = await login('a');
  const b = await login('b');
  const c = await login('c');
  check('login a, b, c', Boolean(a.token && b.token && c.token), null);
  check('login user carries role, isPrivate, coverUrl', a.user?.role === 'USER' && a.user.isPrivate === false && a.user.coverUrl === null, a.user);
  check('c is an admin (run make-admin first)', c.user?.role === 'ADMIN', c.user?.role);

  // ── feed: own posts + followed authors only ────────────────────────────
  let r = await call('POST', 'posts', a.token, undefined, textPost('feed check #smoke #Demo'));
  const postA = r.body?.data;
  r = await call('GET', 'posts/feed?limit=30', b.token);
  check('feed hides posts of people you do not follow', !r.body.data.some((p) => p.id === postA.id), null);
  await call('POST', `users/${a.id}/follow`, b.token);
  r = await call('GET', 'posts/feed?limit=30', b.token);
  check('feed shows posts of people you follow', r.body.data.some((p) => p.id === postA.id), null);
  r = await call('GET', 'posts/feed?limit=30', a.token);
  check('feed shows your own posts', r.body.data.some((p) => p.id === postA.id), null);

  // ── cover photo ────────────────────────────────────────────────────────
  r = await call('POST', 'users/me/cover', a.token, undefined, imageForm('cover'));
  check('upload cover', r.status === 201 && /^https?:\/\//.test(r.body?.data?.coverUrl ?? ''), r);
  r = await call('GET', `users/${a.id}`, b.token);
  check('profile shows cover', /^https?:\/\//.test(r.body?.data?.coverUrl ?? ''), r.body?.data);
  r = await call('DELETE', 'users/me/cover', a.token);
  check('remove cover', r.body?.data?.coverUrl === null, r);

  // ── reactions ──────────────────────────────────────────────────────────
  r = await call('POST', `posts/${postA.id}/like`, b.token);
  check('plain like still works', r.body?.data?.isLiked === true && r.body.data.myReaction === 'LIKE', r);
  r = await call('POST', `posts/${postA.id}/like`, b.token, { type: 'LOVE' });
  check('change reaction', r.body?.data?.myReaction === 'LOVE', r);
  await call('POST', `posts/${postA.id}/like`, a.token, { type: 'HAHA' });
  r = await call('GET', `posts/${postA.id}`, b.token);
  check('post carries myReaction and one like per user', r.body?.myReaction === 'LOVE' && r.body.likeCount === 2, r.body);
  r = await call('GET', `posts/${postA.id}/likes`, b.token);
  check('likers list has reaction + counts by type', r.body?.meta?.reactions?.LOVE === 1 && r.body.meta.reactions.HAHA === 1 && r.body.data.every((u) => u.reaction), r.body);
  r = await call('POST', `posts/${postA.id}/like`, b.token, { type: 'NOPE' });
  check('unknown reaction -> 400', r.status === 400, r);
  r = await call('DELETE', `posts/${postA.id}/like`, b.token);
  check('remove reaction', r.body?.data?.myReaction === null, r);

  // ── trending hashtags ──────────────────────────────────────────────────
  await call('POST', 'posts', b.token, undefined, textPost('another one #smoke'));
  r = await call('GET', 'hashtags/trending', c.token);
  const smoke = r.body?.data?.find((row) => row.tag === 'smoke');
  check('trending counts posts per hashtag, lower-cased', smoke?.postsCount >= 2 && r.body.data.some((row) => row.tag === 'demo'), r.body);

  // ── private account ────────────────────────────────────────────────────
  r = await call('PATCH', 'users/me', a.token, { isPrivate: true });
  check('switch to private', r.body?.data?.isPrivate === true, r);
  r = await call('GET', `users/${a.id}/posts`, c.token);
  check('non-follower sees no posts of a private account', r.body?.data?.length === 0, r.body);
  r = await call('GET', `posts/${postA.id}`, c.token);
  check('non-follower cannot open a private account post', r.status === 404, r);
  r = await call('GET', `users/${a.id}/followers`, c.token);
  check('non-follower cannot list followers of a private account', r.status === 403, r);
  r = await call('GET', `users/${a.id}/posts`, b.token);
  check('existing follower still sees posts', r.body?.data?.some((p) => p.id === postA.id), null);
  r = await call('POST', `users/${a.id}/follow`, c.token);
  check('following a private account creates a request', r.body?.data?.following === false && r.body.data.requested === true, r);
  r = await call('GET', `users/${a.id}`, c.token);
  check('profile shows isPrivate + followRequested', r.body?.data?.isPrivate === true && r.body.data.followRequested === true && r.body.data.isFollowing === false, r.body?.data);
  r = await call('GET', 'users/me/follow-requests', a.token);
  check('owner sees the request', r.body?.data?.[0]?.id === c.id, r);
  r = await call('GET', 'notifications?limit=5', a.token);
  check('owner is notified (FOLLOW_REQUEST)', r.body?.data?.some((n) => n.type === 'FOLLOW_REQUEST'), r.body?.data?.map((n) => n.type));
  r = await call('POST', `users/${c.id}/follow-request/accept`, a.token);
  check('accept request', r.body?.data?.accepted === true, r);
  r = await call('GET', `users/${a.id}/posts`, c.token);
  check('accepted follower sees posts', r.body?.data?.some((p) => p.id === postA.id), null);
  await call('DELETE', `users/${a.id}/follow`, c.token);
  await call('POST', `users/${a.id}/follow`, c.token);
  r = await call('DELETE', `users/${c.id}/follow-request`, a.token);
  check('decline request', r.body?.data?.accepted === false, r);
  await call('POST', `users/${a.id}/follow`, c.token);
  r = await call('PATCH', 'users/me', a.token, { isPrivate: false });
  r = await call('GET', `users/${a.id}`, c.token);
  check('going public accepts pending requests', r.body?.data?.isFollowing === true && r.body.data.followRequested === false, r.body?.data);

  // ── messages ───────────────────────────────────────────────────────────
  r = await call('POST', 'conversations', a.token, { userId: a.id });
  check('cannot message yourself', r.status === 400, r);
  r = await call('POST', 'conversations', a.token, { userId: b.id });
  const conversationId = r.body?.data?.id;
  check('open conversation', Boolean(conversationId) && r.body.data.peer.id === b.id, r);
  r = await call('POST', 'conversations', b.token, { userId: a.id });
  check('same pair -> same conversation', r.body?.data?.id === conversationId, r);
  r = await call('GET', 'conversations', b.token);
  check('empty conversations are not listed', r.body?.data?.length === 0, r.body);
  r = await call('POST', `conversations/${conversationId}/messages`, a.token, { content: '  hello b  ', clientId: 'smoke-msg-1-' + Date.now() });
  const first = r.body?.data;
  check('send text', r.status === 201 && first?.content === 'hello b' && first.senderId === a.id, r);
  r = await call('POST', `conversations/${conversationId}/messages`, a.token, { content: 'hello b', clientId: first.id });
  check('resend with the same clientId returns the same message', r.body?.data?.id === first.id, r);
  r = await call('POST', `conversations/${conversationId}/messages`, a.token, { content: '   ' });
  check('empty message -> 400', r.status === 400, r);
  r = await call('POST', `conversations/${conversationId}/messages`, a.token, undefined, imageForm('image'));
  check('send image', r.status === 201 && /^https?:\/\//.test(r.body?.data?.imageUrl ?? ''), r);
  r = await call('POST', `conversations/${conversationId}/messages`, c.token, { content: 'intruder' });
  check('outsider cannot post', r.status === 404, r);
  r = await call('GET', `conversations/${conversationId}/messages`, c.token);
  check('outsider cannot read', r.status === 404, r);
  r = await call('GET', 'conversations', b.token);
  check('recipient list: last message + unread count', r.body?.data?.[0]?.unreadCount === 2 && r.body.data[0].peer.id === a.id && Boolean(r.body.data[0].lastMessage), r.body?.data?.[0]);
  r = await call('GET', 'conversations/unread-count', b.token);
  check('unread conversations count', r.body?.data?.count === 1, r);
  r = await call('GET', 'conversations/unread-count', a.token);
  check('sender has nothing unread', r.body?.data?.count === 0, r);
  r = await call('GET', `conversations/${conversationId}/messages?limit=1`, b.token);
  check('messages newest first, paged', r.body?.data?.length === 1 && r.body.meta.hasMore === true && Boolean(r.body.data[0].imageUrl), r.body);
  r = await call('GET', `conversations/${conversationId}/messages?limit=10&before=${encodeURIComponent(r.body.data[0].createdAt)}`, b.token);
  check('older page', r.body?.data?.length === 1 && r.body.data[0].id === first.id && r.body.meta.hasMore === false, r.body);
  r = await call('POST', `conversations/${conversationId}/read`, b.token);
  check('mark read', Boolean(r.body?.data?.readAt), r);
  r = await call('GET', 'conversations/unread-count', b.token);
  check('unread cleared', r.body?.data?.count === 0, r);
  r = await call('GET', `conversations/${conversationId}/messages`, a.token);
  check('sender sees peerReadAt ("seen")', Boolean(r.body?.meta?.peerReadAt), r.body?.meta);
  await call('POST', `users/${a.id}/block`, b.token);
  r = await call('POST', `conversations/${conversationId}/messages`, a.token, { content: 'after block' });
  check('blocked user cannot send', r.status === 403, r);
  await call('DELETE', `users/${a.id}/block`, b.token);
  await call('POST', `users/${a.id}/follow`, b.token);

  // ── stories ────────────────────────────────────────────────────────────
  const imageKey = await upload(a.token, 'image', 'image/jpeg', Buffer.alloc(3_000, 4));
  r = await call('POST', 'stories', a.token, { type: 'IMAGE', storageKey: imageKey });
  const story = r.body?.data;
  check('create image story (24h)', r.status === 201 && /^https?:\/\//.test(story?.url ?? '') && Math.abs(new Date(story.expiresAt) - new Date(story.createdAt) - 86_400_000) < 5_000, r);
  r = await call('POST', 'stories', b.token, { type: 'IMAGE', storageKey: imageKey });
  check('cannot use another user\'s file', r.status === 400, r);
  const videoKey = await upload(a.token, 'video', 'video/mp4', Buffer.alloc(3_000, 4));
  r = await call('POST', 'stories', a.token, { type: 'IMAGE', storageKey: videoKey });
  check('type must match the file', r.status === 400, r);
  r = await call('GET', 'stories/feed', b.token);
  const group = r.body?.data?.find((g) => g.author.id === a.id);
  check('follower feed: grouped by author, unseen', group?.hasUnseen === true && group.stories[0].id === story.id && group.stories[0].viewsCount === undefined, r.body);
  r = await call('POST', `stories/${story.id}/view`, b.token);
  check('mark viewed', r.body?.data?.isSeen === true, r);
  r = await call('GET', 'stories/feed', b.token);
  check('seen after viewing', r.body?.data?.find((g) => g.author.id === a.id)?.hasUnseen === false, r.body);
  r = await call('GET', 'stories/feed', a.token);
  check('own story first, with view count', r.body?.data?.[0]?.author?.id === a.id && r.body.data[0].stories[0].viewsCount === 1, r.body?.data?.[0]);
  r = await call('GET', `stories/${story.id}/viewers`, a.token);
  check('owner lists viewers', r.body?.data?.[0]?.id === b.id, r);
  r = await call('GET', `stories/${story.id}/viewers`, b.token);
  check('others cannot list viewers', r.status === 404, r);
  await call('DELETE', `users/${a.id}/follow`, c.token);
  r = await call('GET', 'stories/feed', c.token);
  check('non-follower does not get the story', !r.body?.data?.some((g) => g.author.id === a.id), r.body);
  r = await call('POST', `stories/${story.id}/view`, c.token);
  check('non-follower cannot mark it viewed', r.status === 404, r);
  r = await call('DELETE', `stories/${story.id}`, b.token);
  check('only the owner deletes', r.status === 404, r);
  r = await call('DELETE', `stories/${story.id}`, a.token);
  check('delete story', r.body?.data?.deleted === true, r);

  // ── admin ──────────────────────────────────────────────────────────────
  const page = await fetch(`${BASE}/admin`);
  check('admin page is served', page.status === 200 && (await page.text()).includes('Trang quản trị'), page.status);
  r = await call('GET', 'admin/stats', a.token);
  check('non-admin -> 403', r.status === 403, r);
  r = await call('GET', 'admin/stats', c.token);
  check('admin stats', r.status === 200 && r.body.data.users >= 3, r);
  r = await call('POST', 'posts', b.token, undefined, textPost('bad post to report'));
  const badPost = r.body?.data;
  await call('POST', 'reports', a.token, { targetType: 'POST', targetId: badPost.id, reason: 'SPAM', note: 'smoke' });
  await call('POST', 'reports', c.token, { targetType: 'POST', targetId: badPost.id, reason: 'SPAM' });
  r = await call('GET', 'admin/reports?status=OPEN', c.token);
  const report = r.body?.data?.find((row) => row.targetId === badPost.id);
  check('admin sees the report with its target', report?.target?.content === 'bad post to report' && report.target.author.id === b.id, r.body?.data?.[0]);
  r = await call('POST', `admin/reports/${report.id}/resolve`, c.token, { action: 'REMOVE_CONTENT' });
  check('remove content', r.body?.data?.resolved === true, r);
  r = await call('GET', `posts/${badPost.id}`, a.token);
  check('removed post is gone', r.status === 404, r);
  r = await call('GET', 'admin/reports?status=OPEN', c.token);
  check('all open reports on that target are closed', !r.body.data.some((row) => row.targetId === badPost.id), null);
  r = await call('POST', `admin/users/${c.id}/ban`, c.token);
  check('admins cannot be banned', r.status === 400, r);
  r = await call('GET', 'admin/users?q=gaptest_b', c.token);
  check('admin user search', r.body?.data?.[0]?.id === b.id && r.body.data[0].email, r);
  r = await call('POST', `admin/users/${b.id}/ban`, c.token);
  check('ban user', r.body?.data?.banned === true, r);
  r = await call('GET', 'users/me', b.token);
  check('banned token is rejected', r.status === 401 && r.body?.code === 'ACCOUNT_BANNED', r);
  check('banned user cannot log in', (await login('b')).raw.body?.code === 'ACCOUNT_BANNED', null);
  r = await call('DELETE', `admin/users/${b.id}/ban`, c.token);
  r = await call('GET', 'users/me', b.token);
  check('unban restores access', r.status === 200, r);

  console.log(failed ? `\n${failed} FAILED` : '\nALL PASSED');
  process.exit(failed ? 1 : 0);
})().catch((error) => { console.error('CRASHED', error); process.exit(1); });
