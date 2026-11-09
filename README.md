# MobileSocialMedia

Mạng xã hội trên di động: ứng dụng Expo / React Native (`apps/mobile`) và backend NestJS + Prisma + Supabase (`apps/api`).

## Yêu cầu

- Node.js và Corepack (dự án dùng pnpm 12.4.1 qua Corepack).
- File `apps/api/.env` đã điền đủ giá trị (mẫu ở `apps/api/.env.example`).
- Expo Go bản hỗ trợ SDK 57 trên BlueStacks hoặc điện thoại.
- Docker Desktop (để chạy kho lưu ảnh và video MinIO).

## Chạy dự án

Bật kho lưu tệp, rồi mở hai cửa sổ terminal: một cho backend, một cho mobile. Chạy backend trước.

### 0. Kho lưu ảnh và video (MinIO)

Mở Docker Desktop, rồi chạy ở thư mục gốc của dự án:

```bash
docker compose up -d
```

Chỉ cần chạy một lần; container tự bật lại cùng Docker. Ảnh, ảnh đại diện và video mới được lưu ở đây (cổng 9000; trang quản trị ở `http://localhost:9001`, tài khoản `minioadmin` / `minioadmin`). Backend tự tạo bucket khi khởi động. Tệp nằm trên máy này: xoá volume `minio-data` là mất hết ảnh và video đã đăng.

### 1. Backend

```bash
cd apps/api
corepack pnpm install
corepack pnpm prisma:generate
corepack pnpm start:dev
```

Backend chạy ở `http://localhost:3000/api`. Hai lệnh đầu chỉ cần chạy lại khi vừa lấy code mới.

Ảnh gửi trong tin nhắn và ảnh bài viết được kiểm tra và làm mờ nếu nhạy cảm. Mô hình nhận diện (~88 MB) không nằm trong git; tải một lần:

```bash
cd apps/api
node scripts/download-moderation-model.cjs
```

Không tải thì backend vẫn chạy, chỉ là ảnh tin nhắn và ảnh bài viết không được làm mờ (trang quản trị sẽ báo). Chi tiết ở [docs/moderation/MODERATION_PLAN.md](docs/moderation/MODERATION_PLAN.md).

Khi code mới có thêm migration (thư mục `apps/api/prisma/migrations`), áp chúng lên database trước khi chạy:

```bash
cd apps/api
corepack pnpm exec prisma migrate deploy
```

Khi không dùng được database Supabase chung, có thể chạy PostgreSQL cục bộ (cổng máy **5433**):

```bash
docker compose --profile localdb up -d postgres
```

Rồi đặt `DATABASE_URL` và `DIRECT_URL` là `postgresql://postgres:postgres@localhost:5433/mobilesocial`, áp migration như trên. Biến đặt trong shell được ưu tiên hơn `.env`. Chi tiết ở [docs/handover/cai-dat-va-chay.md](docs/handover/cai-dat-va-chay.md).

### 2. Mobile

```bash
cd apps/mobile
corepack pnpm install
corepack pnpm start:lan
```

Sau đó mở dự án trong Expo Go:

| Thiết bị | Cách mở |
|---|---|
| BlueStacks | Trong Expo Go chọn "Enter URL manually", nhập `exp://10.0.2.2:8081` |
| Điện thoại Android | Quét mã QR Metro in ra bằng Expo Go |
| iPhone | Quét mã QR bằng app Camera, hoặc mở Safari và nhập `exp://<IP máy tính>:8081` |

Điện thoại phải cùng mạng Wi-Fi với máy tính.

Ứng dụng tự gọi backend ở cổng 3000 trên chính máy đang chạy Metro, nên không cần cấu hình địa chỉ API khi chạy trên máy mình. Chỉ đặt `EXPO_PUBLIC_API_BASE_URL` trong `apps/mobile/.env.local` khi backend nằm ở nơi khác. Metro in ra địa chỉ đang dùng ở dòng `[api] Backend URL: …`.

### Chạy giao diện không cần backend

Thêm dòng sau vào `apps/mobile/.env.local` rồi chạy lại Metro. Ứng dụng sẽ bỏ qua đăng nhập và dùng dữ liệu mẫu:

```
EXPO_PUBLIC_USE_MOCK=true
```

Mỗi lần sửa `.env.local` phải tắt Metro và chạy lại với `corepack pnpm start:lan --clear`.

## Trang quản trị

Trang web để duyệt báo cáo, gỡ nội dung, khoá và mở khoá tài khoản, xem số liệu. Mở khi backend đang chạy:

```
http://localhost:3000/api/admin
```

Đăng nhập bằng một tài khoản có quyền quản trị. Cấp quyền cho một tài khoản theo email (chạy trong `apps/api`):

```bash
node scripts/make-admin.cjs email-cua-ban@example.com
```

Thêm `remove` ở cuối lệnh để thu hồi quyền.

## Lỗi thường gặp

| Hiện tượng | Nguyên nhân và cách xử lý |
|---|---|
| "Unable to reach the server" khi đăng nhập | Ứng dụng không gọi được backend. Kiểm tra backend đang chạy, xem dòng `[api] Backend URL` trong log Metro, và mở cổng 3000 trong tường lửa (xem bên dưới). |
| Màn xanh "Something went wrong" trên BlueStacks | Expo Go không tới được Metro qua địa chỉ Wi-Fi. Dùng `exp://10.0.2.2:8081`. |
| iPhone báo "You need to be signed in to Expo Go and Expo CLI" | Đăng nhập cùng một tài khoản Expo ở cả hai nơi: chạy `corepack pnpm exec expo login` trong `apps/mobile`, đăng nhập trong Expo Go, rồi chạy lại Metro. |
| Điện thoại không kết nối được dù cùng Wi-Fi | Tường lửa Windows đang chặn. Trong PowerShell mở bằng quyền Administrator, đặt mạng Wi-Fi là "Private" và cho phép cổng 8081, 3000, 9000 (các lệnh bên dưới). |
| Đăng ảnh hoặc video báo lỗi, hoặc ảnh và video mới không hiện | Kho lưu tệp chưa chạy hoặc điện thoại không tới được cổng 9000. Chạy `docker compose up -d`, và mở cổng 9000 trong tường lửa. Log backend có dòng "Storage is not reachable" khi MinIO chưa bật. |

```powershell
Set-NetConnectionProfile -InterfaceAlias "Wi-Fi" -NetworkCategory Private
New-NetFirewallRule -DisplayName "Expo dev (8081, 3000)" -Direction Inbound -Protocol TCP -LocalPort 8081,3000 -Action Allow -Profile Private
New-NetFirewallRule -DisplayName "MinIO dev (9000)" -Direction Inbound -Protocol TCP -LocalPort 9000 -Action Allow -Profile Private
```

Đăng nhập Google và thông báo đẩy không chạy trong Expo Go; hai tính năng này cần development build.

## Kiểm tra code

```bash
cd apps/api
corepack pnpm typecheck
```

Chín bộ smoke (`apps/api/scripts/*-smoke.cjs`) chạy trên API thật. Điều kiện, tài khoản thử và thứ tự chạy ở [docs/handover/cai-dat-va-chay.md](docs/handover/cai-dat-va-chay.md), mục 10.3.

```bash
cd apps/mobile
corepack pnpm typecheck
corepack pnpm test
```

## Tài liệu

- [apps/api/README.md](apps/api/README.md): cấu hình backend và quy trình database.
- [apps/mobile/README.md](apps/mobile/README.md): chi tiết về ứng dụng mobile.
- [docs/api-contract.md](docs/api-contract.md): hợp đồng API giữa mobile và backend.
- [docs/moderation/MODERATION_PLAN.md](docs/moderation/MODERATION_PLAN.md): kiểm duyệt nội dung, nhắn tin ẩn danh, chống lừa đảo, giới hạn 18+.
- [docs/change.md](docs/change.md): nhật ký thay đổi.
