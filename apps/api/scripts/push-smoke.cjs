// Kiểm tra push (2026-11-01): dọn token Expo báo DeviceNotRegistered, không push cho tài khoản
// đã xóa / bị khóa, kênh Android "default"; và phân trang thông báo + tìm người dùng.
// Script tự chạy một máy chủ Expo giả trên PUSH_PORT; API phải được khởi động với
// EXPO_PUSH_URL=http://localhost:<PUSH_PORT>/push. Tự tạo và xóa người dùng b5test_*.
//
//   EXPO_PUSH_URL=http://localhost:3955/push PORT=3005 ... corepack pnpm start:dev
//   API=http://localhost:3005/api DIRECT_URL=postgresql://... node scripts/push-smoke.cjs
const path = require('node:path');
require('dotenv').config({ path: path.join(__dirname, '..', '.env') });
const http = require('node:http');
const { Client } = require('pg');
const bcrypt = require('bcrypt');
const { randomUUID } = require('node:crypto');

const BASE = process.env.API ?? 'http://localhost:3000/api';
const PUSH_PORT = Number(process.env.PUSH_PORT ?? 3955);
const PASSWORD = 'Passw0rd!b5';
let failed = 0;
let passed = 0;

function check(name, ok, detail) {
  if (ok) passed++;
  else failed++;
  console.log(`${ok ? 'PASS' : 'FAIL'}  ${name}${ok ? '' : '  -> ' + JSON.stringify(detail)?.slice(0, 400)}`);
}

async function call(method, urlPath, token, body) {
  const headers = {};
  if (token) headers.Authorization = `Bearer ${token}`;
  if (body !== undefined) headers['Content-Type'] = 'application/json';
  const res = await fetch(`${BASE}/${urlPath}`, { method, headers, body: body === undefined ? undefined : JSON.stringify(body) });
  const text = await res.text();
  let json = null;
  try { json = text ? JSON.parse(text) : null; } catch { json = text; }
  return { status: res.status, body: json };
}

const wait = (ms) => new Promise((resolve) => setTimeout(resolve, ms));

// Expo giả: token có "DEAD" nhận lỗi DeviceNotRegistered, còn lại "ok".
const received = [];
const server = http.createServer((req, res) => {
  let raw = '';
  req.on('data', (chunk) => (raw += chunk));
  req.on('end', () => {
    const messages = JSON.parse(raw || '[]');
    received.push(...messages);
    res.setHeader('Content-Type', 'application/json');
    res.end(JSON.stringify({
      data: messages.map((m) => (m.to.includes('DEAD')
        ? { status: 'error', message: 'not registered', details: { error: 'DeviceNotRegistered' } }
        : { status: 'ok', id: randomUUID() })),
    }));
  });
});

(async () => {
  await new Promise((resolve) => server.listen(PUSH_PORT, resolve));
  const db = new Client({ connectionString: process.env.DIRECT_URL });
  await db.connect();

  try {
    await db.query(`DELETE FROM "User" WHERE username LIKE 'b5test\\_%'`);
    const hash = await bcrypt.hash(PASSWORD, 10);
    for (const n of ['a', 'b', 'c', 'd']) {
      await db.query(
        `INSERT INTO "User"(id, username, email, "passwordHash", "emailVerifiedAt", "birthDate", "onboardedAt", "createdAt", "updatedAt")
         VALUES ($1,$2,$3,$4, now(), '1990-01-01', now(), now(), now())`,
        [randomUUID(), `b5test_${n}`, `b5test_${n}@example.invalid`, hash],
      );
    }

    const login = async (n) => {
      const r = await call('POST', 'auth/login', null, { email: `b5test_${n}@example.invalid`, password: PASSWORD });
      return { token: r.body?.data?.accessToken, id: r.body?.data?.user?.id };
    };
    const [a, b, c, d] = [await login('a'), await login('b'), await login('c'), await login('d')];
    check('login a, b, c, d', Boolean(a.token && b.token && c.token && d.token), null);

    const live = 'ExponentPushToken[b5test-live-b]';
    const dead = 'ExponentPushToken[b5test-DEAD-b]';
    for (const [user, token] of [[b, live], [b, dead], [c, 'ExponentPushToken[b5test-c]'], [d, 'ExponentPushToken[b5test-d]']]) {
      await call('POST', 'notifications/devices', user.token, { platform: 'android', token });
    }

    // a theo dõi b: một push tới mỗi máy của b, token chết bị xóa.
    received.length = 0;
    const follow = await call('POST', `users/${b.id}/follow`, a.token);
    check('a follows b', follow.status < 300, follow);
    await wait(800);
    const toB = received.filter((m) => m.to === live || m.to === dead);
    check('push sent to both of b\'s devices', toB.length === 2, received);
    check('push carries channelId default and FOLLOW data', toB.every((m) => m.channelId === 'default' && m.data?.type === 'FOLLOW' && m.data?.actorId === a.id), toB);
    const tokens = (await db.query(`SELECT token FROM "DeviceToken" WHERE "userId" = $1`, [b.id])).rows.map((r) => r.token);
    check('DeviceNotRegistered token deleted, live token kept', tokens.length === 1 && tokens[0] === live, tokens);

    // Tài khoản đã xóa / bị khóa: không push.
    await db.query(`UPDATE "User" SET "deletedAt" = now() WHERE id = $1`, [c.id]);
    await db.query(`UPDATE "User" SET "bannedAt" = now() WHERE id = $1`, [d.id]);
    received.length = 0;
    const followC = await call('POST', `users/${c.id}/follow`, a.token);
    const followD = await call('POST', `users/${d.id}/follow`, a.token);
    await wait(800);
    // Banned / deleted targets may also refuse the follow; either way nothing may reach their devices.
    check('no push to a deleted or banned user', !received.some((m) => m.to.includes('b5test-c') || m.to.includes('b5test-d')), { received, c: followC.status, d: followD.status });
    console.log(`      (follow deleted: ${followC.status}, follow banned: ${followD.status})`);
    await db.query(`UPDATE "User" SET "deletedAt" = NULL, "bannedAt" = NULL WHERE id = ANY($1)`, [[c.id, d.id]]);

    // Phân trang thông báo: c và d cũng theo dõi b.
    await call('POST', `users/${b.id}/follow`, c.token);
    await call('POST', `users/${b.id}/follow`, d.token);
    const p1 = await call('GET', 'notifications?page=1&limit=2', b.token);
    const p2 = await call('GET', 'notifications?page=2&limit=2', b.token);
    check('notifications page 1 has 2 items and total 3', p1.body?.data?.length === 2 && p1.body?.meta?.total === 3 && p1.body?.meta?.totalPages === 2, p1.body?.meta);
    check('notifications page 2 has the 3rd item', p2.body?.data?.length === 1 && !p1.body.data.some((n) => n.id === p2.body.data[0].id), p2.body);
    check('unreadCount counts every page', p1.body?.meta?.unreadCount === 3, p1.body?.meta);

    // Phân trang tìm người dùng.
    const s1 = await call('GET', 'users/search?q=b5test_&page=1&limit=3', a.token);
    const s2 = await call('GET', 'users/search?q=b5test_&page=2&limit=3', a.token);
    check('user search page 1: 3 of 4', s1.body?.data?.length === 3 && s1.body?.meta?.totalPages === 2, s1.body?.meta);
    check('user search page 2: the 4th, no repeat', s2.body?.data?.length === 1 && !s1.body.data.some((u) => u.id === s2.body.data[0].id), s2.body);
  } finally {
    await db.query(`DELETE FROM "User" WHERE username LIKE 'b5test\\_%'`);
    await db.end();
    server.close();
  }

  console.log(`\n${passed} passed, ${failed} failed`);
  process.exit(failed ? 1 : 0);
})().catch((error) => {
  console.error(error);
  process.exit(1);
});
