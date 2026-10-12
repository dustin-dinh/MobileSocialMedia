// Tạo / xóa các tài khoản thử gaptest_a..d trực tiếp trong database (DIRECT_URL).
// a, b, c đã xác thực email; d chưa xác thực (để thử lỗi EMAIL_NOT_VERIFIED).
// Mật khẩu chung: Passw0rd!gap
//
//   node scripts/seed-test-users.cjs          tạo
//   node scripts/seed-test-users.cjs clean    xóa (kèm mọi dữ liệu của chúng)
//
// Dùng cho scripts/api-smoke.cjs và bộ test live của mobile. Không chạy trên database thật của người dùng.
const path = require('node:path');
require('dotenv').config({ path: path.join(__dirname, '..', '.env') });
const { Client } = require('pg');
const bcrypt = require('bcrypt');
const { randomUUID } = require('node:crypto');

(async () => {
  const client = new Client({ connectionString: process.env.DIRECT_URL });
  await client.connect();
  const mode = process.argv[2] ?? 'create';
  if (mode === 'clean') {
    const r = await client.query(`DELETE FROM "User" WHERE username LIKE 'gaptest\\_%'`);
    console.log('deleted', r.rowCount);
  } else {
    const hash = await bcrypt.hash('Passw0rd!gap', 10);
    for (const n of ['a', 'b', 'c', 'd']) {
      await client.query(
        `INSERT INTO "User"(id, username, email, "passwordHash", "emailVerifiedAt", "createdAt", "updatedAt")
         VALUES ($1,$2,$3,$4, $5, now(), now()) ON CONFLICT (username) DO NOTHING`,
        [randomUUID(), `gaptest_${n}`, `gaptest_${n}@example.invalid`, hash, n === 'd' ? null : new Date()],
      );
    }
    console.log('created');
  }
  await client.end();
})().catch((e) => { console.error(e); process.exit(1); });
