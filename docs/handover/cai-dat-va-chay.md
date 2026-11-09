# Cài đặt và chạy trên máy mới

Làm lần lượt từ trên xuống. Mọi lệnh ghi theo cú pháp bash (Git Bash trên Windows, macOS, Linux); chỗ nào khác với PowerShell thì ghi thêm. Triển khai lên máy chủ thật và build app lên store nằm ở `docs/deploy.md`, không lặp lại ở đây.

## 1. Cần cài

| Công cụ | Ghi chú |
|---|---|
| Node.js 24 | Image Docker của API dùng `node:24-bookworm-slim`; máy bên bán chạy Node 24.19. |
| Corepack | Đi kèm Node. Hai gói dùng `pnpm@12.4.1` (trường `packageManager`); mọi lệnh gọi qua `corepack pnpm …`, không cần cài pnpm riêng. |
| Docker Desktop (hoặc Docker Engine + Compose v2) | Chạy MinIO (kho tệp) và PostgreSQL cục bộ. |
| Expo Go bản hỗ trợ SDK 57 | Trên điện thoại Android, iPhone, hoặc BlueStacks. Máy bên bán có tệp `apps/mobile/Expo-Go-57.0.9.apk` (git bỏ qua, có thể không có trong bản bàn giao). |
| Trình duyệt Chrome hoặc Edge | Cho bản web và trang quản trị. |
| Git | |

`apps/api` và `apps/mobile` là hai gói pnpm độc lập (mỗi gói có `pnpm-lock.yaml` riêng). Thư mục gốc không có workspace chung: cài từng gói.

## 2. Lấy code và cài thư viện

```bash
git clone <repo> MobileProject
cd MobileProject/apps/api && corepack pnpm install
cd ../mobile && corepack pnpm install
```

`apps/api/pnpm-workspace.yaml` tắt script cài đặt của `onnxruntime-node`, `bcrypt`, `prisma`, `@prisma/engines` (`allowBuilds: false`); đó là chủ ý (DEC-025), không bật lại.

## 3. Biến môi trường

### 3.1. Backend: `apps/api/.env`

```bash
cd apps/api
cp .env.example .env
```

Ý nghĩa từng biến ở `docs/deploy.md`, mục 2. Với máy dev, điền như sau:

| Biến | Giá trị cho máy dev |
|---|---|
| `DATABASE_URL`, `DIRECT_URL` | Cả hai: `postgresql://postgres:postgres@localhost:5433/mobilesocial` (PostgreSQL cục bộ ở mục 4). Bỏ `?pgbouncer=true` của mẫu: tham số đó chỉ dành cho pooler của Supabase. |
| `JWT_SECRET`, `OTP_HASH_SECRET` | Hai chuỗi ngẫu nhiên dài, khác nhau. Ví dụ: `node -e "console.log(require('crypto').randomBytes(48).toString('hex'))"`. Thiếu `OTP_HASH_SECRET` thì đăng ký, quên mật khẩu và 2FA báo lỗi. |
| `SMTP_HOST`, `SMTP_PORT`, `SMTP_SECURE`, `SMTP_USER`, `SMTP_PASS`, `MAIL_FROM` | Một hộp thư SMTP thật nếu muốn nhận mã OTP. **Các dòng này phải có** (API đọc bằng `getOrThrow` lúc khởi động); để trống thì API vẫn chạy nhưng mọi thao tác gửi mã trả lỗi "Không gửi được email…", nên không đăng ký tài khoản mới qua app được. Khi đó dùng tài khoản thử ở mục 7. |
| `GOOGLE_WEB_CLIENT_ID` | Phải có dòng, để trống nếu không thử đăng nhập Google. |
| `S3_*` | Giữ nguyên giá trị mẫu (MinIO ở `http://localhost:9000`, `minioadmin` / `minioadmin`, bucket `social-media`). Để trống `S3_PRIVATE_BUCKET` (mặc định `social-media-private`) và `S3_PUBLIC_URL`. |
| `IMAGE_MODERATION_*` | Giữ mặc định. |

Biến đặt trong shell được ưu tiên hơn `.env` (cả `@nestjs/config` lẫn `dotenv` trong script đều không ghi đè biến đã có). Chỉ dùng điều này khi cần trỏ tạm sang database khác.

`EXPO_PUSH_URL` không có trong mẫu: chỉ dùng khi chạy hai bộ kiểm thử push (mục 10.3).

### 3.2. Mobile: `apps/mobile/.env.local` (tùy chọn)

Không cần tệp này khi API chạy trên chính máy chạy Metro: app tự gọi cổng 3000 của máy đó. Các biến dùng được:

| Biến | Tác dụng |
|---|---|
| `EXPO_PUBLIC_USE_MOCK=true` | Dữ liệu mẫu, bỏ qua đăng nhập, không cần backend. |
| `EXPO_PUBLIC_MOCK_SIGNED_OUT=true` | Cùng với dòng trên: dữ liệu mẫu nhưng mở ở màn đăng nhập, để xem các màn xác thực. |
| `EXPO_PUBLIC_API_BASE_URL` | Địa chỉ API khi backend nằm máy khác, dạng `http://<ip>:3000/api` (có `/api`). Bản phát hành đặt trong `eas.json`. |
| `EXPO_PUBLIC_GOOGLE_WEB_CLIENT_ID` | OAuth client loại Web, cùng giá trị `GOOGLE_WEB_CLIENT_ID` của backend. Chỉ có tác dụng trong development build. |
| `EXPO_PUBLIC_SHARE_LINKS_ENABLED=true` | Hiện "sao chép liên kết" (mặc định ẩn, DEC-024). |

Sửa `.env.local` xong phải tắt Metro và chạy lại với `--clear`.

## 4. Database PostgreSQL cục bộ

Dự án Supabase cũ đang tạm dừng; dùng PostgreSQL trong Docker. Chạy ở thư mục gốc repo:

```bash
docker compose --profile localdb up -d postgres
```

Container `postgres:17-alpine`, cổng máy là **5433** (không phải 5432), tài khoản `postgres` / `postgres`, database `mobilesocial`, dữ liệu ở volume `postgres-data`.

Tạo Prisma Client và áp toàn bộ migration (17 migration trong `apps/api/prisma/migrations`):

```bash
cd apps/api
corepack pnpm prisma:generate
corepack pnpm exec prisma migrate deploy
```

`migrate deploy` đọc `DIRECT_URL`. Mỗi lần lấy code mới có migration mới thì chạy lại hai lệnh trên.

Dùng PostgreSQL khác (Supabase, RDS…): chỉ đổi `DATABASE_URL` / `DIRECT_URL`. Supabase cần hai chuỗi khác nhau (pooler 6543 và direct 5432, xem `docs/deploy.md`).

## 5. Kho tệp MinIO

Ở thư mục gốc repo:

```bash
docker compose up -d
```

Lệnh này chỉ bật `minio` (dịch vụ `postgres` nằm trong profile `localdb`). Muốn bật cả hai một lần: `docker compose --profile localdb up -d`.

- API S3 ở cổng 9000, trang quản trị MinIO ở `http://localhost:9001` (`minioadmin` / `minioadmin`).
- API tự tạo hai bucket `social-media` (đọc công khai) và `social-media-private` khi khởi động.
- Image `bitnamilegacy/minio` là bản cuối, không còn cập nhật: chỉ dùng cho dev (DEC-022).
- Điện thoại thật phải gọi được cổng 9000 của máy dev (ảnh và video tải từ đó). Lệnh mở tường lửa Windows có trong `README.md` gốc, mục "Lỗi thường gặp".

## 6. Mô hình làm mờ ảnh

```bash
cd apps/api
node scripts/download-moderation-model.cjs
```

Tải ~88 MB từ Hugging Face vào `apps/api/models/nsfw-vit/` (git bỏ qua). Chạy một lần. Không có mô hình thì API vẫn chạy, ảnh không bị làm mờ, trang quản trị báo "unavailable"; hai bộ kiểm thử `safety-smoke` và `visibility-smoke` sẽ báo lỗi.

Đường dẫn mô hình mặc định là tương đối (`models/nsfw-vit`), nên API phải được chạy từ thư mục `apps/api` (cũng vì `.env` được đọc từ thư mục hiện tại).

## 7. Chạy API

```bash
cd apps/api
corepack pnpm start:dev
```

API ở `http://localhost:3000/api`. Log khởi động có dòng "Image moderation model loaded" khi mô hình sẵn sàng, và "Storage is not reachable" khi MinIO chưa bật.

Thử nhanh: mở `http://localhost:3000/api/admin` trong trình duyệt, phải thấy trang đăng nhập quản trị.

**Tài khoản thử** (khi chưa có SMTP): tạo thẳng trong database bằng `DIRECT_URL`.

```bash
cd apps/api
node scripts/seed-test-users.cjs          # tạo gaptest_a, gaptest_b, gaptest_c, gaptest_d
node scripts/seed-test-users.cjs clean    # xóa chúng và mọi dữ liệu của chúng
```

- Email `gaptest_a@example.invalid` … `gaptest_d@example.invalid`, mật khẩu chung `Passw0rd!gap`.
- a, b, c đã xác thực email; d chưa (để thử lỗi `EMAIL_NOT_VERIFIED`).
- Các tài khoản này không có ngày sinh và chưa qua màn giới thiệu: lần đầu đăng nhập trong app sẽ gặp màn "Ngày sinh" (khai một ngày đủ 18 tuổi), rồi màn thiết lập ban đầu.
- Không chạy trên database có người dùng thật.

## 8. Trang quản trị

```bash
cd apps/api
node scripts/make-admin.cjs gaptest_c@example.invalid          # cấp quyền
node scripts/make-admin.cjs gaptest_c@example.invalid remove   # thu hồi
```

Rồi mở `http://localhost:3000/api/admin`, đăng nhập bằng email và mật khẩu của tài khoản đó. Script dùng `DIRECT_URL`, so email không phân biệt hoa thường. Quyền có hiệu lực ngay (API đọc vai trò từ database ở mỗi request).

Lưu ý: trang quản trị hiện không xử lý đăng nhập hai lớp; tài khoản quản trị đã bật 2FA không đăng nhập được vào trang này (xem `van-de-da-biet.md`).

## 9. Chạy ứng dụng di động

### 9.1. Expo Go trên điện thoại hoặc BlueStacks

```bash
cd apps/mobile
corepack pnpm start:lan
```

| Thiết bị | Cách mở |
|---|---|
| BlueStacks / máy ảo Android | Expo Go → "Enter URL manually" → `exp://10.0.2.2:8081` |
| Điện thoại Android | Quét mã QR Metro in ra bằng Expo Go |
| iPhone | Quét mã QR bằng app Camera (chưa từng được thử, xem `README.md` của bộ này) |

Điện thoại cùng mạng Wi-Fi với máy dev. Khác mạng: `corepack pnpm start:tunnel` và đặt `EXPO_PUBLIC_API_BASE_URL`.

Expo Go không chạy được đăng nhập Google và thông báo đẩy; hai tính năng đó cần development build (`eas build --profile development`, xem `docs/deploy.md`, mục 5).

### 9.2. Dữ liệu mẫu (không cần backend)

```bash
# apps/mobile/.env.local
EXPO_PUBLIC_USE_MOCK=true
```

```bash
cd apps/mobile
corepack pnpm start:lan --clear
```

Thêm `EXPO_PUBLIC_MOCK_SIGNED_OUT=true` để mở ở màn đăng nhập. Ở chế độ này nút "Đăng nhập" vẫn gọi API thật (không có nhánh mẫu cho đăng nhập); dùng nó để xem giao diện các màn xác thực.

### 9.3. Bản web

```bash
cd apps/mobile
corepack pnpm exec expo start --web
```

Mở `http://localhost:8081`. Bản web là thử nghiệm: lưu token (`expo-secure-store`), ảnh bìa video, đọc tệp và Google Sign-In không có bản web, nên **dùng bản web với `EXPO_PUBLIC_USE_MOCK=true`**. Một số màn có URL riêng: `/messages`, `/notifications`, `/settings`, `/settings/2fa`, `/settings/anonymous`, `/settings/muted`, `/saved`, `/search`, `/me` (đủ danh sách ở `src/navigation/navigationRef.ts`).

## 10. Kiểm tra code

### 10.1. Kiểu và test đơn vị

```bash
cd apps/api && corepack pnpm typecheck
cd ../mobile && corepack pnpm typecheck && corepack pnpm test
```

Ngày 08/11/2026: hai `typecheck` sạch; `jest` 113 đạt, 39 bỏ qua (3 bộ `__tests__/live/` chỉ chạy khi có `LIVE_API=1`).

`corepack pnpm verify:ui` (`scripts/verify-ui.mjs`) còn một luật hỏng sẵn (luật H so với ảnh chụp cũ, DEC-017); không dùng làm cổng kiểm tra.

### 10.2. Test mobile trên API thật

Cần API đang chạy và tài khoản thử mới tạo (các bộ này kiểm số đếm chính xác). Chạy từng bộ một, vì chúng dùng chung tài khoản:

```bash
cd apps/api && node scripts/seed-test-users.cjs clean && node scripts/seed-test-users.cjs
cd ../mobile
LIVE_API=1 EXPO_PUBLIC_API_BASE_URL=http://127.0.0.1:3000/api corepack pnpm exec jest __tests__/live/liveApi
```

Thay `liveApi` bằng `gapLive` hoặc `safetyLive`, seed lại trước mỗi bộ. PowerShell: `$env:LIVE_API='1'; $env:EXPO_PUBLIC_API_BASE_URL='http://127.0.0.1:3000/api'; corepack pnpm exec jest __tests__/live/liveApi`.

### 10.3. Chín bộ smoke trên API thật

Chạy trong `apps/api`, với API, MinIO và PostgreSQL đang chạy. Mỗi script in `PASS` / `FAIL` từng phép thử và thoát mã 1 nếu có lỗi. **Chỉ chạy trên database thử.** Tất cả đọc địa chỉ API từ biến `API` (mặc định `http://localhost:3000/api`).

**Giới hạn đăng nhập.** API cho 10 lần đăng nhập mỗi phút mỗi IP, bộ đếm nằm trong bộ nhớ tiến trình. Các bộ đăng nhập nhiều lần; `api-smoke` cố ý làm đầy giới hạn ở bước cuối. Giữa hai bộ, **chờ 65 giây** hoặc khởi động lại API (bộ đếm mất khi tiến trình dừng). Một bộ báo `429` ở bước đăng nhập nghĩa là chưa chờ đủ, không phải lỗi code. `account-security-smoke` tự đặt `X-Forwarded-For` giả nên không bị ảnh hưởng.

**Bốn bộ cũ** (dùng tài khoản `gaptest_*`):

```bash
node scripts/seed-test-users.cjs clean && node scripts/seed-test-users.cjs
node scripts/make-admin.cjs gaptest_c@example.invalid
node scripts/api-smoke.cjs
# chờ 65 giây; api-smoke xóa gaptest_a trong lúc chạy (thử xóa tài khoản), nên seed lại:
node scripts/seed-test-users.cjs clean && node scripts/seed-test-users.cjs
node scripts/make-admin.cjs gaptest_c@example.invalid
node scripts/reels-smoke.cjs
# chờ 65 giây
node scripts/social-smoke.cjs
# chờ 65 giây
node scripts/safety-smoke.cjs
node scripts/seed-test-users.cjs clean
```

| Bộ | Kiểm gì | Cần thêm |
|---|---|---|
| `api-smoke.cjs` | Endpoint đợt 12/10: hồ sơ, ảnh đại diện, gợi ý, quyền riêng tư bài, đăng lại, bình luận, lưu, ẩn, báo cáo, chặn, đổi mật khẩu, xóa tài khoản, giới hạn đăng nhập | seed, MinIO |
| `reels-smoke.cjs` | Tải video qua URL có chữ ký, bài video, luồng Reels, nhật ký xem, URL tệp theo host | seed, MinIO |
| `social-smoke.cjs` | Bảng tin theo dõi, ảnh bìa, cảm xúc, hashtag, tài khoản riêng tư, tin nhắn, story, quản trị | seed, `make-admin gaptest_c` |
| `safety-smoke.cjs` | 18+, tin nhắn chờ, ẩn danh (không lộ danh tính qua API và socket), chặn liên lạc, lừa đảo, báo cáo hội thoại, story ẩn danh, làm mờ ảnh, quản trị | seed, `make-admin gaptest_c`, **mô hình đã tải**, `DATABASE_URL` (đọc từ `.env`); tự tạo và xóa `qa_safety_*` |

**Năm bộ mới** (đợt 01/11; mỗi bộ tự tạo và tự xóa tài khoản riêng, không cần seed):

| Bộ | Kiểm gì | Biến và điều kiện |
|---|---|---|
| `account-security-smoke.cjs` | `tokenVersion` (đăng xuất mọi thiết bị, đổi / đặt lại mật khẩu), token cũ không có `ver`, socket từ chối token đã thu hồi, khóa sau 5 lần sai, 2FA | `DATABASE_URL` (mặc định `postgresql://postgres:postgres@localhost:5433/mobilesocial`, **không** lấy từ `.env`). `JWT_SECRET` và `OTP_HASH_SECRET` trong `apps/api/.env` phải trùng với API đang chạy (script tự ký token cũ và ghi đè hash OTP). Tài khoản `b1test_*`. |
| `messaging-safety-smoke.cjs` | Push không lộ nội dung tin chờ / ẩn danh, tin chờ đã xóa không làm phiền, tắt nhận ẩn danh, "Ai được nhắn tin cho tôi", giới hạn tin chờ mỗi ngày | API khởi động với `EXPO_PUSH_URL=http://localhost:3955/push`; chạy script với `PUSH_PORT=3955` (mặc định của script là 3952). `DIRECT_URL`. Tài khoản `b2test_*`. |
| `moderation-smoke.cjs` | Hàng đợi báo cáo theo mức độ, nhật ký quản trị, xem danh tính phải có lý do, gỡ / khôi phục bình luận, xóa tài khoản giữ dữ liệu người khác | `DATABASE_URL` (mặc định database cục bộ như trên; script không đọc `.env`). Tự tạo một tài khoản quản trị. Tài khoản `b4test_*`. |
| `push-smoke.cjs` | Dọn token `DeviceNotRegistered`, không push cho tài khoản đã xóa / bị khóa, kênh Android `default`, phân trang thông báo và tìm người | API khởi động với `EXPO_PUSH_URL=http://localhost:3955/push` (mặc định `PUSH_PORT` của script là 3955). `DIRECT_URL`. Tài khoản `b5test_*`. |
| `visibility-smoke.cjs` | Ẩn nội dung tài khoản bị khóa, nhắc tên, tắt tiếng, ảnh bài nhạy cảm, tệp bài viết / story trong bucket riêng tư | MinIO, **mô hình đã tải**, `DATABASE_URL` hoặc `DIRECT_URL`. Tài khoản `b3test_*`. |

Khởi động API cho hai bộ push (một tiến trình dùng được cho cả năm bộ; push thật tới Expo bị chuyển sang máy chủ giả mà script tự dựng):

```bash
cd apps/api
EXPO_PUSH_URL=http://localhost:3955/push corepack pnpm start:dev
# PowerShell: $env:EXPO_PUSH_URL='http://localhost:3955/push'; corepack pnpm start:dev
```

Ở một cửa sổ khác:

```bash
cd apps/api
node scripts/account-security-smoke.cjs
# chờ 65 giây giữa các bộ
PUSH_PORT=3955 node scripts/messaging-safety-smoke.cjs
node scripts/moderation-smoke.cjs
node scripts/push-smoke.cjs
node scripts/visibility-smoke.cjs
```

Khi `.env` đã trỏ `DATABASE_URL` / `DIRECT_URL` vào database cục bộ (mục 3.1), không cần đặt thêm biến nào ngoài các biến trên. Ba script `account-security`, `messaging-safety` và `safety` cần `socket.io-client`: chúng lấy thư viện từ `apps/mobile/node_modules`, nên phải cài thư viện mobile trước (mục 2).

Các ví dụ trong đầu từng script dùng cổng khác nhau (3001-3005): bên bán chạy mỗi bộ trên một tiến trình API riêng để mỗi bộ có bộ đếm giới hạn đăng nhập riêng. Làm vậy cũng được, thay cho việc chờ 65 giây.

## 11. Kiểm tra giao diện bằng taste-skill

Giao diện được dựng theo bộ quy tắc taste-skill (DEC-027). Công cụ **không nằm trong repo**: nó là thư mục skill `~/.claude/skills/design-taste-frontend` trên máy bên bán (giấy phép MIT); xin bên bán một bản. Chạy ở thư mục gốc repo:

```bash
node ~/.claude/skills/design-taste-frontend/scripts/lint.mjs --app apps/mobile/src
```

Thoát mã 1 khi có FAIL. Ngày 01/11/2026: 0 FAIL, 3 WARN. Thư mục `.taste-skill/` (ảnh chụp, phiếu hướng thiết kế) bị git bỏ qua.

## 12. Văn bản pháp lý trong app

Nguồn duy nhất là `docs/legal/*.md` (DEC-028). Sau khi sửa Markdown:

```bash
cd apps/mobile
node scripts/build-legal-content.mjs
```

Script ghi đè `src/features/settings/legalContent.ts`; không sửa tay tệp đó. Chỗ trống như `[TÊN DOANH NGHIỆP]` hiện nguyên trong app cho tới khi bên nhận điền (`docs/legal/README.md`, mục 2).

## 13. Lỗi thường gặp

Xem bảng "Lỗi thường gặp" trong `README.md` ở thư mục gốc (không gọi được backend, màn xanh trên BlueStacks, tường lửa Windows, MinIO chưa chạy). Thêm:

| Hiện tượng | Nguyên nhân |
|---|---|
| API dừng ngay lúc khởi động, báo thiếu `SMTP_HOST` / `GOOGLE_WEB_CLIENT_ID` / `JWT_SECRET` | Dòng biến bị xóa khỏi `.env`. Các dòng phải có, `SMTP_*` và `GOOGLE_WEB_CLIENT_ID` để trống được. |
| `prisma migrate deploy` không kết nối được | `DIRECT_URL` sai cổng: PostgreSQL cục bộ ở **5433**. |
| API báo không tìm thấy mô hình dù đã tải | API không chạy từ thư mục `apps/api`, hoặc `IMAGE_MODERATION_MODEL_DIR` trỏ sai. |
| Smoke báo `429` khi đăng nhập | Giới hạn 10 lần / phút / IP; chờ 65 giây hoặc khởi động lại API. |
| Smoke báo `423 LOGIN_LOCKED` | Một tài khoản thử đã sai mật khẩu 5 lần; chờ 15 phút hoặc seed lại. |
