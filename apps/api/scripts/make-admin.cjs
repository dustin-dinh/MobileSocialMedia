// Cấp (hoặc thu hồi) quyền quản trị cho một tài khoản theo email.
//
//   node scripts/make-admin.cjs someone@example.com          cấp quyền
//   node scripts/make-admin.cjs someone@example.com remove   thu hồi
//
// Trang quản trị: http://localhost:3000/api/admin
const path = require('node:path');
require('dotenv').config({ path: path.join(__dirname, '..', '.env') });
const { Client } = require('pg');

(async () => {
  const [email, mode] = process.argv.slice(2);
  if (!email) {
    console.error('Usage: node scripts/make-admin.cjs <email> [remove]');
    process.exit(1);
  }
  const client = new Client({ connectionString: process.env.DIRECT_URL });
  await client.connect();
  const role = mode === 'remove' ? 'USER' : 'ADMIN';
  const result = await client.query('UPDATE "User" SET role = $1 WHERE lower(email) = lower($2)', [role, email]);
  console.log(result.rowCount ? `${email} -> ${role}` : `No account with email ${email}`);
  await client.end();
  process.exit(result.rowCount ? 0 : 1);
})().catch((error) => { console.error(error.message); process.exit(1); });
