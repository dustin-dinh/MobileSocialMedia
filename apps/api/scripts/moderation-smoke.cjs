// Kiểm tra đợt 2026-11-01 (B4): hàng đợi báo cáo theo mức độ, nhật ký quản trị, xem danh tính phải có
// lý do, gỡ / khôi phục bình luận, xóa tài khoản giữ dữ liệu của người khác.
//
//   API=http://localhost:3004/api DATABASE_URL=postgresql://postgres:postgres@localhost:5433/mobilesocial \
//     node scripts/moderation-smoke.cjs
//
// Tự tạo và tự xóa các tài khoản thử b4test_* (kể cả tài khoản đã bị xóa còn lại dưới tên deleted_*).
// Chỉ chạy trên database thử.
const { Client } = require('pg');
const bcrypt = require('bcrypt');
const { randomUUID } = require('node:crypto');

const BASE = process.env.API ?? 'http://localhost:3000/api';
const DB = process.env.DATABASE_URL ?? 'postgresql://postgres:postgres@localhost:5433/mobilesocial';
const PASSWORD = 'Passw0rd!b4test';
let failed = 0;
let passed = 0;

function check(name, ok, detail) {
  if (ok) passed++; else failed++;
  console.log(`${ok ? 'PASS' : 'FAIL'}  ${name}${ok ? '' : '  -> ' + JSON.stringify(detail)?.slice(0, 400)}`);
}

async function call(method, urlPath, token, body, form) {
  const headers = {};
  if (token) headers.Authorization = `Bearer ${token}`;
  let payload;
  if (form) payload = form;
  else if (body !== undefined) { headers['Content-Type'] = 'application/json'; payload = JSON.stringify(body); }
  const res = await fetch(`${BASE}/${urlPath}`, { method, headers, body: payload });
  const text = await res.text();
  let json = null;
  try { json = text ? JSON.parse(text) : null; } catch { json = text; }
  return { status: res.status, body: json };
}

async function login(name) {
  const r = await call('POST', 'auth/login', null, { email: `b4test_${name}@example.invalid`, password: PASSWORD });
  return { token: r.body?.data?.accessToken, id: r.body?.data?.user?.id, raw: r };
}

function textPost(content) {
  const form = new FormData();
  form.append('content', content);
  return form;
}

// Ảnh PNG hợp lệ 32x32 một màu.
function plainPng(shade) {
  const zlib = require('node:zlib');
  const crc = (buf) => {
    let c = 0xffffffff;
    for (const b of buf) { c ^= b; for (let k = 0; k < 8; k++) c = c & 1 ? 0xedb88320 ^ (c >>> 1) : c >>> 1; }
    return (c ^ 0xffffffff) >>> 0;
  };
  const chunk = (type, data) => {
    const len = Buffer.alloc(4); len.writeUInt32BE(data.length);
    const all = Buffer.concat([Buffer.from(type), data]);
    const sum = Buffer.alloc(4); sum.writeUInt32BE(crc(all));
    return Buffer.concat([len, all, sum]);
  };
  const ihdr = Buffer.alloc(13); ihdr.writeUInt32BE(32, 0); ihdr.writeUInt32BE(32, 4); ihdr[8] = 8; ihdr[9] = 2;
  const row = Buffer.concat([Buffer.from([0]), Buffer.alloc(96, shade)]);
  return Buffer.concat([
    Buffer.from([0x89, 0x50, 0x4e, 0x47, 0x0d, 0x0a, 0x1a, 0x0a]),
    chunk('IHDR', ihdr), chunk('IDAT', zlib.deflateSync(Buffer.concat(Array(32).fill(row)))), chunk('IEND', Buffer.alloc(0)),
  ]);
}

function imageMessage(shade) {
  const form = new FormData();
  form.append('clientId', randomUUID());
  form.append('image', new Blob([plainPng(shade)], { type: 'image/png' }), 'x.png');
  return form;
}

// Mọi mục của hàng đợi (đi qua các trang).
async function queue(token, status) {
  const items = [];
  for (let page = 1; page < 50; page++) {
    const r = await call('GET', `admin/reports?status=${status}&limit=50&page=${page}`, token);
    items.push(...(r.body?.data ?? []));
    if (!r.body?.meta || page >= r.body.meta.totalPages) break;
  }
  return items;
}

const db = new Client({ connectionString: DB });
const ids = {};

async function seed() {
  const hash = await bcrypt.hash(PASSWORD, 10);
  for (const n of ['admin', 'a', 'b', 'c', 'd']) {
    ids[n] = randomUUID();
    await db.query(
      `INSERT INTO "User"(id, username, email, "passwordHash", "emailVerifiedAt", "birthDate", role, "createdAt", "updatedAt")
       VALUES ($1, $2, $3, $4, now(), '1990-01-01', $5, now(), now())`,
      [ids[n], `b4test_${n}`, `b4test_${n}@example.invalid`, hash, n === 'admin' ? 'ADMIN' : 'USER'],
    );
  }
}

async function clean() {
  const all = await db.query(
    `SELECT id FROM "User" WHERE username LIKE 'b4test\\_%' OR email LIKE 'b4test\\_%@example.invalid' OR id = ANY($1)`,
    [Object.values(ids)],
  );
  const userIds = all.rows.map((row) => row.id);
  await db.query(`DELETE FROM "AuditLog" WHERE "actorId" = ANY($1) OR "targetId" = ANY($1)`, [userIds]);
  await db.query(`DELETE FROM "User" WHERE id = ANY($1)`, [userIds]);
}

(async () => {
  await db.connect();
  await clean();
  await seed();
  try {
    await run();
  } finally {
    await clean();
    await db.end();
  }
  console.log(`\n${passed} passed, ${failed} failed`);
  process.exit(failed ? 1 : 0);
})().catch((e) => { console.error(e); process.exit(1); });

async function run() {
  const admin = await login('admin');
  const a = await login('a');
  const b = await login('b');
  const c = await login('c');
  const d = await login('d');
  check('login admin, a, b, c, d', Boolean(admin.token && a.token && b.token && c.token && d.token), a.raw);

  // ── trang và quyền ────────────────────────────────────────────────────────
  let r = await fetch(`${BASE}/admin`);
  const html = await r.text();
  check('admin page served with the new tabs', r.status === 200 && html.includes('data-tab="audit"') && html.includes('data-tab="closed"'), r.status);
  r = await call('GET', 'admin/audit', a.token);
  check('non-admin gets 403 on /admin/audit', r.status === 403, r);

  // ── dữ liệu bị báo cáo ────────────────────────────────────────────────────
  r = await call('POST', 'posts', a.token, undefined, textPost('b4 post'));
  const postId = r.body?.data?.id;
  check('a creates a post', r.status === 201 && postId, r);
  r = await call('POST', `posts/${postId}/comments`, b.token, { content: 'b4 comment' });
  const commentId = r.body?.data?.id;
  check('b comments on it', r.status === 201 && commentId, r);
  r = await call('POST', `comments/${commentId}/replies`, c.token, { content: 'b4 reply' });
  check('c replies to the comment', r.status === 201, r);
  await call('POST', `posts/${postId}/comments`, d.token, { content: 'd comment, gone after delete' });

  // POST: 2 người báo SPAM; COMMENT: 1 người báo SCAM; USER d: 1 người báo SPAM (mới hơn).
  await call('POST', 'reports', b.token, { targetType: 'POST', targetId: postId, reason: 'SPAM' });
  await call('POST', 'reports', c.token, { targetType: 'POST', targetId: postId, reason: 'SPAM', note: 'ghi chú c' });
  await call('POST', 'reports', a.token, { targetType: 'COMMENT', targetId: commentId, reason: 'SCAM' });
  await call('POST', 'reports', a.token, { targetType: 'USER', targetId: ids.d, reason: 'SPAM' });

  let items = (await queue(admin.token, 'OPEN')).filter((item) => [postId, commentId, ids.d].includes(item.targetId));
  check('queue: one item per target', items.length === 3, items.map((i) => i.targetId));
  check('queue order: SCAM comment, then post with 2 reporters, then user', items.map((i) => i.targetType).join() === 'COMMENT,POST,USER', items.map((i) => i.targetType));
  const postItem = items.find((i) => i.targetType === 'POST');
  check('grouped item carries count, severity and every report', postItem?.reportCount === 2 && postItem.severity === 6 && postItem.reports?.length === 2 && postItem.reports.some((x) => x.note === 'ghi chú c'), postItem);
  // CHILD_SAFETY is severity 1; none is reported here, so SCAM (2) leads.
  check('SCAM leads the queue at severity 2', items[0]?.severity === 2, items[0]);

  // ── hội thoại: danh tính chỉ lộ khi có lý do ──────────────────────────────
  await call('POST', `users/${ids.a}/follow`, d.token);
  r = await call('POST', 'conversations', a.token, { userId: ids.d });
  const conversationId = r.body?.data?.id;
  await call('POST', `conversations/${conversationId}/messages`, a.token, { content: 'chào d', clientId: randomUUID() });
  await call('POST', `conversations/${conversationId}/messages`, d.token, { content: 'chuyển tiền cho tôi', clientId: randomUUID() });
  r = await call('POST', `conversations/${conversationId}/messages`, d.token, undefined, imageMessage(0x70));
  check('d sends an image (kept as evidence)', r.status === 201 && r.body?.data?.imageUrl, r);
  r = await call('POST', 'reports', a.token, { targetType: 'CONVERSATION', targetId: conversationId, reason: 'SCAM' });
  check('a reports the conversation', r.status === 201, r);
  r = await call('POST', `conversations/${conversationId}/messages`, d.token, undefined, imageMessage(0x30));
  check('d sends a second image after the report', r.status === 201, r);
  r = await call('GET', `conversations/${conversationId}/messages`, a.token);
  const laterImageUrl = r.body?.data?.find((m) => m.imageUrl)?.imageUrl;

  items = (await queue(admin.token, 'OPEN')).filter((item) => item.targetId === conversationId);
  const convItem = items[0];
  const listText = JSON.stringify(convItem ?? {});
  check('conversation item hides identity and snapshot', convItem && convItem.target?.identityHidden === true && !listText.includes(ids.d) && !listText.includes('chuyển tiền') && convItem.target.messageCount === 3, convItem);

  r = await call('POST', `admin/reports/${convItem?.id}/identity`, admin.token, {});
  check('viewing identity without a reason is refused', r.status === 400, r);
  r = await call('POST', `admin/reports/${convItem?.id}/identity`, admin.token, { reason: 'Kiểm tra lừa đảo' });
  check('viewing identity with a reason returns snapshot and real author', r.status === 201 && r.body?.data?.author?.id === ids.d && r.body.data.messages?.length === 3, r);
  r = await call('GET', 'admin/audit?limit=50', admin.token);
  let audit = r.body?.data ?? [];
  check('VIEW_IDENTITY written with actor and reason', audit.some((x) => x.action === 'VIEW_IDENTITY' && x.actorId === ids.admin && x.targetId === conversationId && x.reason === 'Kiểm tra lừa đảo' && x.actor?.id === ids.admin), audit.slice(0, 3));

  // ── gỡ / khôi phục bình luận ──────────────────────────────────────────────
  r = await call('GET', `posts/${postId}`, a.token);
  const countBefore = (r.body?.data ?? r.body)?.commentsCount; // GET /posts/:id is not wrapped in data
  r = await call('GET', 'notifications?limit=50', a.token);
  check('a has the COMMENT notification before removal', (r.body?.data ?? []).some((n) => n.comment?.id === commentId), r.body?.data?.length);
  const commentItem = (await queue(admin.token, 'OPEN')).find((i) => i.targetId === commentId);
  r = await call('POST', `admin/reports/${commentItem?.id}/resolve`, admin.token, { action: 'REMOVE_CONTENT', reason: 'lừa đảo' });
  check('REMOVE_CONTENT on a comment', r.status === 201, r);
  let row = await db.query('SELECT "removedAt" FROM "Comment" WHERE id = $1', [commentId]);
  check('comment kept with removedAt', row.rows[0]?.removedAt instanceof Date, row.rows);
  r = await call('GET', `posts/${postId}/comments`, c.token);
  check('removed comment hidden from the thread', r.status === 200 && !(r.body?.data ?? []).some((x) => x.id === commentId), r.body);
  r = await call('GET', `comments/${commentId}/replies`, c.token);
  check('replies of a removed comment: 404', r.status === 404, r);
  r = await call('POST', `comments/${commentId}/replies`, c.token, { content: 'x' });
  check('replying to a removed comment: 404', r.status === 404, r);
  r = await call('GET', `posts/${postId}`, a.token);
  check('post commentsCount ignores the removed comment and its reply', countBefore === 3 && r.body?.commentsCount === 1, [countBefore, r.body?.commentsCount]);
  r = await call('GET', 'notifications?limit=50', a.token);
  check('notification about the removed comment hidden', !(r.body?.data ?? []).some((n) => n.comment?.id === commentId), r.body?.data);

  items = await queue(admin.token, 'CLOSED');
  const closed = items.find((i) => i.targetId === commentId);
  check('closed tab lists the resolved comment with removedAt', closed?.status === 'RESOLVED' && closed.target?.removedAt, closed);

  r = await call('POST', `admin/comments/${commentId}/restore`, admin.token, {});
  check('restore comment', r.status === 201, r);
  r = await call('GET', `posts/${postId}/comments`, c.token);
  check('restored comment visible again', (r.body?.data ?? []).some((x) => x.id === commentId && x.repliesCount === 1), r.body);
  r = await call('POST', `admin/comments/${commentId}/restore`, admin.token, {});
  check('restoring a visible comment: 404', r.status === 404, r);

  // ── các thao tác khác đều ghi nhật ký ─────────────────────────────────────
  await call('POST', `admin/users/${ids.c}/ban`, admin.token, { reason: 'thử' });
  await call('DELETE', `admin/users/${ids.c}/ban`, admin.token);
  await call('DELETE', `admin/users/${ids.c}/anonymous`, admin.token);
  await call('POST', `admin/users/${ids.c}/anonymous`, admin.token);
  await db.query(`UPDATE "User" SET "ageLockedAt" = now() WHERE id = $1`, [ids.c]);
  await call('DELETE', `admin/users/${ids.c}/age-lock`, admin.token);
  const userItem = (await queue(admin.token, 'OPEN')).find((i) => i.targetId === ids.d);
  await call('POST', `admin/reports/${userItem?.id}/resolve`, admin.token, { action: 'DISMISS' });
  r = await call('GET', 'admin/audit?limit=50', admin.token);
  audit = r.body?.data ?? [];
  const actions = new Set(audit.filter((x) => x.actorId === ids.admin).map((x) => x.action));
  const expected = ['VIEW_IDENTITY', 'REPORT_REMOVE_CONTENT', 'COMMENT_RESTORE', 'BAN', 'UNBAN', 'ANONYMOUS_SUSPEND', 'ANONYMOUS_RESTORE', 'AGE_UNLOCK', 'REPORT_DISMISS'];
  check('audit has a row for every admin action', expected.every((x) => actions.has(x)), [...actions]);
  check('ban row keeps the given reason', audit.some((x) => x.action === 'BAN' && x.reason === 'thử'), null);
  check('resolve row falls back to the report reason', audit.some((x) => x.action === 'REPORT_DISMISS' && x.reason === 'Báo cáo: SPAM'), null);
  r = await call('GET', 'admin/audit?limit=2&page=1', admin.token);
  check('audit is paged', r.body?.data?.length === 2 && r.body.meta?.total >= 9, r.body?.meta);

  // ── xóa tài khoản d ───────────────────────────────────────────────────────
  await call('POST', `users/${ids.d}/follow`, a.token);
  r = await call('DELETE', 'users/me', d.token, { password: 'sai' });
  check('delete with a wrong password: 400', r.status === 400, r);
  r = await call('DELETE', 'users/me', d.token, { password: PASSWORD });
  check('delete account', r.status === 200 && r.body?.data?.deleted === true, r);

  row = await db.query('SELECT * FROM "User" WHERE id = $1', [ids.d]);
  const tomb = row.rows[0];
  check('user row kept as a tombstone', tomb && tomb.deletedAt instanceof Date && tomb.tokenVersion === 1, tomb);
  check('personal data cleared', tomb && tomb.username.startsWith('deleted_') && tomb.email === `deleted+${ids.d}@deleted.invalid` && tomb.passwordHash === null && tomb.googleId === null && tomb.birthDate === null && tomb.bio === null && tomb.avatarUrl === null && tomb.displayName === 'Người dùng đã xóa', tomb);
  row = await db.query(
    `SELECT (SELECT count(*) FROM "Comment" WHERE "userId" = $1) comments,
            (SELECT count(*) FROM "Follow" WHERE "followerId" = $1 OR "followingId" = $1) follows,
            (SELECT count(*) FROM "Message" WHERE "senderId" = $1 AND (content IS NOT NULL OR "imageUrl" IS NOT NULL)) messages,
            (SELECT count(*) FROM "Conversation" WHERE id = $2) conversations,
            (SELECT count(*) FROM "Report" WHERE "targetId" = $2 AND snapshot IS NOT NULL) reports`,
    [ids.d, conversationId],
  );
  const counts = row.rows[0];
  check('comments and follows gone, messages emptied, conversation and report kept',
    counts.comments === '0' && counts.follows === '0' && counts.messages === '0' && counts.conversations === '1' && counts.reports === '1', counts);

  r = await call('GET', 'conversations', a.token);
  const conv = (r.body?.data ?? []).find((x) => x.id === conversationId);
  check('conversation list shows "Người dùng đã xóa"', conv?.peer?.displayName === 'Người dùng đã xóa', conv);
  r = await call('GET', `conversations/${conversationId}/messages`, a.token);
  const fromD = (r.body?.data ?? []).filter((m) => m.senderId === ids.d);
  check('d\'s messages read "Tin nhắn đã bị xóa" with no image', fromD.length === 3 && fromD.every((m) => m.deleted === true && m.content === 'Tin nhắn đã bị xóa' && m.imageUrl === null), fromD);
  check('a\'s own message untouched', (r.body?.data ?? []).some((m) => m.senderId === ids.a && m.content === 'chào d' && !m.deleted), null);

  r = await call('POST', `admin/reports/${convItem?.id}/identity`, admin.token, { reason: 'Kiểm tra sau khi xóa' });
  const evidence = r.body?.data?.messages?.find((m) => m.imageUrl)?.imageUrl;
  const evidenceFile = evidence ? await fetch(evidence) : null;
  check('image in the open report snapshot still downloadable', evidenceFile?.status === 200, [r.status, evidence, evidenceFile?.status]);
  const laterFile = laterImageUrl ? await fetch(laterImageUrl) : null;
  check('image sent after the report deleted from storage', laterFile && laterFile.status >= 400, [laterImageUrl, laterFile?.status]);

  r = await call('POST', 'auth/login', null, { email: 'b4test_d@example.invalid', password: PASSWORD });
  check('login with the old email refused', r.status === 401, r);
  r = await call('POST', 'auth/login', null, { email: tomb?.email, password: PASSWORD });
  check('login with the rewritten email refused', r.status === 401, r);
  r = await call('POST', 'auth/register', null, { username: 'b4test_d2', email: 'b4test_d@example.invalid', password: PASSWORD, birthDate: '1990-01-01' });
  check('same email can register again', r.status === 201, r);
  r = await call('GET', 'users/me', d.token);
  console.log(`INFO  old token after delete -> ${r.status} (401 once B1's JwtStrategy checks deletedAt / tokenVersion)`);
}
