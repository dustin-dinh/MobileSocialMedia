# Vấn đề đã biết và việc còn mở

Tổng hợp ngày 08/11/2026 từ `docs/decisions.md`, `docs/change.md`, `docs/deploy.md` (mục 6), `docs/legal/README.md`, `docs/moderation/MODERATION_PLAN.md` (mục 12), các chú thích `shortcut:` trong code, và những gì thấy khi đọc code để viết bộ tài liệu này.

Mỗi mục có: vấn đề, ảnh hưởng, cách sửa đề xuất. Mức: **Cao** = chặn phát hành hoặc làm lộ dữ liệu; **Trung bình** = người dùng sẽ gặp, hoặc hỏng khi lớn lên; **Thấp** = nên làm.

Tìm nhanh các chỗ cố ý làm tắt trong code: `grep -rn "shortcut:" apps/api/src apps/mobile/src`.

## 1. Bảo mật và quyền riêng tư

| # | Mức | Vấn đề | Ảnh hưởng | Đề xuất |
|---|---|---|---|---|
| 1.1 | Cao | **Tệp bài viết và story tải lên trước 01/11/2026 vẫn ở bucket công khai** (`s3:<key>` trong `PostMedia.url`, `PostMedia.thumbnailUrl`, `Story.url`, `Story.thumbnailUrl`). Chỉ tệp mới vào bucket riêng tư (`docs/api-contract.md`, mục "Private post and story media"). | Ai có đường dẫn trực tiếp đều mở được, kể cả ảnh của bài "Chỉ mình tôi" hay bài của tài khoản riêng tư. | Viết script di chuyển: với mỗi hàng có giá trị bắt đầu bằng `s3:` ở các cột trên, `CopyObject` sang `S3_PRIVATE_BUCKET`, cập nhật thành `s3p:<key>`, rồi xóa bản cũ. Chạy được nhiều lần (bỏ qua hàng đã là `s3p:`). Ảnh đại diện và ảnh bìa cố ý ở lại bucket công khai. Tệp cũ trên Supabase Storage (URL tuyệt đối) cũng cần chuyển hoặc bỏ, xem 3.6. |
| 1.2 | Trung bình | **`trust proxy` bật một tầng** (`src/main.ts`) bất kể API có đứng sau proxy hay không. | Nếu cổng API mở thẳng ra Internet, client tự đặt `X-Forwarded-For` là lách được mọi giới hạn theo IP (đăng nhập 10/phút, 2FA, quên mật khẩu, trần chung). Bộ `account-security-smoke` dùng đúng cách này. | Chỉ bật `trust proxy` khi có proxy thật, đọc số tầng từ biến môi trường; luôn để API nghe ở `127.0.0.1` sau proxy (compose bản chạy thật đã làm). Proxy phải ghi đè, không nối thêm, `X-Forwarded-For`. |
| 1.3 | Trung bình | **CORS mở cho mọi origin**: `app.enableCors()` trong `src/main.ts`, và `cors: { origin: "*" }` ở gateway Socket.IO. | Một trang web bất kỳ gọi được API từ trình duyệt nếu có token. Rủi ro thấp vì xác thực bằng Bearer, không dùng cookie, nhưng không nên để khi có bản web thật. | Danh sách origin của bản web, đọc từ biến môi trường, cho cả REST và gateway. |
| 1.4 | Trung bình | **Socket đã mở không bị ngắt khi phiên bị thu hồi.** Gateway chỉ kiểm `tokenVersion` lúc bắt tay; lúc bắt tay cũng không kiểm danh sách tài khoản bị khóa (`bannedUserIds`, `ageLockedUserIds`). Thấy khi đọc code, chưa chạy thử. | Thiết bị đã bị "đăng xuất mọi nơi", hoặc tài khoản vừa bị khóa, vẫn nhận sự kiện `message:new` (có nội dung tin) cho tới khi socket tự nối lại. Tài khoản bị khóa vẫn bắt tay socket được. | Khi tăng `tokenVersion` hoặc khóa tài khoản: `server.in("user:<id>").disconnectSockets(true)`. Thêm kiểm `bannedUserIds` / `ageLockedUserIds` vào `handleConnection`. |
| 1.5 | Trung bình | **Chưa có refresh token**; access token sống 30 ngày. Thu hồi phiên đã có (`tokenVersion`), nhưng là thu hồi toàn bộ thiết bị một lúc. | Token bị lộ dùng được tới khi người dùng đăng xuất hoặc đổi mật khẩu. Không có danh sách thiết bị, không đăng xuất từng máy. | Tính năng A2 trong `docs/plan` (refresh token xoay vòng, danh sách thiết bị). Phải cập nhật DEC-008. |
| 1.6 | Trung bình | **Trang quản trị không xử lý đăng nhập hai lớp.** `admin.html` đọc `res.data.user.role` ngay sau `POST /auth/login`; khi tài khoản bật 2FA, response là `{ twoFactorRequired, challengeToken }` nên trang báo lỗi JavaScript. | Quản trị viên không bật được 2FA cho chính mình, đúng tài khoản cần 2FA nhất. | Thêm bước nhập mã vào `admin.html`, gọi `POST /auth/2fa/verify`. |
| 1.7 | Thấp | Khóa đăng nhập theo tài khoản (5 lần sai, 15 phút) không cần biết mật khẩu để kích hoạt. | Người khác biết email có thể khóa đăng nhập bằng mật khẩu của nạn nhân liên tục (Google vẫn vào được). | Theo dõi trong log; nếu bị lạm dụng thì thêm CAPTCHA sau vài lần sai, hoặc khóa theo cặp tài khoản + IP. |
| 1.8 | Thấp | Đổi hoặc đặt lại mật khẩu không gửi email báo cho chủ tài khoản (mục 11 của danh sách lỗi trong kế hoạch, phần "không gửi email báo"). | Người dùng không biết tài khoản bị đổi mật khẩu. | Thêm một email thông báo trong `MailService`. |
| 1.9 | Thấp | Trang quản trị giữ token trong `sessionStorage` và dùng hộp `confirm()` của trình duyệt (DEC-023). | Chấp nhận được cho công cụ nội bộ; XSS trên trang này sẽ lộ token quản trị. | Giữ trang tĩnh, không chèn HTML từ dữ liệu người dùng (hiện dùng `textContent`); thêm Content-Security-Policy. |
| 1.10 | Thấp | **Server không bắt buộc ngày sinh.** Tài khoản chưa khai ngày sinh (tài khoản cũ, tài khoản Google mới) chỉ bị chặn bởi màn "Ngày sinh" trong app; API vẫn phục vụ mọi route. Thấy khi đọc code. | Client tự viết (hoặc gọi API trực tiếp) dùng được mạng xã hội 18+ mà không khai tuổi. | Từ chối (`403`, một `code` riêng) các route nội dung khi `birthDate` là `null`, trừ `PATCH /users/me/birth-date`, `GET /users/me`, đăng xuất. |
| 1.11 | — | Mục "Kết quả rà soát bảo mật" ở `kien-truc.md` để trống chờ vòng rà soát. | | |

## 2. Cửa hàng ứng dụng, iOS, thông báo đẩy

| # | Mức | Vấn đề | Ảnh hưởng | Đề xuất |
|---|---|---|---|---|
| 2.1 | Cao | **Ứng dụng chưa từng chạy trên iOS.** | Không biết lỗi bố cục, bàn phím, quyền, video trên iPhone. `RULE.md` không cho phép coi tính năng là xong khi chưa chạy trên cả hai nền tảng. | Chạy trên iPhone (Expo Go trước, rồi development build), sửa lỗi, ghi lại nền tảng đã chạy trong `docs/change.md`. |
| 2.2 | Cao (khi nhắm iOS) | **Chưa có Sign in with Apple** (App Store Guideline 4.8), trong khi có đăng nhập Google. DEC-026 nói sẽ ẩn nút Google trên iOS, nhưng code chưa ẩn (`config/google.ts` không xét `Platform.OS`). | App Store từ chối. | Hoặc thêm Sign in with Apple (tính năng A6 trong kế hoạch), hoặc ẩn nút Google khi `Platform.OS === 'ios'`. |
| 2.3 | Cao (khi nhắm iOS) | **Nhắn ẩn danh và Guideline 1.2** ("random or anonymous chat"). | Rủi ro bị từ chối lớn nhất trên App Store. | Chủ dự án đã chọn chưa nhắm iOS lúc này. Khi nhắm iOS: quyết định giữ hay tắt tính năng ẩn danh trên iOS, ghi vào `docs/decisions.md` (`RULE.md`, Cross-Platform Rule mục 12). |
| 2.4 | Cao | **Thông báo đẩy chưa từng tới một thiết bị thật.** `app.json` chưa có `extra.eas.projectId` (app tự bỏ qua đăng ký push), chưa có `google-services.json` (FCM), chưa có khóa APNs. | Không có push cho tới khi cấu hình xong; chưa ai thấy push thật hiển thị ra sao. | Làm theo `docs/deploy.md` mục 5.2 và 5.4, build development, thử trên cả Android và iPhone. |
| 2.5 | Trung bình | Chưa đọc **receipt** của Expo push, chỉ đọc ticket (`notifications.service.ts`). Toàn bộ thiết bị của một người gửi trong một request, không có access token Expo. | Token chết mà Expo chỉ báo ở receipt không bị dọn; push vẫn gửi tới chúng. | Lưu ticket id, gọi `/push/getReceipts` sau vài phút, xóa token `DeviceNotRegistered`. Có thể dùng `expo-server-sdk` (thư viện mới, cần đồng ý). |
| 2.6 | Thấp | **Số trên biểu tượng app** chỉ cập nhật khi app đang chạy (`pushService.setBadge`); server không gửi `badge` trong payload. | Trên iOS số trên biểu tượng sai khi app đóng. | Server tính tổng chưa đọc (thông báo + tin nhắn) và gửi `badge` trong mỗi push. |
| 2.7 | Trung bình | **`app.json` còn giá trị tạm**: tên "Mobile Social Network MVP", `com.mobilesocial.app`, chưa có `icon`, `splash`, `android.adaptiveIcon`; `eas.json` trỏ `https://api.example.com/api`. Cấu hình iOS cho Google Sign-In (`iosUrlScheme`) chưa có. | Không nộp store được với giá trị này; bundle id không đổi được sau khi lên store. | `docs/deploy.md`, mục 5.1 và 5.3. |
| 2.8 | Thấp | Plugin `expo-image-picker` có thể tự khai quyền camera và micro, dù app không dùng (`docs/legal/README.md`, mục 5). | Khai Data safety / App Privacy sai, hoặc store hỏi lý do. | Đặt `cameraPermission: false`, `microphonePermission: false` cho plugin, kiểm lại trên cả hai nền tảng. |
| 2.9 | Trung bình | Chưa có trang web công khai (HTTPS) cho chính sách, điều khoản, tiêu chuẩn cộng đồng và yêu cầu xóa tài khoản. | Cả hai store bắt buộc. | Phục vụ trang tĩnh từ API như `/api/admin`, hoặc một trang web riêng (`docs/legal/README.md`, mục 5). |

## 3. Tệp, ảnh và video

| # | Mức | Vấn đề | Ảnh hưởng | Đề xuất |
|---|---|---|---|---|
| 3.1 | Trung bình | **URL có chữ ký hết hạn sau 1 giờ** (`PRIVATE_URL_TTL_SECONDS = 3600`, `media-url.ts`). | Màn hình mở lâu (bảng tin, chat, Reels) mà chưa tải lại sẽ hiện ảnh và video hỏng khi cuộn tới tệp chưa có trong cache. | Khi ảnh báo lỗi tải thì tải lại bài / tin đó để lấy URL mới; hoặc tải lại danh sách khi app quay lại từ nền sau hơn ~50 phút. Cân nhắc CDN với cookie có chữ ký. |
| 3.2 | Trung bình | **`expo-video` không cache được video có chữ ký**: URL đổi mỗi lần tải, nên mỗi lần mở là tải lại cả video. Ảnh thì đã cache theo id tệp (`cacheKey`). | Tốn dung lượng mạng của người dùng và băng thông kho tệp; video khởi động chậm. | Ký URL với `signingDate` làm tròn theo khung giờ để URL giữ nguyên trong khung đó (hàm `getSignedUrl` của AWS SDK nhận `signingDate`), rồi bật cache của `expo-video`. Hoặc CDN. |
| 3.3 | Trung bình | **Không chuyển mã, không nén video**; thời lượng video do client báo, server không đọc tệp (DEC-022). Giới hạn 30 MB. | Video lớn phát chậm trên mạng yếu; client sửa được thời lượng để lọt vào Reels. | Hàng đợi chuyển mã (ffmpeg / dịch vụ đám mây), đọc thời lượng bằng ffprobe. |
| 3.4 | Trung bình | **Mô hình làm mờ chưa chạy cho** ảnh bìa video, story, ảnh đại diện, ảnh bìa hồ sơ, và khung hình video. | Ảnh nhạy cảm ở các chỗ đó không bị làm mờ. | Dùng lại `ImageModerationService` (`MODERATION_PLAN.md` mục 8). Tệp tải thẳng lên kho thì đọc lại từ kho (≤ 2 MB) trước khi lưu bản ghi. |
| 3.5 | Thấp | Story hết hạn và bài đã xóa mềm không bị dọn, tệp vẫn nằm trong kho. | Dung lượng tăng mãi; văn bản pháp lý phải nói đúng điều này. | Job định kỳ xóa hàng và tệp hết hạn / đã xóa quá N ngày. |
| 3.6 | Trung bình | **Tệp cũ trên Supabase Storage** (bài trước 12/10/2026) là URL tuyệt đối. Dự án Supabase đang tạm dừng. | Các ảnh đó có thể không tải được; xóa bài không xóa tệp trên Supabase. | Khi có quyền truy cập Supabase: tải về, đưa vào bucket riêng tư, cập nhật URL. Nếu không: chấp nhận mất, hoặc xóa các `PostMedia` đó. |
| 3.7 | Thấp | Mô hình ảnh tải từ nhánh `main` của Hugging Face, không ghim commit (`download-moderation-model.cjs`, `REVISION = 'main'`). | Mỗi lần build image có thể nhận bản mô hình khác. | Ghim `REVISION` vào một commit cụ thể và kiểm tổng SHA-256. |
| 3.8 | Thấp | MinIO dùng image `bitnamilegacy/minio`, không còn cập nhật. | Chỉ ổn cho dev. | Chạy thật dùng AWS S3 hoặc Cloudflare R2 (`docs/deploy.md`). |

## 4. Vận hành và mở rộng

| # | Mức | Vấn đề | Ảnh hưởng | Đề xuất |
|---|---|---|---|---|
| 4.1 | Trung bình | **Chỉ chạy được một tiến trình API.** Nằm trong bộ nhớ: danh sách tài khoản bị khóa và khóa tuổi (`auth/ban-list.ts`), bộ đếm giới hạn tần suất, phòng Socket.IO, mốc gộp push cảm xúc story. | Chạy hai bản trở lên: khóa tài khoản chỉ có hiệu lực ở một bản, giới hạn tần suất nhân đôi, tin realtime không tới người đang nối vào bản kia, push story có thể trùng. | Redis: `@socket.io/redis-adapter`, storage Redis cho `@nestjs/throttler`, tập khóa trong Redis (hoặc kiểm `bannedAt` / `ageLockedAt` trong `assertSessionValid`, vốn đã đọc `User` ở mỗi request). |
| 4.2 | Trung bình | **Không có báo lỗi tập trung** (crash reporting). `ErrorBoundary` chỉ hiện màn dự phòng và ghi log thiết bị; API chỉ log ra stdout. | Lỗi của người dùng thật không ai thấy. | Sentry (hoặc tương đương) cho app và API, trước khi phát hành. Phải khai trong chính sách quyền riêng tư. |
| 4.3 | Trung bình | **Tin nhắn chưa gửi chỉ nằm trong bộ nhớ** (`features/messages/chatOutbox.ts`). Rời màn chat vẫn giữ, nhưng tắt app là mất. | Tin gõ lúc mất mạng rồi tắt app biến mất mà không báo. | Lưu hộp chờ gửi xuống bộ nhớ máy (ví dụ tệp JSON qua `expo-file-system`, đã cài), nạp lại khi mở app. |
| 4.4 | Thấp | Chưa có hướng dẫn sao lưu database và kho tệp. | Mất dữ liệu khi máy chủ hỏng. | Sao lưu PostgreSQL định kỳ (hoặc dùng dịch vụ có sẵn), bật versioning cho bucket. |
| 4.5 | Thấp | Hằng số an toàn (3 tin chờ, 20 tin chờ / ngày, 10 hội thoại ẩn danh / ngày, 7 ngày tuổi tài khoản, 50 tin bản chụp, 15 phút gộp push) viết cứng trong service. | Đổi chính sách phải sửa code và deploy. | Chuyển các số cần chỉnh thường xuyên sang biến môi trường hoặc bảng cấu hình. |

## 5. Hiệu năng và chức năng làm tắt

Đều có chú thích `shortcut:` tại chỗ.

| # | Mức | Vấn đề | Khi nào phải sửa | Đề xuất |
|---|---|---|---|---|
| 5.1 | Trung bình | Phân trang bảng tin trộn hai nguồn (bài và bài đăng lại) theo offset (`posts.service.ts`). | Trang càng sâu càng chậm. | Phân trang theo con trỏ thời gian. |
| 5.2 | Trung bình | Tìm bài bằng `ILIKE` quét toàn bảng. | Vài chục nghìn bài. | Chỉ mục `pg_trgm` hoặc tìm kiếm toàn văn. |
| 5.3 | Thấp | Hashtag thịnh hành đếm trong bộ nhớ trên 500 bài mới nhất (`search.service.ts`). | Lượng bài lớn. | Bảng hashtag. |
| 5.4 | Thấp | Xếp hạng Reels chấm điểm trong bộ nhớ trên 200 video mới nhất (`reels.service.ts`). | Nhiều video, cần cá nhân hóa. | Tính năng D5 trong kế hoạch, `docs/reel/REEL_FINAL_SPEC_AND_PLAN.md`. |
| 5.5 | Thấp | Hàng đợi báo cáo gộp nhóm trong bộ nhớ trên toàn bộ báo cáo đang mở (`admin.service.ts`). | Hàng nghìn báo cáo mở. | `groupBy` trong SQL. |
| 5.6 | Thấp | Luật chặn liên lạc (`text-safety.ts`) lách được bằng cách viết số thành chữ. | Khi kẻ lừa đảo thích nghi. | OCR và mô hình chữ (`MODERATION_PLAN.md` mục 8). |
| 5.7 | Thấp | Danh sách ngân hàng / ví mà kẻ lừa đảo giả mạo là danh sách cố định (`features/messages/linkSafety.ts`). | Khi có thương hiệu mới bị giả mạo. | Bên nhận xác nhận tên miền thật và bổ sung từ báo cáo. |

## 6. Giao diện, ngôn ngữ, công cụ

| # | Mức | Vấn đề | Đề xuất |
|---|---|---|---|
| 6.1 | Thấp | **Còn 21 nhãn trợ năng (`accessibilityLabel`) tiếng Anh** trong 7 tệp: `AuthScreenContainer.tsx` ("Back"), `ForgotPasswordScreen.tsx`, `NewPasswordScreen.tsx`, `VerifyCodeScreen.tsx`, `CommentModal.tsx`, `PostCard.tsx` ("More options", "Comments", "Share post"), `CreateScreen.tsx`. Một số log và thông báo lỗi nội bộ cũng tiếng Anh. Trình đọc màn hình sẽ đọc tiếng Anh. | Dịch; khi đổi nhớ sửa test dùng các nhãn đó. |
| 6.2 | Thấp | Giao diện dựng lại (DEC-027, trạng thái "Proposed") mới kiểm trên bản web 390px; bàn phím ở màn Đăng và ô bình luận, kích thước màn Intro chưa kiểm trên thiết bị. | Chạy trên Android và iPhone thật. |
| 6.3 | Thấp | Người dùng mẫu trong chế độ dữ liệu mẫu mang tên và email của bên bán ("Nguyễn Nhật Luân", `luan@mobilesocial.vn`, `features/auth/authSession.tsx`, `authService.ts`). | Đổi sang tên trung tính trước khi trình diễn cho bên ngoài. |
| 6.4 | Thấp | Tên sản phẩm chưa thống nhất: `app.json` "Mobile Social Network MVP", email ghi "MobileSocialMedia", văn bản pháp lý `[TÊN ỨNG DỤNG]`. | Chọn một tên, sửa ở cả ba chỗ. |
| 6.5 | Thấp | `scripts/verify-ui.mjs` luật H hỏng sẵn (so với ảnh chụp cũ, DEC-017); `scripts/qa/*.ps1` dùng tọa độ màn hình cũ. | Làm mới mốc so sánh hoặc bỏ luật H; viết lại hoặc bỏ các script adb. |
| 6.6 | Thấp | Đăng xuất trong Expo Go hiện LogBox đỏ vì thiếu module native Google Sign-In (lỗi đã được bắt; chỉ xuất hiện ở bản dev). | Bỏ qua, hoặc không gọi `googleSignIn.signOut()` khi chạy Expo Go. |
| 6.7 | Thấp | taste-skill (công cụ lint giao diện) không nằm trong repo. | Xin bên bán bản thư mục skill, hoặc bỏ cổng kiểm này. |

## 7. Pháp lý

Chi tiết ở `docs/legal/README.md`. Tóm tắt việc phải làm trước khi công bố:

- **Văn bản là bản nháp**, chưa qua luật sư. Có 14 loại chỗ trống phải điền (`[TÊN DOANH NGHIỆP]`, `[ĐỊA CHỈ]`, `[MÃ SỐ DOANH NGHIỆP]`, `[EMAIL LIÊN HỆ]`, `[EMAIL BẢO VỆ DỮ LIỆU]`, `[NGÀY HIỆU LỰC]`, `[TÊN ỨNG DỤNG]`, nhà cung cấp và vị trí lưu trữ, thời hạn giữ báo cáo và sao lưu, đường dẫn xóa tài khoản và chính sách). Chỗ trống hiện nguyên văn trong app.
- **16 câu hỏi luật Việt Nam và 2 câu hỏi store** cần luật sư xác nhận (mục 3 của README pháp lý). Các điểm có thể đòi sửa code:
  - Nghị định 147/2024: xác thực tài khoản bằng số điện thoại Việt Nam hoặc số định danh (app chỉ xác thực email); lưu thông tin tài khoản, giờ đăng nhập và IP trong 2 năm (**app hiện không lưu IP, không có nhật ký đăng nhập**); thời hạn gỡ nội dung 24 / 48 giờ.
  - Luật An ninh mạng 2025: có thể phải lưu dữ liệu tại Việt Nam.
  - Luật Bảo vệ dữ liệu cá nhân 91/2025: hình thức đồng ý (đăng ký đã có ô đánh dấu tiếng Việt, xem `features/auth/components/LegalConsent.tsx`), có thể cần ô đồng ý riêng cho chuyển dữ liệu ra nước ngoài; hồ sơ đánh giá tác động chuyển dữ liệu ra nước ngoài.
  - Tài khoản bị khóa vì khai dưới 18 tuổi: dữ liệu không tự xóa; tự khai ngày sinh có đủ không.
- **Chưa lưu phiên bản chính sách và thời điểm người dùng đồng ý.** Khi đổi chính sách không biết ai đã đồng ý bản nào. Cần thêm trường lưu.
- Quyền truy cập, sửa, xuất dữ liệu và xóa một phần hiện là việc làm tay qua email.
- Mục 4 của `docs/legal/README.md` ("Lệch giữa `LegalScreen.tsx` hiện tại và thực tế") viết trước DEC-028 và trước đợt phần 1-2; nhiều điểm trong đó đã được sửa (xem mục 9 bên dưới). Đối chiếu lại trước khi dùng.

## 8. Phạm vi chưa làm (khoảng 70% còn lại)

DEC-026 cố ý giữ sản phẩm ở khoảng 30% Facebook. Các tính năng sau có đặc tả, flowchart và ước lượng trong `docs/plan/ke-hoach-tinh-nang.pdf` (mục V), lộ trình ở mục IV:

| Nhóm | Chưa làm |
|---|---|
| Tài khoản (A) | Refresh token và danh sách thiết bị (A2), cảnh báo đăng nhập lạ (A3), xác thực số điện thoại (A5), Sign in with Apple (A6), 2FA bằng ứng dụng TOTP và mã dự phòng (A1 hiện chỉ có mã email). |
| An toàn (B) | Giới hạn tạm thời khi bị quấy rối hàng loạt (B4), làm mờ toàn app gồm story và video (B5), xác minh tuổi (B6), lọc bình luận và từ ngữ ẩn (B7), "Hạn chế" (B8; tắt tiếng đã có). |
| Kiểm duyệt (C) | Quét tự động và hàng chờ duyệt trước khi hiện (C1), cảnh cáo, xử phạt theo bậc và kháng nghị (C2), phân quyền kiểm duyệt viên riêng với quản trị (C3; nhật ký thao tác đã có). |
| Mạng xã hội (D) | Nhắn tin nhóm (D1); thu hồi, sửa, trả lời trích dẫn, cảm xúc tin nhắn, đang soạn, gửi video, ghi âm (D2); nhóm cộng đồng (D3); gọi thoại / video (D4); xếp hạng bảng tin (D5); trích dẫn bài, bình chọn, gắn thẻ người, lịch sử sửa, ghim bài (D6); bạn thân và tin nổi bật (D7); cài đặt thông báo theo loại, giờ yên lặng (D8); lịch sử tìm kiếm, gợi ý `@`, tìm trong tin nhắn (D9). |
| Quyền riêng tư (E) | Tải xuống dữ liệu (E1), xóa tài khoản có thời gian chờ 30 ngày và trang web yêu cầu xóa (E2), kiểm tra quyền riêng tư (E3), dấu tick xác minh (E4). |
| Khác | Bản web chính thức (bản hiện tại là thử nghiệm), Marketplace, Trang doanh nghiệp, quảng cáo, livestream (kế hoạch cố ý không làm). |

Ước lượng của kế hoạch đầy đủ: khoảng 364 ngày công cho một lập trình viên đã quen code (GĐ1 71,5; GĐ2 104; GĐ3 116,5; GĐ4 72). Một phần GĐ1 và GĐ2 đã làm trong đợt phần 1-2, nên con số thực tế thấp hơn; cần đối chiếu từng mục "Hiện trạng" của PDF với code.

## 9. Đã sửa trong đợt phần 1-2, cần chạy lại để xác nhận

Danh sách 12 lỗi ở mục VI.3 của `docs/plan/ke-hoach-tinh-nang.pdf`, đối chiếu với `docs/api-contract.md` (mục "Changes 2026-11-01") và code ngày 08/11/2026. Đợt này chưa có mục trong `docs/change.md`, nên kết quả chạy chưa được ghi lại; trên thiết bị: chưa ghi nhận ở nền tảng nào.

| # | Lỗi | Hiện trạng theo code |
|---|---|---|
| 1 | Push tin chờ hiện nội dung trên màn khóa | Đã sửa: nội dung push là "Bạn có tin nhắn chờ mới" / "Bạn có tin nhắn ẩn danh mới". |
| 2 | Đã xóa tin chờ vẫn nhận push và socket | Đã sửa. |
| 3 | Tắt nhận ẩn danh không chặn hội thoại đã mở | Đã sửa cho hội thoại mở từ hồ sơ; trả lời story ẩn danh theo cài đặt của story (DEC-025, cố ý). |
| 4 | Bài của tài khoản bị khóa vẫn hiện | Đã sửa (`activeUserWhere` trong `post-view.ts`). |
| 5 | Nhắc tên báo cho người không xem được bài | Đã sửa. |
| 6 | Xem danh tính ẩn danh không ghi nhật ký | Đã sửa: phải ghi lý do, ghi `AuditLog`. |
| 7 | Xóa tài khoản làm mất dữ liệu của người khác | Đã sửa: hàng `User` giữ làm "bia mộ", hội thoại và báo cáo của người khác còn. |
| 8 | Gỡ bình luận là xóa hẳn | Đã sửa: `Comment.removedAt`, khôi phục được. |
| 9 | Nhật ký xem Reels không kiểm quyền xem | Đã sửa: bỏ qua sự kiện của bài không xem được. |
| 10 | Tin chờ gửi mất khi rời màn chat | Sửa một phần: còn khi rời màn, mất khi tắt app (mục 4.3). |
| 11 | Đổi mật khẩu không đăng xuất thiết bị khác; đăng xuất không có tác dụng ở server | Đã sửa (`tokenVersion`). Chưa có email báo (mục 1.8). |
| 12 | Thời gian trả lời lộ email đã đăng ký | Đã sửa: email không tồn tại vẫn chạy một lần so bcrypt. |

Hai việc mở khác ghi ở mục 01/11 của `docs/change.md` cũng đã có trong code: ô đồng ý điều khoản tiếng Việt ở màn đăng ký, màn ngày sinh và trên nút Google (`LegalConsent.tsx`); tệp bài viết mới vào bucket riêng tư (phần tệp cũ: mục 1.1).
