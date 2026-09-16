# BACKEND_SUPABASE_COLLAB_GUIDE.md

> Hướng dẫn cấu hình Backend + Supabase PostgreSQL và quy tắc phối hợp giữa Dev A / Dev B cho dự án Mobile Social Network MVP.
>
> **Mục tiêu:** hai thành viên có thể làm việc ở hai nơi khác nhau, dùng chung một database online, không phụ thuộc Radmin/VPN hoặc máy của nhau, đồng thời giữ Prisma schema và database luôn đồng bộ.

---

## 1. Kiến trúc thống nhất

Stack backend hiện tại:

```text
Mobile App
    ↓ REST/JSON
NestJS + TypeScript
    ↓
Prisma ORM
    ↓
Supabase PostgreSQL
```

Trong development:

```text
Dev A                                  Dev B
Mobile / API local (khi cần)           NestJS API local
            │                              │
            └────────────┬─────────────────┘
                         │ Internet
                         ▼
                 Supabase PostgreSQL
                  Development DB chung
```

### Nguyên tắc quan trọng

- Mobile **không kết nối trực tiếp PostgreSQL**.
- Chỉ Backend được giữ `DATABASE_URL`.
- Dev A và Dev B có thể cùng dùng một Supabase project.
- Không cần Radmin VPN để truy cập database.
- Database schema được quản lý bằng **Prisma Migration**, không sửa tay trên Supabase Dashboard.
- `.env` không được commit lên Git.

---

## 2. Vai trò của Dev A và Dev B

### Dev A — Mobile

Trách nhiệm chính:

- Mobile UI.
- Tích hợp REST API.
- Lưu token.
- Navigation.
- Test các API từ mobile.
- Báo cho Dev B khi một feature cần thay đổi schema hoặc API contract.

Dev A được phép:

- Pull backend về máy để chạy/test.
- Dùng database development chung.
- Query DB thông qua backend.
- Chạy `prisma generate`.
- Tạo dữ liệu test thông qua API.

Dev A **không tự tạo migration cho DB chung**.

### Dev B — Backend / Database Owner

Trách nhiệm chính:

- NestJS backend.
- Prisma.
- Supabase PostgreSQL.
- Database schema.
- Migration.
- Authentication.
- API contract.
- Test API.

Dev B là **owner của database schema và migration** trong MVP.

Điều này không có nghĩa Dev B tự ý đổi schema. Thay đổi vẫn phải trao đổi nếu ảnh hưởng đến Dev A hoặc API contract.

---

## 3. Quyền thực hiện các thao tác DB

| Thao tác | Dev A | Dev B |
|---|---:|---:|
| Dùng Supabase development DB | ✅ | ✅ |
| Chạy backend local | ✅ | ✅ |
| Query thông qua Prisma/backend | ✅ | ✅ |
| Tạo test data qua API | ✅ | ✅ |
| `prisma generate` | ✅ | ✅ |
| Đề xuất schema change | ✅ | ✅ |
| Sửa `schema.prisma` | Trao đổi trước | ✅ Owner |
| Tạo migration | ❌ | ✅ |
| Apply migration vào DB chung | ❌ | ✅ |
| `prisma db push` vào DB chung | ❌ | ❌ |
| Sửa table/column trực tiếp trên Supabase Dashboard | ❌ | ❌ |
| Commit `.env` | ❌ | ❌ |

---

## 4. Supabase project

Chỉ cần **một Supabase project development chung** cho hai người.

Ví dụ:

```text
Project: mobile-social-network-dev
Database: PostgreSQL
```

Trong Supabase:

```text
Project
→ Connect
→ ORM
→ Prisma
```

Sử dụng hai connection URL:

```text
DATABASE_URL
DIRECT_URL
```

### DATABASE_URL

Dùng cho application runtime:

```text
NestJS
  ↓
Prisma Client
  ↓
DATABASE_URL
  ↓
Supabase Transaction Pooler
```

Thông thường sử dụng Supavisor Transaction Pooler, port `6543`.

### DIRECT_URL

Dùng cho Prisma CLI:

```text
prisma migrate
prisma studio
prisma introspection
       ↓
DIRECT_URL
       ↓
Supabase Session/Direct connection
```

Thông thường Session Pooler sử dụng port `5432`.

> Luôn copy connection string trực tiếp từ Supabase Project → Connect. Không tự đoán host, project ref hoặc region.

---

## 5. Environment variables

### `apps/api/.env`

File này tồn tại riêng trên từng máy và **không được commit**.

```env
DATABASE_URL="postgresql://..."
DIRECT_URL="postgresql://..."
JWT_SECRET="development-secret"
PORT=3000
```

Dev A và Dev B dùng **cùng database URLs** nếu đang sử dụng chung development DB.

Có thể dùng cùng `JWT_SECRET` trong development để token test tương thích giữa hai môi trường local.

### `apps/api/.env.example`

File này được commit:

```env
DATABASE_URL=
DIRECT_URL=
JWT_SECRET=
PORT=
```

Không đưa secret thật vào `.env.example`.

### `.gitignore`

Phải có:

```gitignore
.env
.env.local
```

---

## 6. Cài Prisma cho Backend

Từ:

```bash
cd apps/api
```

Dự án dùng `pnpm`, không trộn `npm`, `yarn` hoặc `pnpm`.

Cài dependency:

```bash
pnpm add @prisma/client @prisma/adapter-pg pg dotenv
pnpm add -D prisma @types/pg
```

Nếu NestJS chưa có ConfigModule:

```bash
pnpm add @nestjs/config
```

Khởi tạo Prisma nếu project chưa có:

```bash
pnpm exec prisma init
```

---

## 7. Cấu hình `prisma.config.ts`

File:

```text
apps/api/prisma.config.ts
```

Cấu hình Prisma CLI sử dụng `DIRECT_URL`:

```ts
import "dotenv/config";
import { defineConfig, env } from "prisma/config";

export default defineConfig({
  schema: "prisma/schema.prisma",
  datasource: {
    url: env("DIRECT_URL"),
  },
});
```

Quy ước:

```text
DATABASE_URL = runtime
DIRECT_URL   = migration / Prisma CLI
```

Không đổi vai trò hai URL nếu chưa có lý do kỹ thuật rõ ràng.

---

## 8. `schema.prisma`

File:

```text
apps/api/prisma/schema.prisma
```

Khởi tạo:

```prisma
generator client {
  provider = "prisma-client"
  output   = "../src/generated/prisma"
}

datasource db {
  provider = "postgresql"
}
```

Database URL được Prisma CLI lấy từ `prisma.config.ts`, không hardcode trong schema.

### Core models của MVP

Schema MVP được thiết kế xoay quanh:

```text
User
Post
Follow
Like
Comment
Notification
PostMedia
```

Các constraint tối thiểu cần giữ:

```text
User.username UNIQUE
User.email UNIQUE
Follow(followerId, followingId) UNIQUE
Like(userId, postId) UNIQUE
```

Comment nên chuẩn bị:

```text
parentCommentId nullable
```

để hỗ trợ reply.

Media dùng:

```text
Post
  ↓
PostMedia
```

không tạo:

```text
Post.image1
Post.image2
Post.image3
```

---

## 9. NestJS ↔ Prisma

Cấu trúc khuyến nghị:

```text
apps/api/
├── prisma/
│   ├── schema.prisma
│   └── migrations/
│
├── src/
│   ├── generated/
│   │   └── prisma/
│   │
│   ├── prisma/
│   │   ├── prisma.module.ts
│   │   └── prisma.service.ts
│   │
│   └── modules/
│       ├── auth/
│       ├── users/
│       ├── posts/
│       ├── follows/
│       ├── likes/
│       ├── comments/
│       └── notifications/
│
├── prisma.config.ts
├── .env
└── .env.example
```

Runtime flow:

```text
Controller
    ↓
Service
    ↓
PrismaService
    ↓
DATABASE_URL
    ↓
Supabase PostgreSQL
```

Không khởi tạo `PrismaClient` riêng trong từng service.

---

## 10. Migration lần đầu — Dev B thực hiện

Sau khi `schema.prisma` đã được review:

```bash
cd apps/api
pnpm exec prisma migrate dev --name init
pnpm exec prisma generate
```

Kiểm tra Supabase Table Editor xem các table đã được tạo.

Sau đó commit:

```text
prisma/schema.prisma
prisma/migrations/
prisma.config.ts
.env.example
```

Không commit:

```text
.env
```

Commit message ví dụ:

```bash
git commit -m "chore(db): setup prisma with supabase"
```

---

## 11. Setup máy Dev A lần đầu

Sau khi Dev B merge/push phần database setup:

```bash
git checkout main
git pull origin main
pnpm install
```

Dev A tự tạo:

```text
apps/api/.env
```

và nhận connection strings qua kênh riêng:

```env
DATABASE_URL="..."
DIRECT_URL="..."
JWT_SECRET="..."
PORT=3000
```

Sau đó:

```bash
cd apps/api
pnpm exec prisma generate
```

Nếu cần chạy backend local:

```bash
pnpm dev
```

hoặc script tương ứng của project.

### Dev A KHÔNG chạy migration init lại

Không chạy:

```bash
pnpm exec prisma migrate dev --name init
```

Không chạy:

```bash
pnpm exec prisma db push
```

vào shared development DB.

Database đã được Dev B migrate.

---

## 12. Quy trình thay đổi schema

Ví dụ Dev A đang làm Profile và cần:

```text
User.avatarUrl
```

Quy trình bắt buộc:

```text
Dev A phát hiện nhu cầu
        ↓
Trao đổi với Dev B
        ↓
Chốt field / type / API contract
        ↓
Dev B sửa schema.prisma
        ↓
Dev B tạo migration
        ↓
Migration apply vào Supabase
        ↓
Dev B test
        ↓
Dev B commit + PR
        ↓
Merge
        ↓
Dev A git pull
        ↓
Dev A prisma generate
        ↓
Tiếp tục code
```

Ví dụ migration:

```bash
pnpm exec prisma migrate dev --name add-user-avatar
pnpm exec prisma generate
```

---

## 13. Khi Dev A cần đồng bộ sau DB change

Dev A:

```bash
git checkout main
git pull origin main
```

Nếu dependency thay đổi:

```bash
pnpm install
```

Sau đó:

```bash
cd apps/api
pnpm exec prisma generate
```

Restart backend local.

Dev A **không cần migrate DB lại**, vì shared Supabase database đã được Dev B apply migration.

---

## 14. Quy trình Git cho DB change

Không code trực tiếp vào `main`.

Ví dụ Dev B:

```bash
git checkout main
git pull origin main
git checkout -b feat/user-avatar
```

Thực hiện:

```text
schema change
→ migration
→ backend change
→ test
```

Commit:

```bash
git add .
git commit -m "feat(user): add avatar support"
git push
```

Tạo Pull Request.

PR phải ghi rõ nếu có DB change:

```md
## Database changes

- Added `User.avatarUrl`
- Migration: `...`
- Existing data impact: nullable, no backfill required

## How to test

1. Pull branch
2. Run `pnpm install`
3. Run `pnpm exec prisma generate`
4. Start API
5. Test endpoint ...
```

---

## 15. Database rules

### Không chỉnh schema trực tiếp trên Supabase

Sai:

```text
Supabase Dashboard
→ Table Editor
→ Add column manually
```

Đúng:

```text
schema.prisma
→ Prisma migration
→ Supabase
```

`schema.prisma` + `migrations/` là source of truth của database structure.

### Không dùng `db push` cho shared DB

Không sử dụng:

```bash
prisma db push
```

để thay đổi shared development DB trong workflow chính.

Lý do: `db push` có thể đồng bộ schema mà không tạo migration history phù hợp.

Shared DB phải thay đổi bằng migration.

### Không xóa migration đã apply

Nếu migration đã được apply vào Supabase và merge:

```text
KHÔNG:
- rename tùy tiện
- sửa nội dung cũ
- xóa migration
```

Nếu cần sửa tiếp:

```text
Tạo migration mới.
```

### Không reset shared database tùy tiện

Không chạy các thao tác có khả năng reset/drop dữ liệu development chung khi chưa thống nhất.

Nếu cần reset:

1. Thông báo Dev A.
2. Backup nếu cần.
3. Xác nhận dữ liệu test có thể mất.
4. Dev B thực hiện.
5. Seed lại.
6. Thông báo hoàn tất.

---

## 16. Test data

Nên sử dụng account test cố định:

```text
test_user_1
test_user_2
test_user_3
```

Không dùng tài khoản cá nhân thật làm dữ liệu demo chính.

Không commit password thật vào source code.

Nếu có seed:

```text
prisma/
├── schema.prisma
├── migrations/
└── seed.ts
```

Seed phải có thể chạy lại để tạo môi trường demo.

---

## 17. API contract rule

Trước khi Dev A tích hợp API phải thống nhất:

```text
HTTP Method
URL
Authentication
Request Body
Params
Success Response
Error Response
```

Ví dụ:

```http
POST /api/auth/login
```

Success:

```json
{
  "data": {
    "accessToken": "...",
    "user": {}
  }
}
```

Error:

```json
{
  "error": {
    "code": "INVALID_CREDENTIALS",
    "message": "Invalid email or password"
  }
}
```

Dev B không tự đổi tên field sau khi Dev A đã tích hợp mà không thông báo.

---

## 18. Authentication rule

Protected endpoint:

```http
Authorization: Bearer <access_token>
```

Backend lấy current user từ JWT/token.

Không tin:

```json
{
  "userId": "..."
}
```

do client gửi để xác định current user.

Ví dụ tạo post:

```text
JWT → currentUser.id
```

không dùng:

```text
body.userId
```

để xác định author.

---

## 19. Branch / commit / PR rules

Branch:

```text
feat/auth-login
feat/create-post
feat/follow-system
chore/db-setup
fix/auth-token
```

Commit:

```text
type(scope): short description
```

Ví dụ:

```text
chore(db): setup prisma with supabase
feat(auth): implement register endpoint
feat(auth): implement login endpoint
feat(user): add avatar field
fix(auth): handle duplicate email registration
```

Ưu tiên:

```text
1 logical change = 1 commit
```

Mọi thay đổi đi qua PR.

---

## 20. Điều Codex / AI assistant PHẢI tuân thủ

Khi dùng Codex hoặc AI coding agent trong repository, cung cấp file này làm context và yêu cầu agent tuân thủ các rule sau.

### Không tự thay đổi architecture

Agent không được tự ý:

- Đổi NestJS sang framework khác.
- Đổi Prisma sang ORM khác.
- Đổi PostgreSQL/Supabase.
- Thêm Redis.
- Thêm Kafka.
- Chuyển sang microservices.
- Chuyển REST sang GraphQL.
- Thay authentication strategy.

Nếu task yêu cầu thay đổi lớn, agent phải dừng và báo trước.

### Không tự sửa DB ngoài scope

Agent không được:

- Tự thêm/xóa table ngoài yêu cầu.
- Tự rename field đang dùng.
- Tự chạy `prisma db push` vào shared DB.
- Tự reset database.
- Tự sửa migration đã apply.
- Tự sửa Supabase schema bằng SQL/Dashboard khi không được yêu cầu.

Nếu cần schema change:

```text
1. Giải thích thay đổi cần thiết.
2. Liệt kê model/field bị ảnh hưởng.
3. Chờ Dev B xác nhận.
4. Tạo migration mới.
```

### Không commit secret

Agent không được đưa vào source:

```text
DATABASE_URL thật
DIRECT_URL thật
JWT_SECRET thật
Supabase service role key
password
access token
```

Chỉ sử dụng:

```text
.env.example
```

với placeholder.

### Không phá API contract

Nếu endpoint đã tồn tại:

```text
method
path
request
response
```

không tự ý thay đổi nếu task không yêu cầu.

Nếu bắt buộc phải đổi:

```text
- nêu breaking change
- liệt kê Mobile bị ảnh hưởng
- cập nhật docs
```

### Ưu tiên MVP

Không tự thêm feature ngoài scope chỉ vì "best practice".

Ưu tiên:

```text
Correctness
Stability
Readable Code
Maintainability
Demoability
```

Không overengineering.

---

## 21. Prompt gợi ý để đưa cho Codex

Có thể dùng prompt sau trước mỗi task backend:

```text
Read BACKEND_SUPABASE_COLLAB_GUIDE.md and RULE.md before making changes.

Project stack:
- NestJS
- TypeScript
- Prisma
- Supabase PostgreSQL
- pnpm
- REST API

Important:
- Dev B owns database migrations.
- Do not use prisma db push on the shared database.
- Do not modify an already-applied migration.
- Do not commit .env or secrets.
- Do not change architecture, API contracts, auth strategy, schema, or major dependencies unless the task explicitly requires it.
- Keep the change within the requested scope.
- Follow the existing project structure and naming conventions.
- Before editing database schema, explain the proposed change and affected models.
- If schema changes are needed, create a new Prisma migration rather than editing the database manually.
- At the end, report:
  1. Files changed
  2. Database changes
  3. API changes
  4. Commands to run
  5. How to test
  6. Anything Dev A must sync
```

---

## 22. Checklist cho Dev B trước khi push DB/backend change

```text
[ ] Đúng branch
[ ] Đã pull main mới nhất
[ ] Không có .env / secret
[ ] schema.prisma đúng
[ ] Migration mới đã được tạo nếu schema thay đổi
[ ] Không sửa migration cũ đã apply
[ ] Supabase migration thành công
[ ] prisma generate thành công
[ ] Backend build được
[ ] API liên quan đã test
[ ] Error handling cơ bản có
[ ] API contract đã ghi rõ
[ ] PR ghi DB impact nếu có
```

---

## 23. Checklist cho Dev A sau khi Dev B merge

```text
[ ] git pull origin main
[ ] pnpm install nếu dependency thay đổi
[ ] apps/api/.env tồn tại
[ ] DATABASE_URL đúng
[ ] DIRECT_URL đúng
[ ] pnpm exec prisma generate
[ ] Restart backend nếu đang chạy
[ ] Test API liên quan
[ ] Không chạy migration vào shared DB
```

---

## 24. Workflow tổng quát

```text
                 DEV B
                   │
          schema / backend change
                   ↓
             create migration
                   ↓
            Supabase updated
                   ↓
                test API
                   ↓
              commit + PR
                   ↓
                 merge
                   │
                   ▼
                 DEV A
                   │
                git pull
                   ↓
             pnpm install
             (nếu cần)
                   ↓
             prisma generate
                   ↓
          mobile integration/test
```

---

## 25. Definition of Done cho một thay đổi full-stack

Một feature chỉ được xem là hoàn thành khi chạy được:

```text
Mobile
  ↓
Backend API
  ↓
Prisma
  ↓
Supabase PostgreSQL
  ↓
API Response
  ↓
Mobile UI
```

Không xem feature là DONE chỉ vì:

```text
"đã viết code"
```

Phải test end-to-end.

---

## 26. Ghi nhớ nhanh

```text
Supabase = DB chung online.

Dev B = migration owner.

Dev A + Dev B = cùng dùng DB, cùng test data.

schema.prisma + migrations = source of truth.

.env = local secret, không commit.

DATABASE_URL = runtime.

DIRECT_URL = Prisma CLI / migration.

Không sửa DB bằng Dashboard.

Không prisma db push vào shared DB.

Dev B migrate → push → Dev A pull → prisma generate.
```

---

## Quy tắc quan trọng nhất

> **Mọi thay đổi database phải có migration, mọi migration shared DB do Dev B quản lý, và Dev A luôn đồng bộ bằng Git + `prisma generate` thay vì tự thay đổi database.**
