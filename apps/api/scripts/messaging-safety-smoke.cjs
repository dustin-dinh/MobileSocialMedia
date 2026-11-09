// Kiểm tra an toàn tin nhắn (2026-11-01): push không lộ nội dung tin chờ / tin ẩn danh, người nhận đã xóa
// tin chờ không bị làm phiền, tắt tin ẩn danh chặn hội thoại ẩn danh mở từ trang cá nhân (trả lời story
// ẩn danh chỉ theo cài đặt của story, DEC-025),
// "Ai được nhắn tin cho tôi" (messagePermission), giới hạn tin nhắn chờ mới mỗi ngày.
// Script tự chạy một máy chủ Expo giả trên PUSH_PORT; API phải được khởi động với
// EXPO_PUSH_URL=http://localhost:<PUSH_PORT>/push. Tự tạo và xóa người dùng b2test_*.
//
// Dùng PUSH_PORT=3955 như push-smoke để một API chạy được cả hai bộ (mặc định trong code vẫn là 3952).
//
//   EXPO_PUSH_URL=http://localhost:3955/push PORT=3002 DATABASE_URL=... corepack pnpm start:dev
//   API=http://localhost:3002/api DIRECT_URL=postgresql://... PUSH_PORT=3955 node scripts/messaging-safety-smoke.cjs
const path = require('node:path');
require('dotenv').config({ path: path.join(__dirname, '..', '.env') });
const http = require('node:http');
const { Client } = require('pg');
const bcrypt = require('bcrypt');
const { randomUUID } = require('node:crypto');

let io;
try {
  ({ io } = require('socket.io-client'));
} catch {
  // Thư viện client nằm ở app mobile.
  ({ io } = require(path.join(__dirname, '..', '..', 'mobile', 'node_modules', 'socket.io-client')));
}

const BASE = process.env.API ?? 'http://localhost:3000/api';
const PUSH_PORT = Number(process.env.PUSH_PORT ?? 3952);
const PASSWORD = 'Passw0rd!b2';
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

function listen(token, event) {
  const socket = io(BASE.replace(/\/api$/, '') + '/notifications', { auth: { token }, transports: ['websocket'] });
  const events = [];
  socket.on(event, (payload) => events.push(payload));
  return {
    events,
    ready: new Promise((resolve, reject) => { socket.on('connect', () => setTimeout(resolve, 400)); socket.on('connect_error', reject); }),
    close: () => socket.disconnect(),
  };
}

const received = [];
const server = http.createServer((req, res) => {
  let raw = '';
  req.on('data', (chunk) => (raw += chunk));
  req.on('end', () => {
    const messages = JSON.parse(raw || '[]');
    received.push(...messages);
    res.setHeader('Content-Type', 'application/json');
    res.end(JSON.stringify({ data: messages.map(() => ({ status: 'ok', id: randomUUID() })) }));
  });
});

(async () => {
  await new Promise((resolve) => server.listen(PUSH_PORT, resolve));
  const db = new Client({ connectionString: process.env.DIRECT_URL });
  await db.connect();

  try {
    await db.query(`DELETE FROM "User" WHERE username LIKE 'b2test\\_%'`);
    const hash = await bcrypt.hash(PASSWORD, 10);
    // a: tài khoản 30 ngày tuổi; new: mới tạo hôm nay; r1..r25: người nhận.
    const names = ['a', 'b', 'new', ...Array.from({ length: 25 }, (_, i) => `r${i + 1}`)];
    for (const n of names) {
      await db.query(
        `INSERT INTO "User"(id, username, email, "passwordHash", "emailVerifiedAt", "birthDate", "onboardedAt", "createdAt", "updatedAt")
         VALUES ($1,$2,$3,$4, now(), '1990-01-01', now(), $5, now())`,
        [randomUUID(), `b2test_${n}`, `b2test_${n}@example.invalid`, hash, n === 'new' ? new Date() : new Date(Date.now() - 30 * 86400000)],
      );
    }
    const ids = Object.fromEntries((await db.query(`SELECT username, id FROM "User" WHERE username LIKE 'b2test\\_%'`)).rows.map((r) => [r.username.slice(7), r.id]));
    const login = async (n) => {
      const r = await call('POST', 'auth/login', null, { email: `b2test_${n}@example.invalid`, password: PASSWORD });
      return { token: r.body?.data?.accessToken, id: r.body?.data?.user?.id, user: r.body?.data?.user };
    };
    const a = await login('a');
    const b = await login('b');
    const r1 = await login('r1');
    const r2 = await login('r2');
    const fresh = await login('new');
    check('login a, b, r1, r2, new', Boolean(a.token && b.token && r1.token && r2.token && fresh.token), null);
    for (const [user, token] of [[b, 'ExponentPushToken[b2test-b]'], [r1, 'ExponentPushToken[b2test-r1]'], [r2, 'ExponentPushToken[b2test-r2]']]) {
      await call('POST', 'notifications/devices', user.token, { platform: 'android', token });
    }
    const pushesTo = (token) => received.filter((m) => m.to === token);

    // ── messagePermission trên /users/me ─────────────────────────────────
    check('login user carries messagePermission EVERYONE', a.user?.messagePermission === 'EVERYONE', a.user);
    let r = await call('GET', 'users/me', b.token);
    check('GET /users/me has messagePermission', r.body?.data?.messagePermission === 'EVERYONE', r.body);
    r = await call('PATCH', 'users/me', b.token, { messagePermission: 'NOBODY' });
    check('PATCH invalid messagePermission -> 400', r.status === 400, r);
    r = await call('PATCH', 'users/me', b.token, { messagePermission: 'FOLLOWING' });
    check('PATCH messagePermission FOLLOWING', r.status === 200 && r.body?.data?.messagePermission === 'FOLLOWING', r);

    // ── FOLLOWING: chỉ người b theo dõi mới mở được hội thoại mới ─────────
    r = await call('POST', 'conversations', a.token, { userId: b.id });
    check('stranger refused: 403 MESSAGE_NOT_ALLOWED in Vietnamese', r.status === 403 && r.body?.code === 'MESSAGE_NOT_ALLOWED' && /theo dõi/.test(r.body?.message), r);
    await call('POST', `users/${a.id}/follow`, b.token);
    r = await call('POST', 'conversations', a.token, { userId: b.id });
    check('someone b follows opens an ACCEPTED conversation', r.status < 300 && r.body?.data?.status === 'ACCEPTED', r);

    // Tin chờ đã mở trước khi người nhận chuyển sang FOLLOWING: người mở không gửi thêm được.
    r = await call('POST', 'conversations', a.token, { userId: r1.id });
    const reqR1 = r.body?.data?.id;
    check('a opens a request to r1 (PENDING)', r.status < 300 && r.body?.data?.status === 'PENDING', r);

    // ── Push của tin chờ không chứa nội dung ─────────────────────────────
    received.length = 0;
    r = await call('POST', `conversations/${reqR1}/messages`, a.token, { content: 'Chuyển khoản trước 500k nhé bạn' });
    check('a sends a request message', r.status < 300, r);
    await wait(800);
    let toR1 = pushesTo('ExponentPushToken[b2test-r1]');
    check('request push body is neutral, no message text', toR1.length === 1 && toR1[0].body === 'Bạn có tin nhắn chờ mới' && !JSON.stringify(toR1).includes('500k'), toR1);

    await call('PATCH', 'users/me', r1.token, { messagePermission: 'FOLLOWING' });
    r = await call('POST', `conversations/${reqR1}/messages`, a.token, { content: 'Bạn ơi?' });
    check('existing request after recipient switched to FOLLOWING: 403 MESSAGE_NOT_ALLOWED', r.status === 403 && r.body?.code === 'MESSAGE_NOT_ALLOWED', r);
    await call('PATCH', 'users/me', r1.token, { messagePermission: 'EVERYONE' });

    // ── Người nhận xóa tin chờ: không push, không socket ─────────────────
    r = await call('POST', 'conversations', a.token, { userId: r2.id });
    const reqR2 = r.body?.data?.id;
    await call('POST', `conversations/${reqR2}/messages`, a.token, { content: 'Xin chào' });
    r = await call('POST', `conversations/${reqR2}/decline`, r2.token);
    check('r2 declines the request', r.status < 300, r);
    const r2Socket = listen(r2.token, 'message:new');
    const aSocket = listen(a.token, 'message:new');
    await Promise.all([r2Socket.ready, aSocket.ready]);
    received.length = 0;
    r = await call('POST', `conversations/${reqR2}/messages`, a.token, { content: 'Sao không trả lời?' });
    check('sender can still send after decline (not told)', r.status < 300, r);
    await wait(800);
    check('no push to the recipient after decline', pushesTo('ExponentPushToken[b2test-r2]').length === 0, received);
    check('no socket message:new to the recipient after decline', r2Socket.events.length === 0, r2Socket.events);
    check('sender\'s own devices still get message:new', aSocket.events.some((e) => e.conversationId === reqR2), aSocket.events);
    r2Socket.close();
    aSocket.close();

    // ── Ẩn danh: push trung tính; tắt nhận ẩn danh chặn hội thoại cũ và trả lời story ─
    await call('POST', `users/${b.id}/follow`, a.token);
    await call('PATCH', 'users/me', b.token, { allowAnonymousMessages: true });
    r = await call('POST', 'conversations/anonymous', a.token, { userId: b.id });
    const anon = r.body?.data?.id;
    check('a opens an anonymous conversation with b', r.status < 300 && Boolean(anon), r);
    received.length = 0;
    r = await call('POST', `conversations/${anon}/messages`, a.token, { content: 'Mình biết bí mật của bạn' });
    check('a sends an anonymous message', r.status < 300, r);
    await wait(800);
    const toB = pushesTo('ExponentPushToken[b2test-b]');
    check('anonymous push: "Người ẩn danh", neutral body', toB.length === 1 && toB[0].title === 'Người ẩn danh' && toB[0].body === 'Bạn có tin nhắn ẩn danh mới', toB);

    const story = (await db.query(
      `INSERT INTO "Story"(id, "authorId", type, url, "expiresAt", "allowAnonymous") VALUES ($1,$2,'image','https://example.invalid/s.jpg', now() + interval '1 day', true) RETURNING id`,
      [randomUUID(), b.id],
    )).rows[0].id;
    r = await call('POST', `stories/${story}/reply`, a.token, { content: 'Story đẹp', anonymous: true });
    check('anonymous story reply works while b accepts anonymous messages', r.status < 300, r);

    await call('PATCH', 'users/me', b.token, { allowAnonymousMessages: false });
    r = await call('POST', `conversations/${anon}/messages`, a.token, { content: 'Còn đó không?' });
    check('existing anonymous conversation after b turned it off: 403 ANONYMOUS_NOT_ACCEPTED', r.status === 403 && r.body?.code === 'ANONYMOUS_NOT_ACCEPTED', r);
    r = await call('POST', `stories/${story}/reply`, a.token, { content: 'Story đẹp lần nữa', anonymous: true });
    check('anonymous story reply still works after b turned it off (story setting only)', r.status < 300, r);
    r = await call('POST', 'conversations/anonymous', a.token, { userId: b.id });
    check('profile "Nhắn ẩn danh" refused after b turned it off', r.status === 403 && r.body?.code === 'ANONYMOUS_NOT_ACCEPTED', r);

    // Hội thoại ẩn danh mở từ trả lời story: tiếp tục được dù b đã tắt.
    const r3 = await login('r3');
    await call('POST', `users/${b.id}/follow`, r3.token);
    r = await call('POST', `stories/${story}/reply`, r3.token, { content: 'Ảnh đẹp ghê', anonymous: true });
    const storyAnon = r.body?.data?.conversationId;
    check('r3 replies anonymously to the story while b has it off', r.status < 300 && Boolean(storyAnon), r);
    r = await call('POST', `conversations/${storyAnon}/messages`, r3.token, { content: 'Chụp ở đâu vậy?' });
    check('follow-up in a story-started anonymous conversation is allowed', r.status < 300, r);
    r = await call('POST', `conversations/${anon}/messages`, b.token, { content: 'Mình trả lời được chứ' });
    check('b (recipient) can still reply in that conversation', r.status < 300, r);

    // ── Giới hạn tin chờ mới mỗi ngày ────────────────────────────────────
    // a đã mở r1, r2: còn 18 trong 20.
    let opened = 0;
    let refusal = null;
    for (let i = 3; i <= 25 && !refusal; i++) {
      r = await call('POST', 'conversations', a.token, { userId: ids[`r${i}`] });
      if (r.status < 300) opened++;
      else refusal = r;
    }
    check('old account opens 20 requests a day (18 more after r1, r2)', opened === 18, { opened });
    check('21st request: 429 REQUEST_DAILY_LIMIT in Vietnamese', refusal?.status === 429 && refusal.body?.code === 'REQUEST_DAILY_LIMIT' && refusal.body?.limit === 20 && /ngày mai/.test(refusal.body?.message), refusal);
    r = await call('POST', 'conversations', a.token, { userId: r1.id });
    check('reopening an existing request still works at the cap', r.status < 300 && r.body?.data?.id === reqR1, r);

    opened = 0;
    refusal = null;
    for (let i = 1; i <= 10 && !refusal; i++) {
      r = await call('POST', 'conversations', fresh.token, { userId: ids[`r${i}`] });
      if (r.status < 300) opened++;
      else refusal = r;
    }
    check('account younger than 7 days: 5 requests a day', opened === 5 && refusal?.status === 429 && refusal.body?.limit === 5, { opened, refusal });
  } finally {
    await db.query(`DELETE FROM "User" WHERE username LIKE 'b2test\\_%'`);
    await db.end();
    server.close();
  }

  console.log(`\n${passed} passed, ${failed} failed`);
  process.exit(failed ? 1 : 0);
})().catch((error) => {
  console.error(error);
  process.exit(1);
});
