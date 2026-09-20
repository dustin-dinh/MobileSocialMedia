# DEV_A_WEEK1_API_INTEGRATION_GUIDE.md

> Hướng dẫn dành cho **Dev A – Mobile** để đồng bộ với Backend tuần 1, gọi các API Authentication và sử dụng Supabase PostgreSQL chung theo kiến trúc đã thống nhất.
>
> Stack hiện tại:
>
> ```text
> Mobile (React Native / Expo)
>        ↓ REST API
> NestJS Backend
>        ↓ Prisma
> Supabase PostgreSQL
> ```

---

# 1. Nguyên tắc quan trọng

Dev A **không kết nối trực tiếp Mobile vào PostgreSQL/Supabase Database**.

Luồng đúng:

```text
Mobile
  ↓
NestJS API
  ↓
Prisma
  ↓
Supabase PostgreSQL
```

Không làm:

```text
Mobile
  ↓
Supabase PostgreSQL trực tiếp
```

Vì vậy trong tuần 1:

- Mobile chỉ cần biết `API_BASE_URL`.
- `DATABASE_URL`, `DIRECT_URL`, `JWT_SECRET` chỉ dùng ở Backend.
- Không cần cài `@supabase/supabase-js` trên Mobile để làm Register/Login.
- Dev A chỉ cần thông tin Supabase nếu muốn **chạy Backend local trên máy A để tự test**.

---

# 2. API Week 1 hiện có

Base path:

```text
/api
```

Các route:

```text
POST /api/auth/register
POST /api/auth/login
GET  /api/users/me
POST /api/auth/logout
```

Trong đó:

```text
GET  /api/users/me
POST /api/auth/logout
```

là protected route và bắt buộc có JWT:

```http
Authorization: Bearer <access_token>
```

---

# 3. Register API

## Endpoint

```http
POST /api/auth/register
```

## Request body

```json
{
  "username": "test_user_1",
  "email": "test1@example.com",
  "password": "12345678"
}
```

## Validation hiện tại

### Username

```text
- String
- Tối thiểu 3 ký tự
- Tối đa 30 ký tự
- Chỉ cho phép:
  letters
  numbers
  dot .
  underscore _
```

Ví dụ hợp lệ:

```text
capt
capt_01
capt.dev
```

### Email

```text
- Email hợp lệ
- Tối đa 255 ký tự
```

### Password

```text
- String
- Tối thiểu 8 ký tự
- Tối đa 72 ký tự
```

---

## Response thành công

Status:

```text
201 Created
```

Ví dụ:

```json
{
  "data": {
    "id": "user-id",
    "username": "test_user_1",
    "email": "test1@example.com",
    "displayName": null,
    "bio": null,
    "avatarUrl": null,
    "createdAt": "..."
  }
}
```

Backend **không trả**:

```text
password
passwordHash
```

---

## Error thường gặp

Duplicate email:

```text
409 Conflict
```

Duplicate username:

```text
409 Conflict
```

Input sai:

```text
400 Bad Request
```

---

# 4. Login API

## Endpoint

```http
POST /api/auth/login
```

## Request body

```json
{
  "email": "test1@example.com",
  "password": "12345678"
}
```

## Response thành công

Status:

```text
200 OK
```

Ví dụ:

```json
{
  "data": {
    "accessToken": "eyJhbGciOi...",
    "user": {
      "id": "user-id",
      "username": "test_user_1",
      "email": "test1@example.com",
      "displayName": null,
      "bio": null,
      "avatarUrl": null
    }
  }
}
```

Sau khi login thành công, Mobile phải lưu:

```text
data.accessToken
```

để gọi protected API.

---

## Login sai

Sai password hoặc email không tồn tại:

```text
401 Unauthorized
```

Ví dụ:

```json
{
  "message": "Invalid email or password",
  "error": "Unauthorized",
  "statusCode": 401
}
```

---

# 5. Current User API

## Endpoint

```http
GET /api/users/me
```

Bắt buộc:

```http
Authorization: Bearer <access_token>
```

## Response thành công

```text
200 OK
```

Ví dụ:

```json
{
  "data": {
    "id": "user-id",
    "username": "test_user_1",
    "email": "test1@example.com",
    "displayName": null,
    "bio": null,
    "avatarUrl": null,
    "createdAt": "...",
    "updatedAt": "..."
  }
}
```

Không có token hoặc token sai:

```text
401 Unauthorized
```

---

# 6. Logout API

## Endpoint

```http
POST /api/auth/logout
```

Bắt buộc:

```http
Authorization: Bearer <access_token>
```

Response thành công:

```text
204 No Content
```

Sau khi nhận `204`, Mobile phải:

```text
1. Xóa accessToken khỏi local/secure storage
2. Clear auth state
3. Chuyển về màn hình Login
```

## Lưu ý

Backend hiện dùng **stateless JWT**.

Do đó logout hiện tại:

```text
Backend xác nhận token hợp lệ
        ↓
204
        ↓
Mobile xóa token
```

Backend chưa có Session/RefreshToken table để revoke token ngay lập tức.

---

# 7. Mobile nên cài thư viện gì?

## HTTP client

React Native có thể dùng `fetch()` built-in.

Nếu muốn quản lý request gọn hơn, có thể dùng Axios:

```bash
pnpm add axios
```

## Token storage

Nếu project đang dùng Expo, nên dùng SecureStore:

```bash
npx expo install expo-secure-store
```

Không hardcode JWT.

Không log access token ra console khi không cần.

---

# 8. Gợi ý API client trên Mobile

Ví dụ:

```ts
import axios from "axios";

export const api = axios.create({
  baseURL: process.env.EXPO_PUBLIC_API_BASE_URL,
  headers: {
    "Content-Type": "application/json",
  },
});
```

`.env` Mobile:

```env
EXPO_PUBLIC_API_BASE_URL=http://...
```

Register:

```ts
await api.post("/auth/register", {
  username,
  email,
  password,
});
```

Login:

```ts
const response = await api.post("/auth/login", {
  email,
  password,
});

const accessToken = response.data.data.accessToken;
```

---

# 9. Lưu accessToken

Với Expo SecureStore:

```ts
import * as SecureStore from "expo-secure-store";

await SecureStore.setItemAsync(
  "accessToken",
  accessToken,
);
```

Đọc:

```ts
const accessToken =
  await SecureStore.getItemAsync(
    "accessToken",
  );
```

Xóa khi logout:

```ts
await SecureStore.deleteItemAsync(
  "accessToken",
);
```

---

# 10. Gọi protected API

```ts
const accessToken =
  await SecureStore.getItemAsync(
    "accessToken",
  );

const response = await api.get(
  "/users/me",
  {
    headers: {
      Authorization:
        `Bearer ${accessToken}`,
    },
  },
);
```

Có thể thêm Axios interceptor sau khi flow cơ bản chạy ổn để tự attach token.

---

# 11. API Base URL theo môi trường

## Cùng máy / web test

```env
EXPO_PUBLIC_API_BASE_URL=http://localhost:3000/api
```

## Android Emulator

```env
EXPO_PUBLIC_API_BASE_URL=http://10.0.2.2:3000/api
```

## iOS Simulator

```env
EXPO_PUBLIC_API_BASE_URL=http://localhost:3000/api
```

## Điện thoại thật

Không dùng `localhost`.

Phải dùng LAN IP của máy chạy backend:

```env
EXPO_PUBLIC_API_BASE_URL=http://192.168.x.x:3000/api
```

Backend đã listen trên:

```text
0.0.0.0:3000
```

nên có thể nhận request qua LAN nếu firewall cho phép.

Khi deploy staging:

```env
EXPO_PUBLIC_API_BASE_URL=https://your-api-domain.com/api
```

---

# 12. Nếu Dev A muốn chạy Backend local

Cài pnpm nếu chưa có:

```bash
npm install -g pnpm
```

Pull source:

```bash
git checkout main
git pull origin main
```

Cài dependency:

```bash
pnpm install
```

---

# 13. `.env` Backend trên máy A

Dev A cần nhận riêng từ Dev B:

```text
DATABASE_URL
DIRECT_URL
JWT_SECRET
```

Tạo:

```text
apps/api/.env
```

Ví dụ:

```env
DATABASE_URL="..."
DIRECT_URL="..."
JWT_SECRET="..."
PORT=3000
```

Đây là cùng Supabase development DB mà Dev B đang dùng.

**Không commit `.env`.**

---

# 14. Prisma trên máy A

Sau khi pull:

```bash
cd apps/api
pnpm exec prisma generate
```

Hoặc nếu project có script:

```bash
pnpm prisma:generate
```

Sau đó:

```bash
pnpm start:dev
```

---

# 15. Dev A KHÔNG được chạy các lệnh này trên DB chung

Không chạy:

```bash
pnpm exec prisma migrate dev
```

Không chạy:

```bash
pnpm exec prisma db push
```

Không reset shared DB.

Không sửa table/column trực tiếp trên Supabase Dashboard.

Nếu schema cần thay đổi:

```text
Dev A báo Dev B
    ↓
Hai bên chốt field/API
    ↓
Dev B sửa schema
    ↓
Dev B tạo migration
    ↓
Dev B apply Supabase
    ↓
Dev B push
    ↓
Dev A pull
    ↓
Dev A prisma generate
```

---

# 16. Sau khi Dev B thay đổi schema

Dev A đồng bộ:

```bash
git pull origin main
pnpm install
```

Nếu dependency không đổi thì `pnpm install` có thể bỏ qua.

Sau đó:

```bash
cd apps/api
pnpm exec prisma generate
```

Restart backend:

```bash
pnpm start:dev
```

Dev A **không migrate shared DB lại**.

---

# 17. Có cần cài Supabase SDK trên máy A không?

Nếu chỉ chạy backend + database theo kiến trúc hiện tại thì **không cần**:

```bash
pnpm add @supabase/supabase-js
```

Backend truy cập Supabase PostgreSQL bằng:

```text
NestJS
 ↓
Prisma
 ↓
DATABASE_URL
 ↓
Supabase PostgreSQL
```

Supabase ở đây đang được dùng như **managed PostgreSQL**.

Chỉ cân nhắc `@supabase/supabase-js` sau này nếu nhóm dùng thêm Supabase Storage cho avatar/post media.

Không tự thêm Supabase Auth vào Mobile vì authentication hiện đang do NestJS + JWT quản lý.

---

# 18. Không được trộn hai hệ Auth

Project hiện tại:

```text
Mobile
 ↓
NestJS Auth
 ↓
JWT
```

Không tự chuyển sang:

```text
Mobile
 ↓
Supabase Auth
```

nếu chưa thống nhất.

---

# 19. Flow Mobile Week 1

```text
Register Screen
   ↓
POST /auth/register
   ↓
Register success

Login Screen
   ↓
POST /auth/login
   ↓
Save accessToken
   ↓
GET /users/me
   ↓
Set currentUser
   ↓
Main Navigation
```

Logout:

```text
User nhấn Logout
   ↓
POST /auth/logout
   ↓
204
   ↓
Delete accessToken
   ↓
Clear currentUser
   ↓
Login Screen
```

---

# 20. Error handling Dev A cần xử lý

Register:

```text
400 → input không hợp lệ
409 → email hoặc username đã tồn tại
```

Login:

```text
400 → body sai format
401 → email/password không đúng
```

Protected API:

```text
401 → token thiếu / sai / hết hạn
```

Khi `/users/me` trả `401`, Mobile có thể:

```text
xóa token
↓
clear auth state
↓
về Login
```

---

# 21. Test tối thiểu Dev A cần thực hiện

```text
[ ] Register account mới → thành công
[ ] Register duplicate email → hiện lỗi
[ ] Register duplicate username → hiện lỗi

[ ] Login đúng → nhận token
[ ] Login sai → hiện lỗi

[ ] Token được lưu
[ ] GET /users/me → lấy đúng user

[ ] Restart app → đọc token lại
[ ] Nếu token tồn tại → thử /users/me

[ ] Logout → API 204
[ ] Logout → token bị xóa khỏi Mobile
[ ] Logout → quay lại Login
```

---

# 22. API summary

| Method | Route | Auth | Success |
|---|---|---|---:|
| POST | `/api/auth/register` | No | 201 |
| POST | `/api/auth/login` | No | 200 |
| GET | `/api/users/me` | Bearer JWT | 200 |
| POST | `/api/auth/logout` | Bearer JWT | 204 |

---

# 23. Quy tắc phối hợp Dev A / Dev B

## Dev A

```text
- Mobile UI
- API integration
- Token storage
- Auth state
- Navigation
- Loading / Error / Success UI
```

## Dev B

```text
- NestJS
- Prisma
- Supabase PostgreSQL
- Migration
- JWT
- API contract
```

Nếu Mobile cần backend thay đổi:

```text
Dev A
 ↓
ghi rõ yêu cầu
 ↓
trao đổi Dev B
 ↓
chốt API contract
 ↓
Dev B implement
 ↓
test Postman
 ↓
Dev A integrate
```

Không tự đổi API field ở một phía.

---

# 24. Checklist khi Dev A pull code mới

```text
[ ] git pull
[ ] pnpm install nếu dependency đổi
[ ] apps/api/.env vẫn tồn tại
[ ] Không commit .env
[ ] pnpm exec prisma generate
[ ] pnpm start:dev
[ ] Test /auth/login
[ ] Test /users/me
[ ] Mobile trỏ đúng API_BASE_URL
```

---

# 25. Những điều Dev A không cần làm trong Week 1

```text
❌ Tạo migration mới
❌ prisma db push
❌ sửa Supabase table
❌ cài Supabase Auth
❌ lưu password
❌ lưu passwordHash
❌ tự tạo JWT
❌ gửi userId để giả lập current user
```

Mobile chỉ:

```text
gửi credentials
↓
nhận accessToken từ backend
↓
gửi Bearer token cho protected API
```

---

# 26. Definition of Done Week 1 giữa A và B

Flow này phải chạy thật:

```text
Mobile Register
      ↓
NestJS
      ↓
Prisma
      ↓
Supabase
      ↓
User created

Mobile Login
      ↓
NestJS
      ↓
JWT
      ↓
Mobile save token

Mobile
      ↓
GET /users/me
      ↓
JWT Guard
      ↓
Current User

Mobile Logout
      ↓
POST /auth/logout
      ↓
204
      ↓
Delete token
      ↓
Login Screen
```

Nếu toàn bộ flow trên chạy được thì integration Auth Week 1 hoàn thành.
