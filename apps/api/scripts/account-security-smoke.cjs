// Kiểm tra bảo mật tài khoản (2026-11-01) trên API thật: phiên theo tokenVersion (đăng xuất mọi thiết bị,
// đổi / đặt lại mật khẩu), token cũ không có `ver`, socket từ chối token đã thu hồi, khóa đăng nhập sau
// 5 lần sai mật khẩu, xác thực hai lớp bằng mã email.
//
//   API=http://localhost:3001/api DATABASE_URL=postgresql://postgres:postgres@localhost:5433/mobilesocial \
//     node scripts/account-security-smoke.cjs
//
// Tự tạo rồi tự xóa tài khoản thử b1test_* (email @example.invalid). Mã OTP trong database chỉ là hash,
// nên script ghi đè hash bằng hash của một mã đã biết (cần OTP_HASH_SECRET và JWT_SECRET trong .env).
const path = require('node:path');
// Đọc trước dotenv: không bao giờ lấy DATABASE_URL của .env (có thể trỏ tới database thật).
const DB = process.env.DATABASE_URL || 'postgresql://postgres:postgres@localhost:5433/mobilesocial';
require('dotenv').config({ path: path.join(__dirname, '..', '.env') });
const { Client } = require('pg');
const bcrypt = require('bcrypt');
const { createHmac, randomUUID } = require('node:crypto');

let io;
try {
  ({ io } = require('socket.io-client'));
} catch {
  ({ io } = require(path.join(__dirname, '..', '..', 'mobile', 'node_modules', 'socket.io-client')));
}

const BASE = process.env.API ?? 'http://localhost:3000/api';
const PASSWORD = 'Passw0rd!b1';
const NEW_PASSWORD = 'NewPassw0rd!b1';
let failed = 0;
let passed = 0;
// Mỗi nhóm thử dùng một IP giả (API đặt trust proxy) để giới hạn 10 lần login/phút theo IP không chặn nhau.
let ip = `10.11.${Math.floor(Math.random() * 200)}.1`;

function check(name, ok, detail) {
  if (ok) passed++;
  else failed++;
  console.log(`${ok ? 'PASS' : 'FAIL'}  ${name}${ok ? '' : '  -> ' + JSON.stringify(detail)?.slice(0, 400)}`);
}

async function call(method, urlPath, token, body) {
  const headers = { 'X-Forwarded-For': ip };
  if (token) headers.Authorization = `Bearer ${token}`;
  if (body !== undefined) headers['Content-Type'] = 'application/json';
  const res = await fetch(`${BASE}/${urlPath}`, { method, headers, body: body === undefined ? undefined : JSON.stringify(body) });
  const text = await res.text();
  let json = null;
  try { json = text ? JSON.parse(text) : null; } catch { json = text; }
  return { status: res.status, body: json };
}

const email = (n) => `b1test_${n}@example.invalid`;
const login = (n, password = PASSWORD) => call('POST', 'auth/login', null, { email: email(n), password });

// JWT HS256 viết tay: token kiểu cũ (không có `ver`) và token cho tài khoản chỉ có Google.
function signJwt(payload) {
  const b64 = (o) => Buffer.from(JSON.stringify(o)).toString('base64url');
  const now = Math.floor(Date.now() / 1000);
  const body = `${b64({ alg: 'HS256', typ: 'JWT' })}.${b64({ ...payload, iat: now, exp: now + 600 })}`;
  return `${body}.${createHmac('sha256', process.env.JWT_SECRET).update(body).digest('base64url')}`;
}

const otpHash = (key, otp) => createHmac('sha256', process.env.OTP_HASH_SECRET).update(`${key}:${otp}`).digest('hex');

function socketState(token) {
  return new Promise((resolve) => {
    const base = BASE.replace(/\/api$/, '');
    const socket = io(`${base}/notifications`, { auth: { token }, transports: ['websocket'], reconnection: false });
    let connected = false;
    socket.on('connect', () => { connected = true; });
    socket.on('disconnect', () => { socket.close(); resolve('rejected'); });
    socket.on('connect_error', () => { socket.close(); resolve('rejected'); });
    setTimeout(() => { resolve(connected ? 'connected' : 'timeout'); socket.close(); }, 1500);
  });
}

(async () => {
  const db = new Client({ connectionString: DB });
  await db.connect();
  const clean = () => db.query(`DELETE FROM "User" WHERE username LIKE 'b1test\\_%'`);
  await clean();

  const ids = {};
  const hash = await bcrypt.hash(PASSWORD, 10);
  for (const n of ['a', 'b', 'c']) {
    ids[n] = randomUUID();
    await db.query(
      `INSERT INTO "User"(id, username, email, "passwordHash", "googleId", "emailVerifiedAt", "birthDate", "createdAt", "updatedAt")
       VALUES ($1,$2,$3,$4,$5, now(), '1990-01-01', now(), now())`,
      // c: tài khoản chỉ có Google (không có mật khẩu).
      [ids[n], `b1test_${n}`, email(n), n === 'c' ? null : hash, n === 'c' ? `b1test-google-${ids[n]}` : null],
    );
  }

  try {
    // ---- Phiên: tokenVersion, đăng xuất mọi thiết bị, token cũ không có ver
    let r = await login('a');
    const t1 = r.body?.data?.accessToken;
    check('login returns a token', r.status < 300 && Boolean(t1), r);
    const ver = JSON.parse(Buffer.from(t1.split('.')[1], 'base64url').toString()).ver;
    check('token carries ver = tokenVersion (0)', ver === 0, ver);
    r = await call('GET', 'users/me', t1);
    check('me works, twoFactorEnabled=false', r.status === 200 && r.body.data.twoFactorEnabled === false, r);
    const legacy = signJwt({ sub: ids.a });
    r = await call('GET', 'users/me', legacy);
    check('old token without ver still works (treated as 0)', r.status === 200, r);
    check('socket accepts a valid token', (await socketState(t1)) === 'connected');

    r = await login('a');
    const t2 = r.body?.data?.accessToken;
    r = await call('POST', 'auth/logout', t1);
    check('logout -> 204', r.status === 204, r);
    r = await call('GET', 'users/me', t1);
    check('token used to log out is revoked (SESSION_REVOKED)', r.status === 401 && r.body?.code === 'SESSION_REVOKED', r);
    r = await call('GET', 'users/me', t2);
    check('logout signs out the other device too', r.status === 401, r);
    r = await call('GET', 'users/me', legacy);
    check('old token without ver revoked after logout', r.status === 401, r);
    check('socket rejects a revoked token', (await socketState(t1)) === 'rejected');

    // ---- Đổi mật khẩu: thiết bị khác bị đăng xuất, thiết bị này nhận token mới
    r = await login('a');
    const t3 = r.body?.data?.accessToken;
    r = await login('a');
    const other = r.body?.data?.accessToken;
    r = await call('PATCH', 'auth/password', t3, { currentPassword: 'wrong-password', newPassword: NEW_PASSWORD });
    check('change password wrong current -> 400 in Vietnamese', r.status === 400 && r.body?.message === 'Mật khẩu hiện tại không đúng.', r);
    r = await call('PATCH', 'auth/password', t3, { currentPassword: PASSWORD, newPassword: NEW_PASSWORD });
    const t4 = r.body?.data?.accessToken;
    check('change password -> 200 with a fresh accessToken', r.status === 200 && r.body.data.changed === true && Boolean(t4), r);
    r = await call('GET', 'users/me', t4);
    check('fresh token from password change works', r.status === 200, r);
    r = await call('GET', 'users/me', other);
    check('password change revokes the other device', r.status === 401, r);
    r = await call('GET', 'users/me', t3);
    check('password change revokes the token it was called with', r.status === 401, r);

    // ---- Đặt lại mật khẩu (quên mật khẩu) thu hồi mọi phiên
    r = await call('POST', 'auth/forgot-password', null, { email: email('a') });
    check('forgot-password -> 200 Vietnamese generic message', r.status === 200 && /mã đặt lại/.test(r.body?.message ?? ''), r);
    await db.query(
      `UPDATE "AuthToken" SET "tokenHash"=$2 WHERE id = (SELECT id FROM "AuthToken" WHERE "userId"=$1 AND purpose='PASSWORD_RESET' ORDER BY "createdAt" DESC LIMIT 1)`,
      [ids.a, otpHash(`PASSWORD_RESET:${ids.a}`, '111111')],
    );
    r = await call('POST', 'auth/reset-password', null, { email: email('a'), otp: '222222', newPassword: PASSWORD });
    check('reset with wrong code -> Vietnamese error', r.status === 401 && r.body?.message === 'Mã đặt lại mật khẩu không đúng hoặc đã hết hạn.', r);
    r = await call('POST', 'auth/reset-password', null, { email: email('a'), otp: '111111', newPassword: PASSWORD });
    check('reset password -> 200', r.status === 200, r);
    r = await call('GET', 'users/me', t4);
    check('password reset revokes existing sessions', r.status === 401, r);

    // ---- Khóa đăng nhập theo tài khoản
    ip = `10.12.${Math.floor(Math.random() * 200)}.1`;
    const statuses = [];
    for (let i = 0; i < 4; i++) statuses.push((await login('b', 'wrong-password')).status);
    check('4 wrong passwords -> 401 each', statuses.every((s) => s === 401), statuses);
    r = await login('b', 'wrong-password');
    check('5th wrong password -> 423 LOGIN_LOCKED, 15 minutes', r.status === 423 && r.body?.code === 'LOGIN_LOCKED' && /15 phút/.test(r.body?.message), r);
    r = await login('b');
    check('correct password while locked -> still 423', r.status === 423, r);
    await db.query(`UPDATE "User" SET "loginLockedUntil" = now() - interval '1 second' WHERE id=$1`, [ids.b]);
    r = await login('b');
    check('after the lock expires the right password works', r.status < 300, r);
    const row = (await db.query(`SELECT "failedLoginCount", "loginLockedUntil" FROM "User" WHERE id=$1`, [ids.b])).rows[0];
    check('success resets the counter and the lock', row.failedLoginCount === 0 && row.loginLockedUntil === null, row);
    r = await login('b', 'wrong-password');
    check('wrong password message in Vietnamese', r.body?.message === 'Email hoặc mật khẩu không đúng.', r);

    // Thời gian: email không tồn tại vẫn chạy bcrypt (không thể nhanh hơn nhiều so với sai mật khẩu).
    ip = `10.13.${Math.floor(Math.random() * 200)}.1`;
    const time = async (n) => { const s = performance.now(); await login(n, 'wrong-password'); return performance.now() - s; };
    const tWrong = Math.min(await time('a'), await time('a'));
    const tMissing = Math.min(await time('nobody'), await time('nobody'));
    check(`unknown email takes about as long as a wrong password (${tMissing.toFixed(0)}ms vs ${tWrong.toFixed(0)}ms)`, tMissing > tWrong * 0.5, { tMissing, tWrong });

    // ---- Xác thực hai lớp
    ip = `10.14.${Math.floor(Math.random() * 200)}.1`;
    r = await call('PATCH', 'auth/2fa', signJwt({ sub: ids.c, ver: 0 }), { enabled: true, currentPassword: 'anything' });
    check('Google-only account cannot turn on 2FA (PASSWORD_REQUIRED)', r.status === 400 && r.body?.code === 'PASSWORD_REQUIRED', r);
    r = await login('a');
    const ta = r.body?.data?.accessToken;
    r = await call('PATCH', 'auth/2fa', ta, { enabled: true, currentPassword: 'wrong-password' });
    check('turn on 2FA with a wrong password -> 400', r.status === 400, r);
    r = await call('PATCH', 'auth/2fa', ta, { enabled: true, currentPassword: PASSWORD });
    check('turn on 2FA -> 200', r.status === 200 && r.body.data.twoFactorEnabled === true, r);
    r = await call('GET', 'users/me', ta);
    check('me shows twoFactorEnabled=true', r.body?.data?.twoFactorEnabled === true, r);

    r = await login('a');
    const challenge = r.body?.data?.challengeToken;
    check('login with 2FA -> challenge, no token', r.status < 300 && r.body.data.twoFactorRequired === true && Boolean(challenge) && !r.body.data.accessToken && r.body.data.email === email('a'), r);
    r = await call('GET', 'users/me', challenge);
    check('challengeToken is not an access token', r.status === 401, r);
    check('challengeToken does not open a socket', (await socketState(challenge)) === 'rejected');
    const setCode = (code) => db.query(
      `UPDATE "AuthToken" SET "tokenHash"=$2 WHERE id = (SELECT id FROM "AuthToken" WHERE "userId"=$1 AND purpose='LOGIN_TWO_FACTOR' ORDER BY "createdAt" DESC LIMIT 1)`,
      [ids.a, otpHash(`LOGIN_TWO_FACTOR:${ids.a}`, code)],
    );
    await setCode('123123');
    r = await call('POST', 'auth/2fa/verify', null, { challengeToken: challenge, code: '000000' });
    check('wrong 2FA code -> 401 Vietnamese', r.status === 401 && r.body?.message === 'Mã xác minh không đúng hoặc đã hết hạn.', r);
    r = await call('POST', 'auth/2fa/verify', null, { challengeToken: 'garbage', code: '123123' });
    check('bad challenge -> TWO_FACTOR_EXPIRED', r.status === 401 && r.body?.code === 'TWO_FACTOR_EXPIRED', r);
    r = await call('POST', 'auth/2fa/verify', null, { challengeToken: challenge, code: '123123' });
    const t2fa = r.body?.data?.accessToken;
    check('right 2FA code -> session', r.status === 200 && Boolean(t2fa) && r.body.data.user?.id === ids.a, r);
    r = await call('GET', 'users/me', t2fa);
    check('2FA session token works', r.status === 200, r);
    r = await call('POST', 'auth/2fa/verify', null, { challengeToken: challenge, code: '123123' });
    check('2FA code is single-use', r.status === 401, r);

    r = await call('POST', 'auth/2fa/resend', null, { challengeToken: challenge });
    check('resend 2FA code -> 200', r.status === 200, r);
    await setCode('456456');
    for (let i = 0; i < 5; i++) await call('POST', 'auth/2fa/verify', null, { challengeToken: challenge, code: '000000' });
    r = await call('POST', 'auth/2fa/verify', null, { challengeToken: challenge, code: '456456' });
    check('after 5 wrong attempts the code is dead', r.status === 401, r);

    r = await call('PATCH', 'auth/2fa', t2fa, { enabled: false, currentPassword: PASSWORD });
    check('turn off 2FA -> 200', r.status === 200 && r.body.data.twoFactorEnabled === false, r);
    r = await login('a');
    check('login without 2FA gives a token again', r.status < 300 && Boolean(r.body?.data?.accessToken), r);
  } finally {
    await clean();
    await db.end();
  }

  console.log(`\n${passed} passed, ${failed} failed`);
  process.exit(failed ? 1 : 0);
})().catch((e) => { console.error(e); process.exit(1); });
