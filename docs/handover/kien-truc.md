# Kiến trúc

Mô tả code ở nhánh `feat/gap-checklist` ngày 08/11/2026. Chi tiết từng endpoint ở `docs/api-contract.md`; lý do của từng lựa chọn ở `docs/decisions.md` (số DEC ghi trong ngoặc).

## 1. Các thành phần và cách chúng nói chuyện

```
 Ứng dụng (Expo / React Native, Android + iOS + web thử nghiệm)
   │  REST JSON, Bearer JWT              │  Socket.IO, namespace /notifications
   │  https://<host>/api/...             │  (token trong handshake.auth.token)
   ▼                                     ▼
 API NestJS (apps/api, một tiến trình Node) ──── Prisma 7 + @prisma/adapter-pg ──► PostgreSQL
   │            │               │               │
   │            │               │               └─ ONNX (onnxruntime-node + sharp): mô hình
   │            │               │                  làm mờ ảnh chạy trong tiến trình API
   │            │               └─ SMTP (nodemailer): mã xác thực email, mã đặt lại mật khẩu, mã 2FA
   │            └─ Expo Push API (exp.host) ─► FCM (Android) / APNs (iOS)
   └─ S3 API (AWS SDK v3): MinIO khi dev, AWS S3 / Cloudflare R2 khi chạy thật
        ├─ bucket công khai  S3_BUCKET            : ảnh đại diện, ảnh bìa, tệp cũ trước 01/11
        └─ bucket riêng tư   S3_PRIVATE_BUCKET    : ảnh và video bài viết, ảnh bìa video, story,
                                                    ảnh tin nhắn; chỉ đọc qua URL có chữ ký 1 giờ
 Điện thoại ──PUT có chữ ký──► bucket riêng tư (video và story tải thẳng, không qua API)
```

- **REST.** Mọi route có tiền tố `/api` (`app.setGlobalPrefix("api")` trong `src/main.ts`). `ValidationPipe` toàn cục với `whitelist` và `forbidNonWhitelisted`: trường lạ trong body bị trả `400`. Response có dạng `{ data, meta? }`.
- **Socket.IO.** Namespace `/notifications` nằm **ngoài** tiền tố `/api` (gateway không nhận global prefix). App nối tới `<gốc API bỏ /api>/notifications`, chỉ dùng transport `websocket`. Mỗi người dùng vào phòng `user:<id>`. Sự kiện: `notification:new`, `message:new`, `message:read`, `conversation:updated`. Socket chỉ báo "có cái mới"; REST là nguồn dữ liệu chính.
- **Tệp.** Database lưu `s3:<key>` (bucket công khai) hoặc `s3p:<key>` (bucket riêng tư), không lưu URL đầy đủ (DEC-022, DEC-024). `MediaUrlInterceptor` (interceptor toàn cục) và gateway đổi mọi trường có tên kết thúc bằng `url` thành URL thật lúc trả về: `s3:` thành `<S3_PUBLIC_URL hoặc endpoint>/<bucket>/<key>`, `s3p:` thành URL GET có chữ ký, hết hạn sau 3600 giây. Khi `S3_ENDPOINT` là `localhost`, host trong URL được thay bằng host mà client vừa dùng để gọi API, để điện thoại trong mạng LAN mở được. Tệp cũ trên Supabase Storage là URL tuyệt đối, giữ nguyên.
- **Tải video, story.** `POST /api/media/upload-url` trả URL `PUT` có chữ ký vào bucket riêng tư; điện thoại tải thẳng lên kho; rồi `POST /api/posts/media` hoặc `POST /api/stories` tạo bản ghi. Server đọc kích thước và kiểu thật của tệp đã lưu (`HeadObject`) và xóa tệp không hợp lệ. Ảnh bài viết và ảnh tin nhắn đi qua API (multipart) để chạy mô hình làm mờ trước khi lưu.
- **Push.** `NotificationsService` gọi `https://exp.host/--/api/v2/push/send` (đổi được bằng `EXPO_PUSH_URL`, chỉ để kiểm thử). Expo chuyển tiếp sang FCM / APNs bằng khóa đặt trong EAS; backend không giữ khóa nào. Token thiết bị lưu ở bảng `DeviceToken`.
- **Mô hình ảnh.** `AdamCodd/vit-base-nsfw-detector`, bản ONNX lượng tử hóa (~88 MB, Apache-2.0), tải bằng `scripts/download-moderation-model.cjs` vào `apps/api/models/nsfw-vit/`. Chỉ lưu cờ `sensitive`, không lưu điểm. Thiếu mô hình: ảnh không bị làm mờ (hoặc bị từ chối nếu `IMAGE_MODERATION_REQUIRED=true`), trang quản trị báo trạng thái.
- **Giới hạn tần suất.** `@nestjs/throttler`: trần chung 300 request/phút/IP; các route xác thực đặt riêng bằng `@Throttle` (ví dụ đăng nhập 10/phút/IP, đăng ký 10/giờ/IP). Bộ đếm nằm trong bộ nhớ tiến trình. `trust proxy` bật một tầng (`src/main.ts`).

## 2. Module của API

Đăng ký trong `apps/api/src/app.module.ts`. **Thứ tự import có nghĩa**: `SearchModule` phải đứng trước `UsersModule`, nếu không `GET users/search` bị `GET users/:id` bắt mất (DEC-018).

| Module | Trách nhiệm | Tệp chính | Quy tắc đáng chú ý |
|---|---|---|---|
| `prisma` | Kết nối database | `src/prisma/prisma.service.ts` | Runtime dùng `DATABASE_URL` (adapter `pg`). CLI Prisma dùng `DIRECT_URL` qua `prisma.config.ts`. Client sinh ra ở `src/generated/prisma` (git bỏ qua, chạy `prisma:generate`). |
| `auth` | Đăng ký, đăng nhập email và Google, mã OTP email, quên / đặt lại / đổi mật khẩu, đăng xuất, 2FA | `auth.controller.ts`, `auth.service.ts`, `session.ts`, `ban-list.ts`, `strategies/jwt.strategy.ts`, `guards/jwt-auth.guard.ts`, `google-verifier.service.ts` | JWT 30 ngày, mang `ver` = `tokenVersion`. Khóa đăng nhập 15 phút sau 5 lần sai liên tiếp (`423 LOGIN_LOCKED`). Mã OTP lưu dạng HMAC (`OTP_HASH_SECRET`), 5 phút, 5 lần thử. Đăng ký bắt buộc ngày sinh ≥ 18. Liên kết Google với tài khoản email chỉ khi Google báo `email_verified` (DEC-019). |
| `users` | Hồ sơ, ảnh đại diện, ảnh bìa, ngày sinh, cài đặt, chặn, gợi ý, xóa tài khoản | `users.controller.ts`, `users.service.ts` | Xóa tài khoản giữ hàng `User` làm "bia mộ" (`deletedAt`, username `deleted_…`), xóa dữ liệu của người đó nhưng giữ hội thoại và báo cáo của người khác. Ảnh đại diện và ảnh bìa vào bucket công khai. |
| `search` | Tìm người dùng, hashtag thịnh hành | `search.controller.ts`, `search.service.ts` | Hashtag đếm trong bộ nhớ trên 500 bài mới nhất có `#`. |
| `posts` | Bài viết, bảng tin, chi tiết, sửa, xóa mềm, đăng lại, lưu, ẩn, "không quan tâm", tìm bài, tắt tiếng | `posts.controller.ts`, `posts.service.ts`, `post-view.ts`, `mutes.controller.ts` | **Một quy tắc hiển thị duy nhất** `visiblePostWhere()` / `activeUserWhere` trong `post-view.ts` (quyền riêng tư bài, chặn hai chiều, tài khoản riêng tư, tài khoản bị khóa / đã xóa); mọi chỗ trả bài đều dùng nó. Bảng tin = bài của mình + người mình theo dõi. Ảnh bài viết qua mô hình làm mờ. Tìm bài bằng `ILIKE`. |
| `likes` | Cảm xúc trên bài | `likes.controller.ts`, `likes.service.ts` | Dùng bảng `Like` với cột `type` (LIKE, LOVE, HAHA, WOW, SAD, ANGRY); một cảm xúc mỗi người mỗi bài. |
| `comments` | Bình luận, trả lời, sửa, xóa, thích bình luận | `comments.controller.ts`, `comments.service.ts` | Bình luận bị quản trị viên gỡ có `removedAt`: ẩn khỏi mọi chỗ, khôi phục được. Nhắc tên chỉ báo cho người xem được bài. |
| `follows` | Theo dõi, người theo dõi, yêu cầu theo dõi tài khoản riêng tư | `follows.controller.ts`, `follows.service.ts` | Yêu cầu theo dõi ở bảng riêng `FollowRequest` (DEC-023). |
| `notifications` | Thông báo trong app, socket, push, đăng ký thiết bị | `notifications.controller.ts`, `notifications.gateway.ts`, `notifications.service.ts` | Socket kiểm token và `tokenVersion` lúc bắt tay. Không push cho tài khoản bị khóa / đã xóa. Token có ticket `DeviceNotRegistered` bị xóa; receipt chưa đọc. |
| `mail` | Gửi email | `mail.service.ts` | `SMTP_HOST`, `SMTP_USER`, `SMTP_PASS`, `MAIL_FROM` đọc bằng `getOrThrow`: thiếu biến thì API không khởi động. Nội dung email ghi tên "MobileSocialMedia". |
| `reports` | Người dùng báo cáo bài, bình luận, người dùng, hội thoại | `reports.controller.ts`, `reports.service.ts` | Báo cáo hội thoại lưu bản chụp 50 tin. Báo cáo hội thoại ẩn danh đóng hội thoại và tước quyền ẩn danh của người gửi ngay. |
| `reels` | URL tải lên có chữ ký, luồng Reels, nhật ký xem | `reels.controller.ts`, `reels.service.ts` | Reel là bài có video dọc / vuông ≤ 60 giây (`Post.reelEligible`), không có bảng riêng (DEC-022). Xếp hạng chấm trong bộ nhớ trên 200 video mới nhất. |
| `messages` | Hội thoại 1-1, tin nhắn chờ, hội thoại ẩn danh, chấp nhận / từ chối / đóng / tiết lộ | `messages.controller.ts`, `messages.service.ts` | Che danh tính ở server cho API, socket và push. Tin chờ: chỉ chữ, tối đa 3 tin. 20 tin chờ mới mỗi 24 giờ (5 nếu tài khoản dưới 7 ngày). Ẩn danh: tài khoản ≥ 7 ngày, 10 hội thoại mới mỗi ngày. `id` tin nhắn do thiết bị sinh để gửi lại không trùng. |
| `stories` | Story 24 giờ, cảm xúc, trả lời, xóa | `stories.controller.ts`, `stories.service.ts` | Hết hạn bằng bộ lọc `expiresAt > now`, không có job dọn. Chủ story không xem được danh sách người xem. Push cảm xúc gộp 15 phút, mốc gộp trong bộ nhớ. |
| `admin` | Trang quản trị và API quản trị | `admin.controller.ts`, `admin.service.ts`, `admin.html` | `GET /api/admin` là trang tĩnh. Mọi route JSON qua `JwtAuthGuard` + `AdminGuard`; `AdminGuard` đọc `role` từ database ở mỗi request nên thu hồi quyền có hiệu lực ngay. Thao tác nhạy cảm ghi `AuditLog`. Xem danh tính người ẩn danh phải ghi lý do. |
| `moderation` | Mô hình ảnh, luật chữ, tuổi | `image-moderation.service.ts`, `text-safety.ts`, `age.ts` | `text-safety.ts`: chặn link, số điện thoại Việt Nam, dãy 8-19 chữ số trong tin chờ và tin ẩn danh; gắn cờ câu chữ lừa đảo. Tuổi tính theo ngày giờ Việt Nam. |
| `storage` | Kho tệp S3 | `storage.service.ts`, `media-url.ts`, `media-url.interceptor.ts` | Tự tạo hai bucket lúc khởi động. Bucket công khai có policy đọc công khai; bucket riêng tư không có policy. |

Các hằng số giới hạn (số tin chờ, số ngày, số người báo cáo…) đặt ở đầu tệp service tương ứng, không đọc từ biến môi trường (`docs/moderation/MODERATION_PLAN.md`, mục 10).

## 3. Ứng dụng di động

### 3.1. Cấu trúc `apps/mobile/src`

| Thư mục | Chứa gì |
|---|---|
| `App.tsx` | Gốc: font, `AuthSessionProvider`, `ErrorBoundary`, `NavigationContainer`. Trên web đặt app trong cột 640px ở giữa. |
| `config/` | `runtime.ts` (`USE_MOCK_API`), `api.ts` (địa chỉ API), `google.ts`, `links.ts` (`SHARE_LINKS_ENABLED`). |
| `features/<tên>/` | Mỗi tính năng một thư mục (DEC-001): `screens/`, `components/`, `services/`, `hooks/`, `types.ts`. Có: `auth`, `onboarding`, `feed`, `post`, `comment`, `reel`, `stories`, `messages`, `notifications`, `profile`, `search`, `settings`, `report`. |
| `navigation/` | `RootNavigator`, `AuthNavigator`, `MainStackNavigator`, `MainTabNavigator`, `ClayTabBar`, `navigationRef.ts` (deep link và URL bản web), `useAppNavigation.ts`. |
| `services/` | `httpClient.ts` (fetch, Bearer token, timeout), `apiError.ts`, `tokenStorage.ts`, `uploadFile.ts`, `followApi.ts`. |
| `theme/` | `palettes.ts` (một bảng màu, màu chính `#CC2F6E`, nền `#F6F1F3`), `colors.ts`, `typography.ts` (Be Vietnam Pro 400/500/600/700), `spacing.ts`, `clay.ts`. |
| `components/ui/` | Khối giao diện dùng chung: `ClayText` (`level` cho tiêu đề), `ClayButton` (có `tonal`), `ClayInput`, `ClaySurface`, `FolderTabs`. Tên `Clay*` giữ lại từ thiết kế cũ, giao diện đã đổi (DEC-021, DEC-027). |
| `components/common/` | `ActionSheet`, `ConfirmModal`, `toast` (`showToast`), `ScreenHeader`, `LoadError`, `ErrorBoundary`, `UserListScreen`, `UserAvatar`, `RichText`… |
| `components/icons/` | `ClayIcon` bọc `lucide-react-native`. |

Quy ước giao diện (DEC-021, DEC-027): không dùng `Alert.alert` hay hộp thoại hệ điều hành; phản hồi ngắn là `showToast`, quyết định là `ConfirmModal`, danh sách lựa chọn là `ActionSheet`. Màu chính chỉ dùng cho dấu nhỏ (một nút chính mỗi màn, tab đang chọn, đã thích). Không có bóng đổ lúc nghỉ. Trình xem Reels và story nền đen.

### 3.2. Điều hướng

`RootNavigator` chọn nhánh theo phiên:

1. Chưa đăng nhập: `AuthNavigator` (Intro, Login, Register, ForgotPassword, VerifyCode, NewPassword, Legal).
2. Đã đăng nhập nhưng `birthDate === null`: `BirthDateScreen` (khai ngày sinh một lần, có ô đồng ý điều khoản).
3. `onboardedAt === null`: `OnboardingScreen`.
4. Còn lại: `MainStackNavigator`. Màn đầu là thanh 5 tab (Trang chủ, Tìm kiếm, Đăng, Tin nhắn, Cá nhân); các màn khác đẩy lên trên (hồ sơ người khác, chi tiết bài, trình xem Reels, chat, story, cài đặt…). Thông báo mở từ chuông ở đầu Trang chủ (DEC-023).

`navigationRef.ts` khai báo deep link `mobilesocial://p/<postId>`, `mobilesocial://u/<userId>`, và URL cho bản web (`/messages`, `/settings`, `/settings/2fa`…). Chat, story và Reels không có URL riêng.

`httpClient` gặp bất kỳ `401` nào thì đăng xuất người dùng. Vì vậy các lỗi "sai mật khẩu" trên thao tác khi đã đăng nhập (đổi mật khẩu, xóa tài khoản, bật 2FA) server trả `400`, không phải `401` (DEC-020).

### 3.3. Chế độ dữ liệu mẫu

`EXPO_PUBLIC_USE_MOCK=true` (trong `apps/mobile/.env.local`) bật dữ liệu mẫu cho mọi service và bỏ qua đăng nhập (người dùng mẫu `user-001`). Không cần backend. Jest luôn chạy ở chế độ này trừ khi `LIVE_API=1` (`jest.config.js`).

`EXPO_PUBLIC_MOCK_SIGNED_OUT=true` cùng với chế độ mẫu thì app mở ở màn đăng nhập, để xem các màn xác thực. Lưu ý: `authService.login` không có nhánh dữ liệu mẫu, nên bấm "Đăng nhập" ở chế độ này vẫn gọi mạng.

Dữ liệu mẫu cố ý chứa các trường hợp an toàn: một ảnh bài viết bị làm mờ, hộp thư 5 hội thoại có ảnh mờ, tin lừa đảo bị gắn cờ, link đáng ngờ, một tin nhắn chờ từ người lạ.

### 3.4. Bản web

Đang ở mức thử nghiệm (DEC-027, `docs/change.md` mục 31/10). `react-native-web` đã cài; `src/config/api.ts` trên web gọi `http://<host của trang>:3000/api`. `expo-secure-store`, `expo-file-system`, `expo-video-thumbnails` và Google Sign-In không có bản web, nên bản web chỉ dùng được ổn định với dữ liệu mẫu. CORS của API đang mở cho mọi origin để bản web gọi được.

### 3.5. Địa chỉ API

Thứ tự: `EXPO_PUBLIC_API_BASE_URL` nếu có; nếu không (chỉ khi `__DEV__`), app lấy host của máy đang phục vụ bundle Metro và gọi cổng 3000 trên máy đó. Bản phát hành bắt buộc đặt `EXPO_PUBLIC_API_BASE_URL` (xem `apps/mobile/eas.json`). Metro in địa chỉ đang dùng ở dòng `[api] Backend URL: …`.

## 4. Dữ liệu

24 bảng trong `apps/api/prisma/schema.prisma`. Mọi migration đến nay chỉ thêm, không xóa cột.

| Nhóm | Bảng | Giữ gì |
|---|---|---|
| Tài khoản | `User` | Danh tính, hồ sơ, `role` (`USER` / `ADMIN`), `bannedAt`, `birthDate`, `ageLockedAt`, `isPrivate`, `allowAnonymousMessages`, `anonymousSuspendedAt`, `messagePermission`, `tokenVersion`, `failedLoginCount`, `loginLockedUntil`, `twoFactorEnabled`, `deletedAt`. |
| | `AuthToken` | Mã OTP đã băm, theo mục đích (`EMAIL_VERIFICATION`, `PASSWORD_RESET`, `LOGIN_TWO_FACTOR`), hạn, số lần thử. |
| | `DeviceToken` | Token push Expo theo thiết bị. |
| Nội dung | `Post`, `PostMedia` | Bài viết (quyền riêng tư `PUBLIC` / `FRIENDS` / `PRIVATE`, xóa mềm `deletedAt`, `reelEligible`) và tệp đính kèm (URL `s3:` / `s3p:`, ảnh bìa video, kích thước, thời lượng, cờ `sensitive`). |
| | `Repost`, `Save`, `HiddenPost` | Đăng lại, lưu, ẩn bài. |
| | `Like` | Cảm xúc trên bài (cột `type`). |
| | `Comment`, `CommentLike` | Bình luận hai tầng (`parentId`), `editedAt`, `removedAt`; thích bình luận. |
| | `Story`, `StoryReaction`, `StoryView` | Story (hạn `expiresAt`, `allowAnonymous`), cảm xúc (có `isAnonymous`), lượt xem. |
| | `ContentInteraction` | Nhật ký xem Reels, đầu vào cho xếp hạng. |
| Quan hệ | `Follow`, `FollowRequest`, `Block`, `Mute` | Theo dõi, yêu cầu theo dõi, chặn, tắt tiếng. |
| Tin nhắn | `Conversation` | Một hàng mỗi cặp và mỗi loại (`kind`: `DIRECT`, `ANON_A`, `ANON_B`); `userAId < userBId`; `status` (`PENDING` / `ACCEPTED`), `requesterId`, `revealedAt`, `closedAt`, mốc đã đọc của mỗi bên. |
| | `Message` | Nội dung, ảnh (`s3p:`), `sensitive`, `storyId` (trả lời story). |
| Thông báo | `Notification` | Thông báo trong app (`type`, người gây ra, bài, bình luận, `readAt`). |
| Kiểm duyệt | `Report` | Báo cáo (`targetType`, `reason`, `status`, `snapshot` JSON cho hội thoại). |
| | `AuditLog` | Thao tác nhạy cảm của quản trị viên (`action`, đối tượng, `reason`). |

Quy trình thay đổi schema: sửa `schema.prisma`, tạo migration mới bằng `corepack pnpm exec prisma migrate dev --name <tên>`, không dùng `prisma db push`, không sửa migration đã áp dụng (`apps/api/README.md`, DEC-006).

## 5. Mô hình bảo mật (tóm tắt)

- **Access token.** JWT HS256 ký bằng `JWT_SECRET`, sống 30 ngày, payload `{ sub, ver }`. Mỗi request đã xác thực (`JwtStrategy`) và mỗi lần bắt tay socket đều đọc `User.tokenVersion` và `deletedAt` từ database (`auth/session.ts`): token có `ver` khác, hoặc tài khoản đã xóa, bị trả `401 SESSION_REVOKED`. Đăng xuất, đổi mật khẩu, đặt lại mật khẩu và xóa tài khoản tăng `tokenVersion`, nên mọi thiết bị bị đăng xuất. Token cũ không có `ver` được coi là `0`. Chưa có refresh token.
- **Tài khoản bị khóa và khóa tuổi.** `JwtStrategy` từ chối theo hai tập `bannedUserIds` và `ageLockedUserIds` trong bộ nhớ (`auth/ban-list.ts`), nạp từ database lúc khởi động và cập nhật khi quản trị viên thao tác.
- **Xác thực hai lớp.** Khi bật, đăng nhập đúng mật khẩu (hoặc Google) không trả access token mà trả `challengeToken` sống 10 phút, ký bằng khóa khác (`JWT_SECRET + ":login-two-factor"`), nên không dùng được như access token. Mã 6 số gửi qua email, 5 phút, 5 lần thử, tối đa 5 mã mỗi giờ mỗi tài khoản. Bật / tắt luôn phải nhập mật khẩu hiện tại.
- **Chống dò mật khẩu.** 10 lần đăng nhập mỗi phút mỗi IP; 5 lần sai liên tiếp khóa đăng nhập bằng mật khẩu của tài khoản đó 15 phút (`423`). Email không tồn tại vẫn chạy một lần so bcrypt để thời gian trả lời không lộ email nào có thật.
- **Quản trị.** `AdminGuard` đọc vai trò từ database ở mỗi request. Trang quản trị giữ token trong `sessionStorage`. Xem danh tính người ẩn danh, xử lý báo cáo, khóa / mở khóa, mở khóa tuổi, trả / tước quyền ẩn danh, khôi phục bình luận đều ghi `AuditLog`. Danh sách báo cáo hội thoại không lộ danh tính cho tới khi quản trị viên ghi lý do và mở.
- **Tệp riêng tư.** Ảnh và video bài viết, story, ảnh tin nhắn tải sau 01/11/2026 nằm trong bucket không đọc công khai; client chỉ nhận URL có chữ ký 1 giờ. Ai được nhận URL do truy vấn dữ liệu quyết định (quy tắc hiển thị bài, thành viên hội thoại); việc ký không mở thêm đường truy cập nào. Ảnh đại diện, ảnh bìa và tệp cũ vẫn ở bucket công khai.
- **Che danh tính ẩn danh.** Server thay người gửi ẩn danh bằng `{ id: "anonymous", displayName: "Người ẩn danh" }` trong API, sự kiện socket và push, cho tới khi người gửi tự tiết lộ. Danh tính thật vẫn nằm trong `Conversation` và `Message.senderId`; chỉ quản trị viên xem được qua báo cáo, có ghi nhật ký.
- **Bí mật.** Không có bí mật trong git (`.env`, `.env.*` bị bỏ qua, chỉ `.env.example` được commit). Biến `EXPO_PUBLIC_*` nằm trong bản build app, không được chứa bí mật.

## 6. Kết quả rà soát bảo mật

(bổ sung sau vòng rà soát)
