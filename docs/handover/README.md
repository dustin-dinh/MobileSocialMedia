# Bàn giao sản phẩm: điểm bắt đầu

Bộ tài liệu này dành cho tech lead và lập trình viên của bên nhận, những người chưa từng mở repo này. Đọc theo thứ tự ở mục 5.

Soạn ngày 08/11/2026, theo nhánh `feat/gap-checklist`, gồm cả phần chưa commit (đợt "phần 1 và 2" của DEC-026). Khi code đổi mà tài liệu này chưa đổi, code là đúng (`RULE.md`, mục 10).

## 1. Sản phẩm là gì

Một mạng xã hội cho người Việt, **chỉ dành cho người từ 18 tuổi**. Có ứng dụng di động (Android, iOS) viết bằng Expo / React Native, và một backend NestJS + PostgreSQL.

Tính năng ở mức khoảng 30% Facebook: bài viết chữ, ảnh và video, Reels, story 24 giờ, cảm xúc, bình luận, theo dõi, tài khoản riêng tư, tin nhắn 1-1, thông báo, tìm kiếm, trang quản trị.

Điểm khác biệt là **an toàn**:

- tin nhắn từ người lạ vào "Tin nhắn chờ";
- chọn được "Ai được nhắn tin cho tôi";
- nhắn ẩn danh có giới hạn và có thể tự tiết lộ danh tính;
- làm mờ ảnh nhạy cảm trong tin nhắn và bài viết (mô hình chạy ngay trên máy chủ, không gửi ảnh cho bên thứ ba);
- chặn số điện thoại, link, số tài khoản trong tin nhắn chờ và tin ẩn danh;
- cảnh báo tin có dấu hiệu lừa đảo và link đáng ngờ;
- xác thực hai lớp bằng mã email, khóa đăng nhập sau 5 lần sai mật khẩu;
- hàng đợi báo cáo cho quản trị viên, có nhật ký thao tác.

Phạm vi được chủ dự án chốt ở `docs/decisions.md`, DEC-026. Phần chưa làm là lộ trình của bên nhận (mục 4).

## 2. Trong repo có gì

| Đường dẫn | Là gì |
|---|---|
| `apps/api/` | Backend NestJS 11, Prisma 7, PostgreSQL. 16 module nghiệp vụ, 107 route REST dưới `/api`, một namespace Socket.IO `/notifications`. Gói pnpm riêng. |
| `apps/api/prisma/` | `schema.prisma` (24 bảng) và 17 migration. |
| `apps/api/scripts/` | Script quản trị (`make-admin.cjs`, `seed-test-users.cjs`, `download-moderation-model.cjs`) và 9 bộ kiểm thử trên API thật (`*-smoke.cjs`). |
| `apps/api/src/modules/admin/admin.html` | Trang quản trị (một tệp HTML tĩnh, API phục vụ ở `/api/admin`). |
| `apps/mobile/` | Ứng dụng Expo SDK 57, React Native 0.86, TypeScript. Gói pnpm riêng. Chạy được trên Expo Go, development build và bản web (thử nghiệm). |
| `apps/mobile/__tests__/` | Test Jest: 15 bộ chạy trên dữ liệu mẫu, 3 bộ `live/` chạy trên API thật. |
| `apps/mobile/scripts/` | `build-legal-content.mjs` (sinh văn bản pháp lý vào app), `verify-ui.mjs`, `qa/*.ps1` (script adb cũ, tọa độ đã lỗi thời). |
| `docker-compose.yml` | Dịch vụ cho máy dev: MinIO (kho tệp S3), PostgreSQL tùy chọn (profile `localdb`). |
| `docker-compose.prod.yml`, `apps/api/Dockerfile`, `apps/mobile/eas.json` | Triển khai backend bằng Docker, build app bằng EAS. |
| `docs/deploy.md` | Hướng dẫn triển khai lên máy chủ thật và build app lên store. |
| `docs/api-contract.md` | Hợp đồng API giữa app và backend. Các mục ghi theo ngày; mục cuối "Changes 2026-11-01 (parts 1-2)" là mới nhất. |
| `docs/decisions.md` | Các quyết định kỹ thuật (DEC-001 tới DEC-028). |
| `docs/change.md` | Nhật ký thay đổi. Chỉ được thêm, không được xóa hay viết lại (`RULE.md`). |
| `docs/moderation/MODERATION_PLAN.md` | Thiết kế kiểm duyệt, tin nhắn chờ, ẩn danh, chống lừa đảo, 18+. |
| `docs/legal/` | Chính sách quyền riêng tư, điều khoản, tiêu chuẩn cộng đồng (bản nháp, chờ luật sư), và `README.md` liệt kê chỗ trống phải điền. |
| `docs/plan/` | Kế hoạch tích hợp 30 tính năng (`ke-hoach-tinh-nang.pdf`, 288 trang, 75 flowchart) và nguồn để dựng lại. Đây là lộ trình cho bên nhận. |
| `docs/report/` | Báo cáo tính năng (PDF, 31/10/2026) và sơ đồ use case. |
| `docs/handover/` | Bộ tài liệu này. |

Các tệp còn lại ở thư mục gốc và trong `docs/` (`AGENT_STATE.md`, `summary.md`, `DEV_A_*.md`, `docs/w4/`, `docs/forgot/`, `docs/google-login/`, `apps-architecture-context.md`…) là ghi chép của các tuần làm việc trước. Giữ để tra lịch sử; nếu chúng mâu thuẫn với code hoặc với `docs/api-contract.md`, bỏ qua chúng.

`RULE.md` là quy tắc bắt buộc của repo, quan trọng nhất là phần "Cross-Platform Rule": mọi thay đổi phải chạy trên cả Android và iOS, và báo cáo phải ghi đã chạy thử trên nền tảng nào.

## 3. Hiện trạng

Kết quả chạy lúc soạn tài liệu (08/11/2026, trên máy của bên bán):

- `apps/api`: `corepack pnpm typecheck` sạch.
- `apps/mobile`: `corepack pnpm typecheck` sạch; `corepack pnpm test`: 113 test đạt, 39 bỏ qua (39 test `live/` chỉ chạy khi có `LIVE_API=1`).

Bảng dưới ghi mỗi nhóm tính năng được kiểm bằng gì. "Bộ smoke" là script trong `apps/api/scripts/`, chạy trên API thật với database thật. Số phép thử đạt lấy từ `docs/change.md`. Đợt phần 1 và 2 (01/11/2026 trở đi) chưa có mục trong `docs/change.md`, nên cột cuối của các dòng đó chỉ ghi tên script, không ghi kết quả.

| Nhóm tính năng | Có trong code | Kiểm bằng | Đã chạy trên thiết bị |
|---|---|---|---|
| Đăng ký email + mã OTP, đăng nhập, quên và đổi mật khẩu, xóa tài khoản | Có | `api-smoke` (72/72, 17/10), test Jest, live `liveApi`, `gapLive` | Android (BlueStacks, Expo Go) |
| Giới hạn 18+ (ngày sinh, khóa tài khoản dưới 18) | Có | `safety-smoke` (76/76, 17/10), live `safetyLive`, `birthDate.test.ts` | Android |
| Bài viết chữ, ảnh, video; quyền riêng tư bài; đăng lại; lưu; ẩn; hashtag; nhắc tên | Có | `api-smoke`, `reels-smoke` (28/28, 17/10) | Android |
| Reels, tải video thẳng lên kho tệp | Có | `reels-smoke` | Android |
| Bảng tin theo người đang theo dõi, cảm xúc, tài khoản riêng tư, yêu cầu theo dõi, story, tin nhắn 1-1, trang quản trị | Có | `social-smoke` (73/73, 17/10) | Android |
| Tin nhắn chờ, nhắn ẩn danh, chặn thông tin liên lạc, cảnh báo lừa đảo, báo cáo hội thoại, làm mờ ảnh tin nhắn, cảm xúc story ẩn danh | Có | `safety-smoke` | Android (một phần, xem `docs/change.md` mục 17/10) |
| Phiên theo `tokenVersion` (đăng xuất mọi thiết bị), khóa đăng nhập sau 5 lần sai, xác thực hai lớp bằng mã email | Có | `account-security-smoke`, `accountSecurity.test.tsx` | Chưa ghi nhận |
| "Ai được nhắn tin cho tôi", giới hạn tin nhắn chờ mỗi ngày, push không lộ nội dung tin chờ / tin ẩn danh | Có | `messaging-safety-smoke` | Chưa ghi nhận |
| Hàng đợi báo cáo theo mức độ, nhật ký quản trị, xem danh tính phải ghi lý do, gỡ / khôi phục bình luận, xóa tài khoản giữ dữ liệu của người khác | Có | `moderation-smoke` | Chưa ghi nhận (trang quản trị chưa từng mở bằng trình duyệt trong các lần ghi nhận) |
| Ẩn nội dung tài khoản bị khóa, tắt tiếng, làm mờ ảnh bài viết, tệp bài viết và story trong bucket riêng tư | Có | `visibility-smoke`, `linkSafety.test.ts` | Chưa ghi nhận |
| Thông báo đẩy: gửi, dọn token chết, kênh Android, mở đúng màn khi chạm | Có | `push-smoke` (với máy chủ Expo giả) | **Chưa từng nhận push trên thiết bị thật** |
| Đăng nhập Google | Có code | Không | **Chưa từng chạy** (cần development build và OAuth client) |
| Giao diện dựng lại bằng taste-skill (DEC-027) | Có | taste-skill lint 0 FAIL (01/11) | Chỉ bản web 390px, dữ liệu mẫu. Android chưa chạy lại sau khi dựng lại giao diện |

Những gì **chưa từng chạy**:

- **iOS chưa từng chạy**, kể cả trên máy ảo. Mọi lần chạy thử đến nay là Android (BlueStacks, Expo Go) và bản web. Chủ dự án quyết định tạm chưa nhắm iOS (xem `van-de-da-biet.md`, mục 3).
- **Thông báo đẩy chưa từng tới một thiết bị thật.** Code gửi và đăng ký token đã có; `app.json` chưa có `extra.eas.projectId` nên app tự bỏ qua bước đăng ký push.
- **Đăng nhập Google chưa từng chạy** trên thiết bị.
- **Dự án Supabase đang tạm dừng.** Từ 31/10/2026, chuỗi kết nối trong `apps/api/.env` của bên bán trả lỗi "tenant/user not found". Các đợt sau đó chạy trên PostgreSQL cục bộ (profile `localdb` trong `docker-compose.yml`, xem `cai-dat-va-chay.md`). Bên nhận dùng PostgreSQL của mình; không cần Supabase.

## 4. Phần chưa làm

DEC-026 giữ phạm vi khoảng 30% Facebook. Các phần sau để lại cho bên nhận: nhắn tin nhóm, cộng đồng, gọi thoại / video, xếp hạng bảng tin, bình chọn, gắn thẻ người, bạn thân, tải dữ liệu cá nhân, dấu tick xác minh, xác thực số điện thoại, bản web chính thức, Sign in with Apple. Danh sách đầy đủ, đặc tả và ước lượng nằm ở `docs/plan/ke-hoach-tinh-nang.pdf` (mục IV là lộ trình bốn giai đoạn). Tóm tắt ở `van-de-da-biet.md`, mục 7.

## 5. Thứ tự đọc

1. `README.md` (tệp này).
2. `kien-truc.md`: các thành phần, module API, cấu trúc app, dữ liệu, mô hình bảo mật.
3. `cai-dat-va-chay.md`: dựng môi trường trên máy mới, chạy API, app, trang quản trị và các bộ kiểm thử.
4. `kich-ban-demo.md`: 10 phút trình diễn sản phẩm và các tính năng an toàn.
5. `van-de-da-biet.md`: lỗi, giới hạn và việc còn mở, mỗi mục có ảnh hưởng và cách sửa đề xuất.
6. Sau đó: `RULE.md`, `docs/api-contract.md`, `docs/decisions.md` (DEC-020 trở đi), `docs/deploy.md`, `docs/moderation/MODERATION_PLAN.md`, `docs/legal/README.md`.
