// Kiểm tra đợt 2026-11-01 (B3: hiển thị nội dung và riêng tư) trên API thật:
// ẩn nội dung của tài khoản bị khóa, nhắc tên chỉ báo cho người xem được bài, tắt tiếng,
// ảnh bài viết nhạy cảm, tệp bài viết/tin vào bucket riêng tư (URL có chữ ký).
//
//   API=http://localhost:3003/api node scripts/visibility-smoke.cjs
//
// Tự tạo và tự xóa tài khoản thử b3test_* (DATABASE_URL/DIRECT_URL). Không đụng tài khoản khác.
const path = require('node:path');
require('dotenv').config({ path: path.join(__dirname, '..', '.env') });
const { Client } = require('pg');
const bcrypt = require('bcrypt');
const { randomUUID } = require('node:crypto');

const BASE = process.env.API ?? 'http://localhost:3000/api';
const PASSWORD = 'Passw0rd!b3';
const stamp = Date.now().toString(36);
let failed = 0;
let passed = 0;
let db;

function check(name, ok, detail) {
  if (ok) passed++; else failed++;
  console.log(`${ok ? 'PASS' : 'FAIL'}  ${name}${ok ? '' : '  -> ' + JSON.stringify(detail)?.slice(0, 400)}`);
}

const sql = (text, params) => db.query(text, params);

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
  const r = await call('POST', 'auth/login', null, { email: `b3test_${name}@example.invalid`, password: PASSWORD });
  if (!r.body?.data?.accessToken) throw new Error(`login ${name} failed: ${JSON.stringify(r.body)}`);
  return { token: r.body.data.accessToken, id: r.body.data.user.id };
}

async function upload(token, kind, mimeType, bytes) {
  const r = await call('POST', 'media/upload-url', token, { kind, mimeType, sizeBytes: bytes.length });
  const put = await fetch(r.body.data.uploadUrl, { method: 'PUT', headers: r.body.data.headers, body: bytes });
  return { key: r.body.data.storageKey, uploadUrl: r.body.data.uploadUrl, putStatus: put.status };
}

// PNG hợp lệ 32x32 một màu.
function plainPng() {
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
  const row = Buffer.concat([Buffer.from([0]), Buffer.alloc(96, 0x70)]);
  const raw = Buffer.concat(Array.from({ length: 32 }, () => row));
  return Buffer.concat([
    Buffer.from([0x89, 0x50, 0x4e, 0x47, 0x0d, 0x0a, 0x1a, 0x0a]),
    chunk('IHDR', ihdr), chunk('IDAT', zlib.deflateSync(raw)), chunk('IEND', Buffer.alloc(0)),
  ]);
}

function imageForm(fields, images) {
  const form = new FormData();
  Object.entries(fields).forEach(([key, value]) => form.append(key, value));
  images.forEach((bytes, i) => form.append('images', new Blob([bytes], { type: 'image/png' }), `x${i}.png`));
  return form;
}

const ids = (list) => (list ?? []).map((item) => item.id);
const feedPostIds = async (token) => ids((await call('GET', 'posts/feed?page=1&limit=50', token)).body?.data);
const trayAuthorIds = async (token) => ((await call('GET', 'stories/feed', token)).body?.data ?? []).map((g) => g.author.id);
const reelIds = async (token) => ids((await call('GET', 'reels/feed?limit=20', token)).body?.data);

(async () => {
  db = new Client({ connectionString: process.env.DATABASE_URL || process.env.DIRECT_URL });
  await db.connect();
  const hash = await bcrypt.hash(PASSWORD, 10);
  const userIds = {};
  for (const n of ['a', 'b', 'c', 'd']) {
    userIds[n] = randomUUID();
    await sql(
      `INSERT INTO "User"(id, username, email, "passwordHash", "emailVerifiedAt", "birthDate", "onboardedAt", "createdAt", "updatedAt")
       VALUES ($1,$2,$3,$4, now(), '1990-01-01', now(), now(), now())`,
      [userIds[n], `b3test_${n}`, `b3test_${n}@example.invalid`, hash],
    );
  }
  // a <-> b là bạn (theo dõi hai chiều); a theo dõi c; d không quen ai.
  for (const [f, t] of [['a', 'b'], ['b', 'a'], ['a', 'c']]) {
    await sql(`INSERT INTO "Follow"("followerId", "followingId") VALUES ($1, $2)`, [userIds[f], userIds[t]]);
  }

  const a = await login('a');
  const b = await login('b');
  const c = await login('c');
  const d = await login('d');
  const png = plainPng();

  // --- Ảnh bài viết: chấm nhạy cảm + bucket riêng tư ---
  let r = await call('POST', 'posts', b.token, null, imageForm({ content: `b3 plain ${stamp}`, privacy: 'PUBLIC' }, [png]));
  const plainPost = r.body?.data;
  const plainUrl = plainPost?.media?.[0]?.url ?? '';
  check('post image upload returns sensitive=false for a plain image', r.status === 201 && plainPost.media[0].sensitive === false, r.body);
  check('post image url is signed and in the private bucket', /X-Amz-Signature=/.test(plainUrl) && /-private\//.test(plainUrl), plainUrl);
  check('signed post image url is readable', (await fetch(plainUrl)).status === 200, plainUrl);
  const bareUrl = plainUrl.split('?')[0];
  check('bare (unsigned) post image url is refused', (await fetch(bareUrl)).status >= 400, bareUrl);
  const publicCopy = bareUrl.replace('-private/', '/');
  check('same key is not in the public bucket', (await fetch(publicCopy)).status >= 400, publicCopy);

  r = await call('POST', 'posts', b.token, null, imageForm({ content: `b3 broken ${stamp}` }, [Buffer.from('not really a png')]));
  check('unreadable image is stored as sensitive=true', r.status === 201 && r.body.data.media[0].sensitive === true, r.body);

  r = await call('PATCH', `posts/${plainPost.id}`, b.token, null, imageForm({ keepMediaIds: JSON.stringify([plainPost.media[0].id]) }, [Buffer.from('broken again')]));
  check('edit adds a new image with its own sensitive flag', r.status === 200 && r.body.data.media.length === 2 && r.body.data.media[1].sensitive === true && /X-Amz-Signature=/.test(r.body.data.media[1].url), r.body);

  r = await call('GET', `posts/${plainPost.id}`, a.token);
  check('post detail returns sensitive on media', r.body?.media?.every((m) => typeof m.sensitive === 'boolean'), r.body);

  // --- Video bài viết và tin: tải thẳng lên bucket riêng tư ---
  const video = await upload(b.token, 'video', 'video/mp4', Buffer.alloc(2048, 1));
  const thumb = await upload(b.token, 'thumbnail', 'image/png', png);
  check('presigned upload url targets the private bucket', /-private\//.test(video.uploadUrl) && video.putStatus === 200, video);
  r = await call('POST', 'posts/media', b.token, {
    content: `b3 video ${stamp}`, privacy: 'PUBLIC',
    media: [{ type: 'VIDEO', storageKey: video.key, thumbnailKey: thumb.key, width: 720, height: 1280, durationMs: 5000 }],
  });
  const videoPost = r.body?.data;
  check('video post url and thumbnail are signed', r.status === 201 && /X-Amz-Signature=/.test(videoPost.media[0].url) && /X-Amz-Signature=/.test(videoPost.media[0].thumbnailUrl), r.body);
  check('signed video thumbnail is readable', (await fetch(videoPost.media[0].thumbnailUrl)).status === 200);

  const storyImage = await upload(b.token, 'image', 'image/png', png);
  r = await call('POST', 'stories', b.token, { type: 'IMAGE', storageKey: storyImage.key });
  check('story url is signed', r.status === 201 && /X-Amz-Signature=/.test(r.body.data.url), r.body);
  const cStoryImage = await upload(c.token, 'image', 'image/png', png);
  await call('POST', 'stories', c.token, { type: 'IMAGE', storageKey: cStoryImage.key });

  // --- Mute ---
  check('before mute: b post in a feed', (await feedPostIds(a.token)).includes(plainPost.id));
  check('before mute: b story in a tray', (await trayAuthorIds(a.token)).includes(b.id));
  check('before mute: b video in a reels', (await reelIds(a.token)).includes(videoPost.id));
  r = await call('POST', `users/${a.id}/mute`, a.token);
  check('cannot mute yourself', r.status === 400, r);
  r = await call('POST', `users/${randomUUID()}/mute`, a.token);
  check('mute unknown user is 404', r.status === 404, r);
  r = await call('POST', `users/${b.id}/mute`, a.token);
  check('mute b', r.status === 201 && r.body?.data?.isMuted === true, r);
  r = await call('POST', `users/${b.id}/mute`, a.token);
  check('mute is idempotent', r.status === 201, r);
  r = await call('GET', 'users/me/muted', a.token);
  check('muted list contains b', r.status === 200 && ids(r.body?.data).includes(b.id) && r.body.data[0].username === 'b3test_b', r.body);
  r = await call('GET', `users/${b.id}`, a.token);
  check('profile says isMuted=true', r.body?.data?.isMuted === true, r.body);
  check('after mute: b post gone from a feed', !(await feedPostIds(a.token)).includes(plainPost.id));
  check('after mute: b story gone from a tray', !(await trayAuthorIds(a.token)).includes(b.id));
  check('after mute: b video gone from a reels', !(await reelIds(a.token)).includes(videoPost.id));
  r = await call('GET', `users/${b.id}/posts?page=1&limit=20`, a.token);
  const onProfile = (r.body?.data ?? []).find((p) => p.id === plainPost.id);
  check('after mute: b post still on b profile, isAuthorMuted=true', onProfile?.isAuthorMuted === true, r.body);
  r = await call('GET', `users/${a.id}`, b.token);
  check('muted user is not told (b sees a profile without mute info)', r.body?.data?.isMuted === false, r.body);
  const muteNotes = await sql(`SELECT count(*)::int AS n FROM "Notification" WHERE "recipientId" = $1 AND "actorId" = $2`, [b.id, a.id]);
  check('muted user gets no notification', muteNotes.rows[0].n === 0, muteNotes.rows);
  r = await call('DELETE', `users/${b.id}/mute`, a.token);
  check('unmute b', r.status === 200 && r.body?.data?.isMuted === false, r);
  check('after unmute: b post back in a feed', (await feedPostIds(a.token)).includes(plainPost.id));

  // --- Mentions ---
  r = await call('POST', 'posts', b.token, null, imageForm({ content: `b3 friends @b3test_a @b3test_d ${stamp}`, privacy: 'FRIENDS' }, []));
  const friendsPost = r.body?.data;
  const mentionsOf = async (userId) => (await sql(`SELECT count(*)::int AS n FROM "Notification" WHERE type = 'MENTION' AND "recipientId" = $1 AND "postId" = $2`, [userId, friendsPost.id])).rows[0].n;
  check('mention: friend who can see the FRIENDS post is notified', (await mentionsOf(a.id)) === 1);
  check('mention: stranger who cannot see the FRIENDS post is not notified', (await mentionsOf(d.id)) === 0);
  r = await call('POST', `posts/${friendsPost.id}/comments`, b.token, { content: `hi @b3test_d ${stamp}` });
  const commentMentions = (await sql(`SELECT count(*)::int AS n FROM "Notification" WHERE type = 'MENTION' AND "recipientId" = $1`, [d.id])).rows[0].n;
  check('mention in a comment on a post d cannot see: d not notified', commentMentions === 0, r);

  // --- POST /interactions ---
  const event = (postId) => ({ eventId: randomUUID(), eventType: 'VIEW', postId, surface: 'reels' });
  r = await call('POST', 'interactions', d.token, { events: [event(friendsPost.id), event(videoPost.id)] });
  const rows = await sql(`SELECT "postId" FROM "ContentInteraction" WHERE "userId" = $1`, [d.id]);
  const recorded = rows.rows.map((row) => row.postId);
  check('interactions: visible post recorded, invisible post ignored', r.status === 204 && recorded.includes(videoPost.id) && !recorded.includes(friendsPost.id), { status: r.status, recorded });

  // --- Tài khoản bị khóa / khóa tuổi / đã xóa ---
  r = await call('POST', 'posts', c.token, null, imageForm({ content: `b3banned ${stamp}` }, []));
  const cPost = r.body?.data;
  const cVideo = await upload(c.token, 'video', 'video/mp4', Buffer.alloc(2048, 2));
  const cReel = (await call('POST', 'posts/media', c.token, { content: `b3 c reel ${stamp}`, media: [{ type: 'VIDEO', storageKey: cVideo.key, width: 720, height: 1280, durationMs: 4000 }] })).body?.data;
  check('active c: post in feed, search, story tray, user search', (await feedPostIds(a.token)).includes(cPost.id)
    && ids((await call('GET', `posts/search?q=b3banned ${stamp}`, a.token)).body?.data).includes(cPost.id)
    && (await trayAuthorIds(a.token)).includes(c.id)
    && ids((await call('GET', 'users/search?q=b3test_c', a.token)).body?.data).includes(c.id));

  for (const column of ['bannedAt', 'ageLockedAt', 'deletedAt']) {
    await sql(`UPDATE "User" SET "${column}" = now() WHERE id = $1`, [c.id]);
    check(`${column}: c post gone from feed`, !(await feedPostIds(a.token)).includes(cPost.id));
    check(`${column}: c post gone from post search`, !ids((await call('GET', `posts/search?q=b3banned ${stamp}`, a.token)).body?.data).includes(cPost.id));
    check(`${column}: c gone from user search`, !ids((await call('GET', 'users/search?q=b3test_c', a.token)).body?.data).includes(c.id));
    check(`${column}: c story gone from tray`, !(await trayAuthorIds(a.token)).includes(c.id));
    check(`${column}: c reel gone from reels`, !(await reelIds(a.token)).includes(cReel.id));
    r = await call('GET', `users/${c.id}`, a.token);
    check(`${column}: c profile is 404`, r.status === 404, r);
    r = await call('GET', `users/${c.id}/posts?page=1&limit=20`, a.token);
    check(`${column}: c profile posts empty`, (r.body?.data ?? []).length === 0, r.body);
    r = await call('GET', `posts/${cPost.id}`, a.token);
    check(`${column}: c post detail is 404`, r.status === 404, r);
    r = await call('POST', `users/${c.id}/mute`, a.token);
    check(`${column}: cannot mute c`, r.status === 404, r);
    await sql(`UPDATE "User" SET "${column}" = NULL WHERE id = $1`, [c.id]);
  }
  check('c restored: post back in feed', (await feedPostIds(a.token)).includes(cPost.id));
})()
  .catch((error) => { failed++; console.error(error); })
  .finally(async () => {
    if (db) {
      const r = await db.query(`DELETE FROM "User" WHERE username LIKE 'b3test\\_%'`).catch((e) => ({ rowCount: e.message }));
      console.log('cleanup: deleted b3test users', r.rowCount);
      await db.end();
    }
    console.log(`\n${passed} passed, ${failed} failed`);
    process.exit(failed ? 1 : 0);
  });
