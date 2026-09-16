# Hướng dẫn Dev A: cài môi trường local và nhận cấu hình Backend

Tài liệu này dành cho Dev A. Mục tiêu là cài lại các dependency không được lưu trên Git và, khi cần chạy Backend local, nhận cấu hình kết nối qua kênh riêng.

## Nguyên tắc bảo mật

- Git chứa `package.json`, `pnpm-lock.yaml`, source code và `.env.example`; Git **không** chứa `node_modules`, Prisma Client đã generate, `dist`, hoặc bất kỳ file `.env` nào.
- Không gửi `DATABASE_URL`, `DIRECT_URL`, `JWT_SECRET`, password database, access token, hay ảnh chụp màn hình chứa các giá trị này qua Git, Pull Request, issue, tài liệu, hoặc chat công khai.
- Dev A chỉ cần nhận `.env` nếu cần chạy `apps/api` local. Nếu chỉ chạy Mobile, không cần database URL; chỉ cần `EXPO_PUBLIC_API_BASE_URL` sau khi API contract đã được xác nhận.
- Dev A có thể dùng Prisma Studio để xem dữ liệu test, nhưng không sửa schema trên Supabase Dashboard và không tạo/apply migration vào shared database.

## Yêu cầu

- Node.js 22 hoặc mới hơn.
- Corepack và pnpm 12.4.1. Dự án có hai package độc lập: `apps/mobile` và `apps/api`; cài dependency trong đúng thư mục tương ứng.
- Đã clone repository và checkout đúng branch đã được Dev B merge.

## Các file phải cài lại ở mỗi máy

Các mục sau bị `.gitignore` và phải được cài/sinh lại local:

| Thành phần | Cách tạo | Không commit vì |
|---|---|---|
| `apps/mobile/node_modules/` | Chạy pnpm trong `apps/mobile` | Dependency cài từ lockfile |
| `apps/api/node_modules/` | Chạy pnpm trong `apps/api` | Dependency cài từ lockfile |
| `apps/api/src/generated/prisma/` | Chạy `prisma:generate` trong `apps/api` | Prisma Client được sinh từ schema |
| `apps/api/dist/` | Chạy `build` | Output biên dịch |
| `apps/api/.env` | Dev A tự tạo từ `.env.example` | Chứa secret cục bộ |

## Bước 1: cập nhật code

Từ thư mục gốc repository:

```powershell
git checkout main
git pull origin main
```

Nếu Dev B yêu cầu một feature branch để test, checkout branch đó thay vì `main`.

## Bước 2: cài Mobile dependencies

Chỉ cần khi Dev A làm hoặc chạy Mobile:

```powershell
cd apps/mobile
corepack pnpm@12.4.1 install --frozen-lockfile
corepack pnpm@12.4.1 typecheck
```

## Bước 3: cài Backend dependencies

Chỉ cần khi Dev A cần chạy/test Backend local:

```powershell
cd apps/api
corepack pnpm@12.4.1 install --frozen-lockfile
```

`--frozen-lockfile` đảm bảo Dev A cài đúng phiên bản đã được Dev B kiểm tra. Không dùng `npm install` hoặc `yarn` trong hai package này.

## Bước 4: Dev B chuyển cấu hình `.env` qua kênh riêng

Dev B gửi các giá trị qua công cụ quản lý mật khẩu có chức năng chia sẻ secret, hoặc một kênh riêng được hai người thống nhất và có mã hóa đầu cuối. Dev A không nhận file `.env` qua Git.

Các giá trị cần gửi chỉ dành cho development shared database:

```text
DATABASE_URL
DIRECT_URL
JWT_SECRET
PORT=3000
```

Dev A tạo file local, không copy vào Git:

```powershell
cd apps/api
Copy-Item .env.example .env
```

Sau đó dán các giá trị được Dev B gửi vào `.env`. Nên gửi nguyên hai connection string Supabase đã copy từ **Project → Connect → ORM → Prisma**, không tự ghép hostname, project reference, port hoặc password.

Ví dụ cấu trúc file (chỉ là placeholder, không dùng các giá trị này):

```env
DATABASE_URL="postgresql://..."
DIRECT_URL="postgresql://..."
JWT_SECRET="..."
PORT=3000
```

Sau khi Dev A xác nhận đã lưu được `.env`, Dev B nên xoá hoặc thu hồi secret khỏi kênh chia sẻ nếu công cụ hỗ trợ. Khi database password hoặc `JWT_SECRET` bị thay đổi, Dev B phải gửi lại thông tin mới qua kênh riêng.

> Dùng cùng `JWT_SECRET` chỉ phù hợp development để token test giữa hai máy tương thích. Không dùng chung secret này cho production.

## Bước 5: sinh Prisma Client và kiểm tra kết nối

Sau khi `.env` đã có đầy đủ thông tin:

```powershell
cd apps/api
corepack pnpm@12.4.1 prisma:validate
corepack pnpm@12.4.1 prisma:generate
corepack pnpm@12.4.1 start:dev
```

Nếu cần xem dữ liệu test:

```powershell
corepack pnpm@12.4.1 exec prisma studio
```

Không chạy các lệnh sau trên shared development DB:

```powershell
corepack pnpm@12.4.1 exec prisma migrate dev --name init
corepack pnpm@12.4.1 exec prisma db push
```

Migration chỉ do Dev B tạo và apply. Sau một DB change đã merge, Dev A chỉ cần `git pull`, cài lại dependency nếu lockfile đổi, chạy `prisma:generate`, rồi restart Backend local.

## Xử lý sự cố

- `DIRECT_URL is not set`: `.env` thiếu `DIRECT_URL`, sai tên biến, hoặc command không chạy trong `apps/api`.
- Không kết nối được database: yêu cầu Dev B gửi lại nguyên connection string từ Supabase Connect; không tự đổi host hoặc port.
- Prisma Client import error: chạy lại `corepack pnpm@12.4.1 prisma:generate` trong `apps/api`.
- Thiếu package: chạy lại `corepack pnpm@12.4.1 install --frozen-lockfile` trong đúng package.
- Endpoint Auth chưa gọi được: kiểm tra `docs/api-contract.md`. Mobile không được tự đoán endpoint, response hoặc token field.

## Checklist Dev A

- [ ] Đã `git pull` đúng branch.
- [ ] Đã cài dependency trong đúng package cần dùng.
- [ ] Đã tạo `.env` local tại `apps/api/.env` khi cần Backend.
- [ ] Không commit, upload, hoặc chụp màn hình `.env`.
- [ ] Đã chạy `prisma:generate` sau khi nhận `.env` hoặc sau DB change.
- [ ] Không chạy migration hoặc `db push` vào shared database.
- [ ] Đã đọc API contract trước khi tích hợp Mobile.
