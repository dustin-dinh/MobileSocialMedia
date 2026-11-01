# Triển khai sản phẩm (dành cho bên nhận bàn giao)

Tài liệu này hướng dẫn đưa backend (`apps/api`) lên máy chủ thật và build ứng dụng di động (`apps/mobile`) cho Android và iOS. Làm lần lượt từ trên xuống.

Các tệp liên quan:

| Tệp | Dùng để |
|---|---|
| `apps/api/Dockerfile` | Build image backend (và image chạy migration). |
| `apps/api/.dockerignore` | Loại `.env`, `node_modules`, mô hình đã tải… khỏi build context. |
| `docker-compose.prod.yml` | Chạy migration rồi chạy API (tuỳ chọn thêm MinIO) trên một máy chủ. |
| `apps/mobile/eas.json` | Cấu hình build ứng dụng bằng EAS (development, preview, production). |
| `apps/api/.env.example` | Mẫu biến môi trường của backend. |

## 1. Chuẩn bị tài khoản và dịch vụ

| Cần có | Dùng cho | Ghi chú |
|---|---|---|
| PostgreSQL (Supabase hoặc PostgreSQL tự quản) | Cơ sở dữ liệu | Supabase: lấy hai chuỗi kết nối, Transaction Pooler (cổng 6543) cho `DATABASE_URL` và Session/Direct (cổng 5432) cho `DIRECT_URL`. PostgreSQL thường: dùng cùng một chuỗi cho cả hai. |
| Kho lưu tệp S3 (AWS S3, Cloudflare R2, hoặc MinIO tự chạy) | Ảnh, video, ảnh đại diện, ảnh trong tin nhắn | Backend tự tạo hai bucket khi khởi động: bucket công khai (`S3_BUCKET`) và bucket riêng tư cho ảnh tin nhắn (`S3_PRIVATE_BUCKET`). Khoá truy cập phải có quyền tạo bucket, hoặc tạo sẵn hai bucket và cho bucket công khai quyền đọc công khai. |
| Máy chủ SMTP (SendGrid, Mailgun, Amazon SES, Gmail Workspace…) | Gửi mã xác thực email và mã đặt lại mật khẩu | |
| Tên miền và HTTPS | Địa chỉ API cho ứng dụng | iOS chặn HTTP thường; bản phát hành phải dùng `https://`. |
| Máy chủ chạy Docker (VPS, EC2, Lightsail…) | Chạy container backend | Tối thiểu 1 vCPU, 2 GB RAM (mô hình làm mờ ảnh chiếm vài trăm MB khi chạy). |
| Tài khoản Expo (EAS) | Build và ký ứng dụng, dịch vụ gửi thông báo đẩy | Miễn phí cho lượng build nhỏ. |
| Apple Developer Program (99 USD/năm) | Build iOS, TestFlight, App Store, khoá APNs cho thông báo đẩy | |
| Google Play Console (25 USD một lần) | Phát hành Android | |
| Dự án Firebase | Thông báo đẩy trên Android (FCM) | Tải `google-services.json` và khoá service account FCM V1. |
| Google Cloud Console (tuỳ chọn) | Đăng nhập bằng Google | Cần OAuth client loại Web, Android và iOS. |

## 2. Biến môi trường của backend

Sao chép mẫu rồi điền giá trị thật. Tệp `.env.production` đã bị git bỏ qua (quy tắc `.env.*` trong `.gitignore`); không đưa tệp này lên git.

```bash
cp apps/api/.env.example apps/api/.env.production
```

| Biến | Bắt buộc | Ý nghĩa |
|---|---|---|
| `DATABASE_URL` | Có | Chuỗi kết nối API dùng khi chạy. Supabase: Transaction Pooler, cổng 6543, thêm `?pgbouncer=true`. |
| `DIRECT_URL` | Có | Chuỗi kết nối cho migration và script quản trị. Supabase: Session/Direct, cổng 5432. |
| `JWT_SECRET` | Có | Khoá ký token đăng nhập. Chuỗi ngẫu nhiên dài, ví dụ `openssl rand -hex 48`. Đổi khoá là đăng xuất mọi người. |
| `OTP_HASH_SECRET` | Có | Khoá băm mã OTP email. Chuỗi ngẫu nhiên dài, khác `JWT_SECRET`. Thiếu thì đăng ký và quên mật khẩu báo lỗi. |
| `PORT` | Không | Cổng API trong container, mặc định 3000. `docker-compose.prod.yml` đặt sẵn 3000. |
| `GOOGLE_WEB_CLIENT_ID` | Có mặt (có thể rỗng) | OAuth client ID loại Web để xác minh đăng nhập Google. Để rỗng nếu không dùng Google. |
| `SMTP_HOST`, `SMTP_PORT`, `SMTP_SECURE`, `SMTP_USER`, `SMTP_PASS` | Có | Máy chủ gửi mail. `SMTP_SECURE=true` khi dùng cổng 465, `false` cho 587. |
| `MAIL_FROM` | Có | Địa chỉ người gửi, ví dụ `"Tên ứng dụng <no-reply@ten-mien.vn>"`. |
| `EMAIL_VERIFICATION_URL` | Không | Có trong mẫu nhưng code hiện tại không dùng (xác thực bằng mã OTP). |
| `S3_ENDPOINT` | Có | Địa chỉ dịch vụ S3. AWS: `https://s3.<region>.amazonaws.com`; R2: `https://<account-id>.r2.cloudflarestorage.com`; MinIO trong compose: `http://minio:9000`. |
| `S3_REGION` | Có | AWS: region thật; R2: `auto`; MinIO: `us-east-1`. |
| `S3_ACCESS_KEY`, `S3_SECRET_KEY` | Có | Khoá truy cập S3. |
| `S3_BUCKET` | Có | Bucket công khai cho ảnh và video bài đăng. |
| `S3_PRIVATE_BUCKET` | Không | Bucket riêng tư cho ảnh tin nhắn (ứng dụng nhận URL có chữ ký, hết hạn). Mặc định `<S3_BUCKET>-private`. |
| `S3_PUBLIC_URL` | Có khi deploy | URL công khai cố định của bucket (CDN hoặc tên miền riêng), ví dụ `https://media.ten-mien.vn`. Để rỗng thì URL ảnh dựng từ địa chỉ máy chủ, chỉ hợp cho môi trường phát triển. |
| `IMAGE_MODERATION_MODEL_DIR` | Không | Thư mục mô hình làm mờ ảnh nhạy cảm. Mặc định `models/nsfw-vit` (trong image là `/app/models/nsfw-vit`). |
| `IMAGE_MODERATION_THRESHOLD` | Không | Xác suất nhạy cảm từ mức này trở lên thì ảnh bị làm mờ với người nhận. Mặc định `0.7`. |
| `IMAGE_MODERATION_REQUIRED` | Không | `true`: từ chối ảnh tin nhắn khi thiếu mô hình, thay vì gửi không làm mờ. Khuyên bật `true` khi chạy thật. |
| `MINIO_ROOT_USER`, `MINIO_ROOT_PASSWORD` | Chỉ khi dùng MinIO trong compose | Tài khoản quản trị MinIO; đặt `S3_ACCESS_KEY`/`S3_SECRET_KEY` bằng đúng hai giá trị này. |

## 3. Build và chạy backend

Mọi lệnh chạy ở thư mục gốc của repo.

### 3.1. Mô hình làm mờ ảnh

Mô hình (~88 MB, giấy phép Apache-2.0, nguồn ghi ở `docs/moderation/MODERATION_PLAN.md`) **được tải lúc build image** bằng `scripts/download-moderation-model.cjs` và nằm sẵn trong image ở `/app/models/nsfw-vit`. Cách này cho một image tự đủ: không cần chép tệp lên máy chủ, mỗi bản API chạy ra đều có mô hình.

Nếu máy build không ra được Hugging Face, hoặc muốn image nhỏ hơn, build với `SKIP_MODEL=1` rồi gắn mô hình từ ngoài vào:

```bash
# tải trên một máy có mạng, trong apps/api:
node scripts/download-moderation-model.cjs        # tạo apps/api/models/nsfw-vit
# khi chạy container, gắn thư mục đó vào:
docker run ... -v /duong-dan/models:/app/models:ro mobilesocial-api
```

Thiếu mô hình thì API vẫn chạy, chỉ là ảnh tin nhắn không được làm mờ (hoặc bị từ chối nếu `IMAGE_MODERATION_REQUIRED=true`); trang quản trị hiện trạng thái này.

### 3.2. Chạy bằng Docker Compose (khuyên dùng)

```bash
docker compose -f docker-compose.prod.yml up -d --build
```

Compose làm theo thứ tự:

1. Build và chạy dịch vụ `migrate`: `prisma migrate deploy` áp mọi migration trong `apps/api/prisma/migrations` lên `DIRECT_URL`, rồi thoát.
2. Chỉ khi migration thành công, chạy dịch vụ `api` (cổng 3000, chỉ mở cho `127.0.0.1` để reverse proxy trên cùng máy gọi vào).

Mỗi lần cập nhật code: `git pull` rồi chạy lại đúng lệnh trên; migration mới được áp trước khi API mới chạy.

Kèm MinIO tự chạy (thay cho S3/R2):

```bash
docker compose -f docker-compose.prod.yml --profile minio up -d --build
```

Image MinIO đang dùng (`bitnamilegacy/minio`) là bản cuối, không còn được cập nhật. Khi chạy thật nên dùng S3 hoặc R2; nếu vẫn dùng MinIO thì phải sao lưu volume `minio-data` và đưa cổng 9000 ra ngoài qua HTTPS, đặt `S3_PUBLIC_URL` tới địa chỉ đó.

Xem log và trạng thái:

```bash
docker compose -f docker-compose.prod.yml logs -f api
docker compose -f docker-compose.prod.yml ps        # cột STATUS có (healthy) khi API đã sẵn sàng
```

### 3.3. Chạy bằng Docker không có Compose (hoặc trên PaaS)

```bash
docker build -f apps/api/Dockerfile -t mobilesocial-api apps/api
docker build -f apps/api/Dockerfile --target migrate -t mobilesocial-api-migrate apps/api

docker run --rm --env-file apps/api/.env.production mobilesocial-api-migrate   # trước mỗi bản mới
docker run -d --name api --restart unless-stopped --env-file apps/api/.env.production -p 127.0.0.1:3000:3000 mobilesocial-api
```

Trên các nền tảng như Render, Railway, Fly.io: dùng `apps/api/Dockerfile`, build context `apps/api`, đặt các biến ở mục 2 trong giao diện của nền tảng, và cấu hình lệnh trước khi deploy (release command) là image `migrate` hoặc `./node_modules/.bin/prisma migrate deploy` trên target `migrate`.

Image API chạy bằng người dùng không phải root (`node`), lệnh khởi động `node dist/src/main.js`, có healthcheck gọi `GET /api/admin` (trang tĩnh, không chạm cơ sở dữ liệu).

### 3.4. Cấp quyền quản trị

Trang quản trị: `https://<ten-mien-api>/api/admin`. Cấp quyền cho một tài khoản đã đăng ký:

```bash
docker compose -f docker-compose.prod.yml exec api node scripts/make-admin.cjs email@ten-mien.vn
# thu hồi: thêm "remove" ở cuối
```

## 4. Reverse proxy, HTTPS và CORS

- Đặt một reverse proxy có HTTPS trước cổng 3000: Caddy (tự lấy chứng chỉ Let's Encrypt), Nginx + Certbot, hoặc Cloudflare. Ví dụ Caddy:

  ```
  api.ten-mien.vn {
      reverse_proxy 127.0.0.1:3000
  }
  ```

- Proxy phải chuyển tiếp WebSocket (tin nhắn và thông báo realtime dùng Socket.IO trên cùng cổng). Caddy làm sẵn; Nginx cần `proxy_set_header Upgrade $http_upgrade;` và `proxy_set_header Connection "upgrade";`.
- Proxy phải cho phép body lớn để tải video (Nginx: `client_max_body_size 100m;` hoặc theo giới hạn video của ứng dụng).
- Backend đã bật `trust proxy` một tầng (`src/main.ts`), nên giới hạn tần suất nhận đúng IP người dùng qua **một** proxy. Nếu có hai tầng (ví dụ Cloudflare rồi Nginx) cần chỉnh giá trị này.
- **CORS**: `app.enableCors()` trong `src/main.ts` đang cho phép mọi origin. Ứng dụng di động không cần CORS; chỉ bản web cần. Trước khi chạy thật, giới hạn bằng danh sách origin của bản web (ví dụ `app.enableCors({ origin: ['https://web.ten-mien.vn'] })`) — đây là thay đổi code, cần người phụ trách backend làm.
- Địa chỉ API mà ứng dụng dùng có dạng `https://api.ten-mien.vn/api` (có `/api` ở cuối).

## 5. Ứng dụng di động (EAS)

Chạy trong `apps/mobile`. Cài EAS CLI: `npm install -g eas-cli`, rồi `eas login`.

### 5.1. Định danh ứng dụng

Trước khi build lần đầu, đổi trong `apps/mobile/app.json` sang giá trị của bên nhận:

- `expo.name`, `expo.slug`, `expo.version`
- `expo.ios.bundleIdentifier` và `expo.android.package` (hiện là `com.mobilesocial.app`; sau khi lên store thì không đổi được)
- biểu tượng và màn hình chờ cho cả Android và iOS (`icon`, `splash`, `android.adaptiveIcon`)
- `expo.scheme` nếu muốn đổi tiền tố deep link

### 5.2. `eas init`

```bash
eas init
```

Lệnh này tạo dự án trên Expo và ghi `extra.eas.projectId` vào `app.json`. Thông báo đẩy cần `projectId` này (`getExpoPushTokenAsync` lấy từ đó), nên phải chạy trước khi build.

### 5.3. Địa chỉ API cho từng profile

`apps/mobile/eas.json` có ba profile:

| Profile | Dùng cho | Địa chỉ API |
|---|---|---|
| `development` | Development build (thay Expo Go), cài nội bộ | Không đặt: ứng dụng tự gọi cổng 3000 trên máy chạy Metro, như khi phát triển. |
| `preview` | Bản thử nội bộ: APK cho Android, ad-hoc cho iOS (thiết bị phải đăng ký trước bằng `eas device:create`) | `EXPO_PUBLIC_API_BASE_URL` |
| `production` | Bản lên Google Play (AAB) và App Store, tự tăng số build | `EXPO_PUBLIC_API_BASE_URL` |

Thay `https://api.example.com/api` trong `preview` và `production` bằng địa chỉ thật. Đăng nhập Google cần thêm `EXPO_PUBLIC_GOOGLE_WEB_CLIENT_ID` (cùng giá trị `GOOGLE_WEB_CLIENT_ID` của backend) vào `env` của profile. Đây là giá trị công khai; không đặt bí mật nào vào `EXPO_PUBLIC_*` vì chúng nằm trong bản build.

### 5.4. Chứng chỉ ký và thông báo đẩy

```bash
eas credentials
```

- **Android**: để EAS tạo keystore và giữ hộ (sao lưu bằng `eas credentials` → Download). Mất keystore là không cập nhật được ứng dụng trên Play. Thông báo đẩy: tải khoá service account FCM V1 của Firebase lên mục "Push Notifications (FCM V1)", và thêm `google-services.json` vào dự án (`expo.android.googleServicesFile` trong `app.json`).
- **iOS**: đăng nhập Apple Developer khi được hỏi; EAS tạo certificate, provisioning profile và khoá APNs. Chọn tạo khoá Push Notifications (APNs) khi được hỏi.
- Backend gửi thông báo qua dịch vụ đẩy của Expo (`exp.host`), Expo chuyển tiếp tới FCM và APNs bằng các khoá trên. Backend không cần khoá nào.

### 5.5. Build

```bash
eas build --profile development --platform all   # development build để thử push, Google Sign-In
eas build --profile preview --platform android    # APK cài thẳng lên máy
eas build --profile preview --platform ios        # ad-hoc cho các iPhone đã đăng ký
eas build --profile production --platform all     # AAB + IPA để nộp store
```

### 5.6. Nộp lên store

```bash
eas submit --profile production --platform android
eas submit --profile production --platform ios
```

Lần đầu với Google Play phải tải AAB lên thủ công một lần trong Play Console, và tạo khoá service account cho `eas submit`.

Danh sách kiểm tra trước khi nộp:

- [ ] Backend chạy qua HTTPS, `EXPO_PUBLIC_API_BASE_URL` trỏ đúng, đã thử đăng ký, đăng nhập, đăng bài ảnh/video, tin nhắn trên bản `preview` ở **cả** Android và iPhone thật.
- [ ] Thông báo đẩy đã thử trên máy thật ở cả hai nền tảng.
- [ ] Trang chính sách quyền riêng tư và điều khoản sử dụng có URL công khai (cả hai store bắt buộc).
- [ ] App Store: khai báo "App Privacy"; Google Play: mục "Data safety".
- [ ] Xoá tài khoản ngay trong ứng dụng: backend có `DELETE /api/users/me`; kiểm tra màn hình tương ứng hoạt động. Google Play còn yêu cầu một trang web để yêu cầu xoá tài khoản.
- [ ] Nội dung do người dùng tạo: báo cáo, chặn người dùng, và đội kiểm duyệt dùng trang quản trị (yêu cầu của cả hai store).
- [ ] **Đăng nhập Google trên iOS** kéo theo yêu cầu **Sign in with Apple** (App Store Review Guideline 4.8). Ứng dụng chưa có Sign in with Apple: hoặc bổ sung, hoặc ẩn đăng nhập Google trên iOS.
- [ ] Ảnh chụp màn hình, mô tả, phân loại độ tuổi, tài khoản thử cho người duyệt (App Review cần đăng nhập được).
- [ ] Mô tả quyền truy cập ảnh (đã có trong `app.json`) đúng ngôn ngữ của thị trường.

## 6. Giới hạn đã biết

- **Chỉ chạy được một bản API.** Danh sách tài khoản bị khoá, giới hạn tần suất, kết nối Socket.IO và việc gộp thông báo story đều nằm trong bộ nhớ của một tiến trình. Chạy nhiều bản (scale ngang) sẽ làm lệch các trạng thái này; muốn scale cần chuyển sang Redis (adapter Socket.IO, throttler storage) — chưa làm.
- **Thông báo đẩy chưa từng được thử trên thiết bị thật.** Code gửi và đăng ký token đã có, nhưng chưa có development build nào nhận được push.
- **Ứng dụng chưa từng chạy trên iOS.** Mọi kiểm thử đến nay là Android (BlueStacks/máy Android) và bản web. Cấu hình iOS (Google Sign-In cần `iosUrlScheme` hoặc `GoogleService-Info.plist`, APNs, ad-hoc) chưa được kiểm chứng.
- CORS đang mở cho mọi origin (mục 4).
- Token đăng nhập sống 30 ngày, chưa có refresh token để thu hồi phiên.
- Mô hình làm mờ ảnh tải từ nhánh `main` của Hugging Face, chưa ghim theo commit; mỗi lần build có thể nhận bản khác nếu tác giả cập nhật.
