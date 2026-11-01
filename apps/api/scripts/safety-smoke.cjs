// Kiểm tra đợt an toàn 2026-10-17 trên API thật: 18+, tin nhắn chờ, hội thoại ẩn danh (không lộ
// danh tính ở API và socket), chặn thông tin liên lạc, cảnh báo lừa đảo, báo cáo hội thoại, cảm xúc
// story ẩn danh, trả lời story, làm mờ ảnh, trang quản trị.
//
//   docker compose up -d
//   node scripts/seed-test-users.cjs clean && node scripts/seed-test-users.cjs
//   node scripts/make-admin.cjs gaptest_c@example.invalid
//   API=http://localhost:3000/api node scripts/safety-smoke.cjs
//   node scripts/seed-test-users.cjs clean
//
// Chỉ đụng tới tài khoản thử gaptest_* và qa_safety_* (tự xóa qa_safety_* khi xong).
const path = require('node:path');
require('dotenv').config({ path: path.join(__dirname, '..', '.env') });
const { Client } = require('pg');

let io;
try {
  ({ io } = require('socket.io-client'));
} catch {
  // Thư viện client nằm ở app mobile.
  ({ io } = require(path.join(__dirname, '..', '..', 'mobile', 'node_modules', 'socket.io-client')));
}

const BASE = process.env.API ?? 'http://localhost:3000/api';
const PASSWORD = 'Passw0rd!gap';
const stamp = Date.now().toString(36);
let failed = 0;

function check(name, ok, detail) {
  if (!ok) failed++;
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
  const r = await call('POST', 'auth/login', null, { email: `gaptest_${name}@example.invalid`, password: PASSWORD });
  return { token: r.body?.data?.accessToken, id: r.body?.data?.user?.id, user: r.body?.data?.user, raw: r };
}

async function upload(token, kind, mimeType, bytes) {
  const r = await call('POST', 'media/upload-url', token, { kind, mimeType, sizeBytes: bytes.length });
  await fetch(r.body.data.uploadUrl, { method: 'PUT', headers: r.body.data.headers, body: bytes });
  return r.body.data.storageKey;
}

function messageForm(fields, image) {
  const form = new FormData();
  Object.entries(fields).forEach(([key, value]) => form.append(key, value));
  if (image) form.append('image', new Blob([image], { type: 'image/png' }), 'x.png');
  return form;
}

// Ảnh PNG hợp lệ 32x32 một màu (ảnh bình thường).
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
  return Buffer.concat([
    Buffer.from([0x89, 0x50, 0x4e, 0x47, 0x0d, 0x0a, 0x1a, 0x0a]),
    chunk('IHDR', ihdr), chunk('IDAT', zlib.deflateSync(Buffer.concat(Array(32).fill(row)))), chunk('IEND', Buffer.alloc(0)),
  ]);
}

// Không chứa id hay username thật của người gửi ẩn danh ở bất kỳ đâu trong dữ liệu.
function leaks(payload, user) {
  const text = JSON.stringify(payload);
  return text.includes(user.id) || text.includes(user.user.username);
}

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

const wait = (ms) => new Promise((resolve) => setTimeout(resolve, ms));

// Một kết nối ngắn cho mỗi câu lệnh, qua transaction pooler (DATABASE_URL): pooler của Supabase cắt
// kết nối để không lâu, và session pooler (DIRECT_URL) chỉ có vài chỗ.
async function sql(text) {
  const db = new Client({ connectionString: process.env.DATABASE_URL });
  await db.connect();
  try {
    await db.query(text);
  } finally {
    await db.end();
  }
}

(async () => {
  // Trạng thái đầu cố định cho tài khoản thử (chỉ gaptest_*).
  await sql(`UPDATE "User" SET "birthDate" = NULL, "ageLockedAt" = NULL, "anonymousSuspendedAt" = NULL,
                  "allowAnonymousMessages" = false, "createdAt" = now() WHERE username LIKE 'gaptest\\_%'`);

  let a = await login('a');
  let b = await login('b');
  const c = await login('c');
  check('login a, b, c', Boolean(a.token && b.token && c.token), null);
  check('c is an admin (run make-admin first)', c.user?.role === 'ADMIN', c.user?.role);

  for (const [x, y] of [[a, b], [b, a], [c, b], [c, a], [b, c], [a, c]]) {
    await call('DELETE', `users/${y.id}/follow`, x.token);
  }

  // ── 18+ ───────────────────────────────────────────────────────────────────
  const minorDate = new Date(Date.now() - 17 * 365 * 86_400_000).toISOString().slice(0, 10);
  let r = await call('POST', 'auth/register', null, { username: `qa_safety_minor_${stamp}`, email: `qa_safety_minor_${stamp}@example.invalid`, password: PASSWORD, birthDate: minorDate });
  check('register under 18 is refused', r.status === 403 && r.body?.code === 'AGE_RESTRICTED', r);
  r = await call('POST', 'auth/register', null, { username: `qa_safety_bad_${stamp}`, email: `qa_safety_bad_${stamp}@example.invalid`, password: PASSWORD, birthDate: '2001-02-30' });
  check('impossible birth date is refused', r.status === 400, r);
  r = await call('POST', 'auth/register', null, { username: `qa_safety_adult_${stamp}`, email: `qa_safety_adult_${stamp}@example.invalid`, password: PASSWORD });
  check('birth date is required', r.status === 400, r);
  r = await call('POST', 'auth/register', null, { username: `qa_safety_adult_${stamp}`, email: `qa_safety_adult_${stamp}@example.invalid`, password: PASSWORD, birthDate: '1995-06-15' });
  check('register adult', r.status === 201, r);

  r = await call('GET', 'users/me', a.token);
  check('existing account has no birth date yet', r.body?.data?.birthDate === null, r.body?.data);
  r = await call('PATCH', 'users/me/birth-date', a.token, { birthDate: '1990-01-01' });
  check('declare adult birth date', r.body?.data?.birthDate === '1990-01-01' && r.body.data.ageLocked === false, r);
  r = await call('PATCH', 'users/me/birth-date', a.token, { birthDate: '1991-01-01' });
  check('birth date can only be set once', r.status === 409, r);
  await call('PATCH', 'users/me/birth-date', b.token, { birthDate: '1992-02-02' });
  await call('PATCH', 'users/me/birth-date', c.token, { birthDate: '1993-03-03' });

  // ── Tin nhắn chờ (a, b không theo dõi nhau) ───────────────────────────────
  r = await call('POST', 'conversations', a.token, { userId: b.id });
  const direct = r.body?.data;
  check('stranger conversation starts pending', direct?.status === 'PENDING' && direct.isRequest === false && direct.canSendImages === false, r);
  r = await call('POST', `conversations/${direct.id}/messages`, a.token, undefined, messageForm({ clientId: `img-${stamp}` }, plainPng()));
  check('stranger cannot send images', r.status === 400 && r.body?.code === 'IMAGES_NOT_ALLOWED', r);
  r = await call('POST', `conversations/${direct.id}/messages`, a.token, { content: 'gọi mình 0912 345 678 nhé' });
  check('stranger cannot send a phone number', r.status === 400 && r.body?.code === 'CONTACT_INFO_BLOCKED' && r.body.contact === 'PHONE', r);
  r = await call('POST', `conversations/${direct.id}/messages`, a.token, { content: 'vào web abc chấm com nha' });
  check('stranger cannot send a disguised link', r.status === 400 && r.body?.contact === 'LINK', r);
  r = await call('POST', `conversations/${direct.id}/messages`, a.token, { content: 'stk của mình 1903 6688 1234 567' });
  check('stranger cannot send a bank account number', r.status === 400 && r.body?.contact === 'BANK_ACCOUNT', r);
  for (const content of ['Chào bạn', 'Bạn chuyển khoản trước giúp mình nhé', 'Mình chờ nhé']) {
    r = await call('POST', `conversations/${direct.id}/messages`, a.token, { content });
  }
  check('three messages while pending', r.status === 201, r);
  r = await call('POST', `conversations/${direct.id}/messages`, a.token, { content: 'tin thứ tư' });
  check('fourth message waits for a reply', r.status === 429 && r.body?.code === 'REQUEST_LIMIT', r);

  r = await call('GET', 'conversations', b.token);
  let row = r.body?.data?.find((x) => x.id === direct.id);
  check('recipient sees it as a request', row?.isRequest === true, row);
  r = await call('GET', 'conversations/unread-count', b.token);
  check('requests are counted apart from the inbox badge', r.body?.data?.requests >= 1, r.body);
  r = await call('GET', `conversations/${direct.id}/messages`, b.token);
  check('scam phrase is flagged for the recipient', r.body?.data?.some((m) => m.content.includes('chuyển khoản') && m.warning === true), r.body?.data);
  check('normal message is not flagged', r.body?.data?.some((m) => m.content === 'Chào bạn' && m.warning === false), r.body?.data);
  await call('POST', `conversations/${direct.id}/read`, b.token);
  r = await call('GET', `conversations/${direct.id}/messages`, a.token);
  check('requester does not see "seen"', r.body?.meta?.peerReadAt === null, r.body?.meta);
  r = await call('POST', `conversations/${direct.id}/decline`, b.token);
  check('recipient declines', r.body?.data?.declined === true, r);
  r = await call('GET', 'conversations', b.token);
  check('declined request leaves the recipient inbox', !r.body?.data?.some((x) => x.id === direct.id), null);
  r = await call('GET', 'conversations', a.token);
  check('requester is not told about the decline', r.body?.data?.find((x) => x.id === direct.id)?.status === 'PENDING', null);
  r = await call('POST', `conversations/${direct.id}/messages`, b.token, { content: 'Mình đây' });
  check('recipient reply accepts the conversation', r.status === 201, r);
  r = await call('GET', `conversations/${direct.id}/messages`, a.token);
  check('accepted: images allowed, "seen" visible', r.body?.meta?.conversation?.status === 'ACCEPTED' && r.body.meta.conversation.canSendImages === true, r.body?.meta);

  r = await call('POST', `conversations/${direct.id}/messages`, a.token, undefined, messageForm({ clientId: `plain-${stamp}` }, plainPng()));
  check('ordinary image is not blurred', r.status === 201 && r.body?.data?.sensitive === false, r);
  r = await call('POST', `conversations/${direct.id}/messages`, a.token, undefined, messageForm({ clientId: `broken-${stamp}` }, Buffer.from('not really a png')));
  check('unreadable image is blurred for safety', r.status === 201 && r.body?.data?.sensitive === true, r);
  r = await call('GET', `conversations/${direct.id}/messages`, b.token);
  check('recipient gets the blur flag', r.body?.data?.find((m) => m.id === `broken-${stamp}`)?.sensitive === true, null);

  r = await call('POST', 'conversations', c.token, { userId: b.id });
  const requestToB = r.body?.data;
  await call('POST', `conversations/${requestToB.id}/messages`, c.token, { content: 'xin chào' });
  r = await call('POST', `conversations/${requestToB.id}/accept`, b.token);
  check('recipient accepts without replying', r.body?.data?.status === 'ACCEPTED', r);

  // ── Ẩn danh từ trang cá nhân ──────────────────────────────────────────────
  r = await call('POST', 'conversations/anonymous', a.token, { userId: b.id });
  check('anonymous refused when the recipient has not opted in', r.status === 403 && r.body?.code === 'ANONYMOUS_NOT_ACCEPTED', r);
  r = await call('PATCH', 'users/me', b.token, { allowAnonymousMessages: true });
  check('recipient opts in', r.body?.data?.allowAnonymousMessages === true, r.body?.data);
  r = await call('GET', `users/${b.id}`, a.token);
  check('profile tells others anonymous messages are accepted', r.body?.data?.acceptsAnonymousMessages === true, r.body?.data);
  r = await call('POST', 'conversations/anonymous', a.token, { userId: b.id });
  check('must follow to message anonymously', r.status === 403 && r.body?.code === 'ANONYMOUS_FOLLOW_REQUIRED', r);
  await call('POST', `users/${b.id}/follow`, a.token);
  await call('POST', `users/${b.id}/follow`, c.token);
  r = await call('POST', 'conversations/anonymous', a.token, { userId: b.id });
  check('new accounts cannot send anonymously', r.status === 403 && r.body?.code === 'ANONYMOUS_NOT_ELIGIBLE', r);
  await sql(`UPDATE "User" SET "createdAt" = now() - interval '8 days' WHERE username LIKE 'gaptest\\_%'`);

  const bSocket = listen(b.token, 'message:new');
  await bSocket.ready;

  r = await call('POST', 'conversations/anonymous', a.token, { userId: b.id });
  const anonAB = r.body?.data;
  check('sender opens an anonymous conversation', anonAB?.anonymous?.role === 'SENDER' && anonAB.peer.id === b.id && anonAB.canSendImages === false, r);
  r = await call('POST', `conversations/${anonAB.id}/messages`, a.token, { content: 'link t.me/abcxyz' });
  check('anonymous sender cannot send links', r.status === 400 && r.body?.code === 'CONTACT_INFO_BLOCKED', r);
  r = await call('POST', `conversations/${anonAB.id}/messages`, a.token, undefined, messageForm({}, plainPng()));
  check('anonymous conversations are text only', r.status === 400 && r.body?.code === 'IMAGES_NOT_ALLOWED', r);
  r = await call('POST', `conversations/${anonAB.id}/messages`, a.token, { content: 'Mình thích bài viết của bạn lắm' });
  check('anonymous text message sent', r.status === 201, r);
  await wait(800);

  r = await call('GET', 'conversations', b.token);
  row = r.body?.data?.find((x) => x.id === anonAB.id);
  check('recipient sees "Người ẩn danh"', row?.peer?.id === 'anonymous' && row.peer.displayName === 'Người ẩn danh' && row.anonymous?.role === 'RECIPIENT' && row.isRequest === true, row);
  check('inbox reveals nothing about the sender', row && !leaks(row, a), row);
  r = await call('GET', `conversations/${anonAB.id}/messages`, b.token);
  check('history reveals nothing about the sender', r.status === 200 && !leaks(r.body, a) && r.body.data[0].senderId === 'anonymous', r.body);
  const pushed = bSocket.events.find((event) => event.conversationId === anonAB.id);
  check('socket event reveals nothing about the sender', pushed && !leaks(pushed, a), pushed);
  bSocket.close();

  // ── Báo cáo lừa đảo trong hội thoại ẩn danh ──────────────────────────────
  r = await call('POST', 'reports', b.token, { targetType: 'CONVERSATION', targetId: anonAB.id, reason: 'SCAM', note: 'đòi chuyển khoản' });
  check('recipient reports the anonymous conversation', r.body?.data?.reported === true, r);
  r = await call('POST', `conversations/${anonAB.id}/messages`, a.token, { content: 'còn đó không' });
  check('reported conversation is closed', r.status === 403 && r.body?.code === 'CONVERSATION_CLOSED', r);
  r = await call('GET', 'conversations', b.token);
  check('closed conversation leaves the inbox', !r.body?.data?.some((x) => x.id === anonAB.id), null);
  r = await call('PATCH', 'users/me', c.token, { allowAnonymousMessages: true });
  await call('POST', `users/${c.id}/follow`, a.token);
  r = await call('POST', 'conversations/anonymous', a.token, { userId: c.id });
  check('reported sender loses anonymous rights at once', r.status === 403 && r.body?.code === 'ANONYMOUS_SUSPENDED', r);

  r = await call('GET', 'admin/reports', c.token);
  const report = r.body?.data?.find((x) => x.targetType === 'CONVERSATION' && x.targetId === anonAB.id);
  check('admin sees the real sender and the snapshot', report?.target?.author?.id === a.id && report.target.anonymous === true && report.target.messages.some((m) => m.content === 'Mình thích bài viết của bạn lắm'), report);
  r = await call('POST', `admin/reports/${report.id}/resolve`, c.token, { action: 'DISMISS' });
  r = await call('POST', 'conversations/anonymous', a.token, { userId: c.id });
  check('dismissing a first report restores anonymous rights', r.status === 201 && r.body?.data?.anonymous?.role === 'SENDER', r);
  r = await call('GET', 'admin/users?q=gaptest_a', c.token);
  check('admin user list shows safety fields', r.body?.data?.[0] && 'anonymousSuspendedAt' in r.body.data[0] && 'ageLockedAt' in r.body.data[0], r.body?.data?.[0]);
  r = await call('GET', 'admin/stats', c.token);
  check('admin stats report the image checker', r.body?.data?.imageModeration === 'ready', r.body?.data);

  // ── Tiết lộ danh tính và chặn người ẩn danh ───────────────────────────────
  r = await call('POST', 'conversations/anonymous', c.token, { userId: b.id });
  const anonCB = r.body?.data;
  await call('POST', `conversations/${anonCB.id}/messages`, c.token, { content: 'đoán xem mình là ai' });
  r = await call('POST', `conversations/${anonCB.id}/reveal`, b.token);
  check('only the anonymous sender can reveal', r.status === 400, r);
  r = await call('POST', `conversations/${anonCB.id}/reveal`, c.token);
  check('sender reveals', r.body?.data?.anonymous?.revealed === true, r);
  r = await call('GET', `conversations/${anonCB.id}/messages`, b.token);
  check('after reveal the recipient sees who it is', r.body?.meta?.conversation?.peer?.id === c.id && r.body.data[0].senderId === c.id, r.body?.meta);
  r = await call('POST', `conversations/${anonCB.id}/close`, b.token);
  check('recipient blocks the anonymous conversation', r.body?.data?.closed === true, r);
  r = await call('POST', `conversations/${anonCB.id}/messages`, c.token, { content: 'alo' });
  check('closed anonymous conversation cannot be used', r.status === 403, r);

  // ── Story: cảm xúc ẩn danh, không có danh sách người xem, trả lời ────────
  await call('POST', `users/${a.id}/follow`, b.token);
  await call('POST', `users/${a.id}/follow`, c.token);
  const imageKey = await upload(a.token, 'image', 'image/png', plainPng());
  r = await call('POST', 'stories', a.token, { type: 'IMAGE', storageKey: imageKey, allowAnonymous: true });
  const openStory = r.body?.data;
  check('story with anonymous interactions', r.status === 201 && openStory.allowAnonymous === true, r);
  const imageKey2 = await upload(a.token, 'image', 'image/png', plainPng());
  r = await call('POST', 'stories', a.token, { type: 'IMAGE', storageKey: imageKey2 });
  const closedStory = r.body?.data;
  check('anonymous interactions are off by default', closedStory?.allowAnonymous === false, r);

  r = await call('POST', `stories/${openStory.id}/reactions`, b.token, { type: 'LOVE', anonymous: true });
  check('anonymous reaction', r.body?.data?.myReaction?.isAnonymous === true, r);
  r = await call('POST', `stories/${openStory.id}/reactions`, c.token, { type: 'HAHA' });
  check('named reaction', r.status === 201, r);
  r = await call('POST', `stories/${closedStory.id}/reactions`, b.token, { type: 'LOVE', anonymous: true });
  check('anonymous reaction refused when not allowed', r.status === 403, r);
  r = await call('POST', `stories/${openStory.id}/reactions`, a.token, { type: 'LOVE' });
  check('cannot react to your own story', r.status === 400, r);
  r = await call('GET', `stories/${openStory.id}/reactions`, a.token);
  const anonymousReaction = r.body?.data?.find((x) => x.isAnonymous);
  check('owner sees "anonymous" without identity', anonymousReaction?.user === null && !leaks(r.body, b), r.body);
  check('owner sees named reactions with the person', r.body?.data?.some((x) => x.user?.id === c.id && x.type === 'HAHA'), r.body);
  r = await call('GET', `stories/${openStory.id}/reactions`, b.token);
  check('only the owner lists reactions', r.status === 404, r);
  r = await call('GET', `stories/${openStory.id}/viewers`, a.token);
  check('viewer list no longer exists', r.status === 404, r);
  r = await call('GET', 'stories/feed', a.token);
  const own = r.body?.data?.[0]?.stories?.find((s) => s.id === openStory.id);
  check('owner feed: reaction count, no view count', own?.reactionsCount === 2 && own.viewsCount === undefined, own);
  r = await call('GET', 'stories/feed', b.token);
  const seen = r.body?.data?.find((g) => g.author.id === a.id)?.stories?.find((s) => s.id === openStory.id);
  check('viewer feed carries their own reaction', seen?.myReaction?.type === 'LOVE' && seen.myReaction.isAnonymous === true, seen);

  r = await call('POST', `stories/${openStory.id}/reply`, b.token, { content: 'story đẹp quá', anonymous: true });
  const anonReply = r.body?.data;
  check('anonymous story reply opens an anonymous conversation', r.status === 201 && anonReply?.message?.storyId === openStory.id, r);
  r = await call('GET', 'conversations', a.token);
  row = r.body?.data?.find((x) => x.id === anonReply?.conversationId);
  check('story owner sees an anonymous reply', row?.peer?.id === 'anonymous' && !leaks(row, b), row);
  r = await call('POST', `stories/${closedStory.id}/reply`, b.token, { content: 'hi', anonymous: true });
  check('anonymous reply refused when not allowed', r.status === 403, r);
  r = await call('POST', `stories/${closedStory.id}/reply`, b.token, { content: 'Đẹp quá!' });
  check('named story reply goes to the normal conversation', r.status === 201 && r.body?.data?.message?.storyId === closedStory.id, r);

  // ── Khóa vì tuổi ─────────────────────────────────────────────────────────
  await sql(`UPDATE "User" SET "birthDate" = NULL WHERE username = 'gaptest_b'`);
  r = await call('PATCH', 'users/me/birth-date', b.token, { birthDate: minorDate });
  check('declaring under 18 locks the account', r.body?.data?.ageLocked === true, r);
  r = await call('GET', 'users/me', b.token);
  check('locked token is rejected', r.status === 401 && r.body?.code === 'AGE_RESTRICTED', r);
  check('locked account cannot log in', (await login('b')).raw.body?.code === 'AGE_RESTRICTED', null);
  r = await call('DELETE', `admin/users/${b.id}/age-lock`, c.token);
  b = await login('b');
  r = await call('GET', 'users/me', b.token);
  check('admin unlock lets the user declare again', r.status === 200 && r.body?.data?.birthDate === null, r.body);

  await sql(`DELETE FROM "User" WHERE username LIKE 'qa\\_safety\\_%'`);
  console.log(failed ? `\n${failed} FAILED` : '\nALL PASSED');
  process.exit(failed ? 1 : 0);
})().catch((error) => { console.error('CRASHED', error); process.exit(1); });
