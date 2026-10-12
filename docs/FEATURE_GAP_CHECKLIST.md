# Danh sách chức năng còn thiếu — đặc tả chi tiết

> Ngày lập: 12/10/2026 · Đối chiếu với code nhánh `main`, commit `fc04616`.
> Cách lập: đọc code `apps/api` và `apps/mobile`, **không chạy app**. Mục "Hiện trạng" là thứ đã thấy trong code; chỗ nào suy đoán có ghi "cần kiểm tra".
> Phạm vi: các chức năng phụ + giao diện Reel. **Không** gồm backend Reel (người khác phụ trách).
> Mọi endpoint/bảng mới ở đây là **đề xuất**; trước khi code cần ghi vào `docs/api-contract.md` (RULE.md điều 8, 9).

Ký hiệu: **BE** = backend (`apps/api`), **MB** = mobile (`apps/mobile`).
Ưu tiên: **P0** = luồng đang có nhưng hỏng khi chạy với API thật · **P1** = bắt buộc trước khi đưa cho người dùng thật / lên store · **P2** = nên có.

## Trạng thái triển khai (cập nhật 12/10/2026)

Các mục dưới đây đã được cài đặt trên nhánh `feat/gap-checklist`. Phần mô tả chi tiết bên dưới giữ nguyên như lúc lập, nên mục "Hiện trạng" ở đó là trạng thái **trước** khi làm.

Cách kiểm tra: backend bằng `apps/api/scripts/api-smoke.cjs` (71 phép thử trên API thật); phần nối mobile–backend bằng hai bộ test live trong `apps/mobile/__tests__/live/` (34 test); logic mobile bằng Jest. **Chưa có mục nào được chạy trên thiết bị thật hay giả lập.**

| Mục | Trạng thái | Ghi chú |
|---|---|---|
| N0 Stack navigator | Xong | |
| A1 Xác thực email | Xong | |
| A2 Quên mật khẩu thật | Xong | Thêm màn nhập mật khẩu mới |
| A3 Feed lỗi khi có bài đăng lại | Xong | |
| A4 Đăng lại gọi API | Xong | |
| A5 Lộ bài riêng tư | Xong | Sửa luôn ở bình luận, like, tìm kiếm |
| A6 Sửa hồ sơ | Xong | |
| A7 Bấm thông báo | Xong | |
| A8 Tải thêm | Một phần | Chưa làm cho thông báo và tìm người dùng |
| A9 Lưu bài, like bình luận, ẩn, báo cáo | Xong | |
| A10 Quyền riêng tư với dữ liệu thật | Xong | Sửa thêm lỗi mobile gửi `ONLY_ME` trong khi backend nhận `PRIVATE` |
| A11 Sao chép liên kết | Xong | Dùng liên kết `mobilesocial://` |
| A12 Phiên 1 ngày | Cách tối thiểu | Token 30 ngày, chưa có refresh token |
| A13 Độ dài bình luận | Xong | 1000 ký tự ở cả hai phía |
| 2.1 Xóa bình luận | Xong | Chủ bài viết cũng xóa được |
| 2.2 Sửa bình luận | Xong | |
| 2.3 Profile người khác | Xong | |
| 2.4 Luồng đăng lại | Xong | Tab "Đăng lại" trên profile, có thông báo |
| 2.5 "Đi ngủ đi" | Xong | |
| 2.6 Sửa hồ sơ | Xong | Đổi username chỉ có ở bước thiết lập lần đầu |
| 2.7 Giới thiệu và thiết lập lần đầu | Xong | Không làm tìm bạn theo danh bạ |
| 2.8 Bạn bè có thể quen | Xong | Chưa có nút ẩn gợi ý |
| 2.9 Cảnh báo trong email | Xong | Chưa gửi thử email thật |
| 2.10 Đăng nhập Google | Chưa làm | Chỉ còn việc cấu hình, không phải code |
| 3.3 Duy trì đăng nhập | Cách tối thiểu | Xem A12 |
| 3.4 Đổi mật khẩu | Xong | |
| 3.5 Xóa tài khoản | Xong | Chưa có trang web yêu cầu xóa (Google Play cần) |
| 3.6 Chặn | Xong | |
| 3.7 Báo cáo | Xong | Chưa có màn hình duyệt báo cáo |
| 3.8 Điều khoản, chính sách | Xong | Nội dung là bản nháp |
| 3.9 Giới hạn tần suất | Xong | |
| 3.10 Tải thêm các danh sách | Một phần | Xem A8 |
| 3.11 Chi tiết bài viết | Xong | |
| 3.12 Thông báo đẩy | Có code, chưa thử | Cần dev build, EAS project id và FCM |
| 3.13 Cài đặt | Xong | Chưa có công tắc bật/tắt thông báo |
| 3.14 Trả lời bình luận | Xong | |
| 3.15 Huy hiệu chưa đọc | Xong | |
| 3.16 Danh sách follower | Xong | |
| 4.1 Lưu bài ở backend | Xong | |
| 4.2 Like bình luận | Xong | |
| 4.3 Người đã like | Xong | Mở từ màn chi tiết bài viết |
| 4.4 Hashtag, nhắc tên | Một phần | Bấm được và có thông báo; chưa có gợi ý khi gõ `@` |
| 4.5 Tìm bài viết | Xong | Chưa lưu từ khóa gần đây |
| 4.6 Liên kết chia sẻ | Xong | |
| 4.7 Ẩn bài viết | Xong | |
| 4.8 Bắt lỗi | Một phần | Có màn báo lỗi; chưa có dịch vụ báo lỗi crash |
| 4.9 Thống nhất ngôn ngữ | Chưa làm | Các màn đăng nhập vẫn tiếng Anh |
| 4.10 Các mục nhỏ khác | Chưa làm | |
| 6 Giao diện Reel | Xong, chạy với video mẫu | Chưa có "vì sao tôi thấy video này" và mở Reels từ một video trong feed; đăng video chỉ chạy ở chế độ mock |

Việc cần làm tay sau khi lấy code: `scripts/qa/e2e.ps1` bước 10 bấm vào vị trí nút Đăng xuất cũ, nay là "Cài đặt".

## Mục lục

- [0. Việc nền phải làm trước](#0-việc-nền-phải-làm-trước)
- [1. Lỗi trong các luồng đang có (P0)](#1-lỗi-trong-các-luồng-đang-có-p0)
- [2. Mười mục trong danh sách của bạn](#2-mười-mục-trong-danh-sách-của-bạn)
- [3. Chức năng nhỏ bắt buộc còn thiếu (P1)](#3-chức-năng-nhỏ-bắt-buộc-còn-thiếu-p1)
- [4. Nên có (P2)](#4-nên-có-p2)
- [5. Chuẩn chung cho mọi màn hình](#5-chuẩn-chung-cho-mọi-màn-hình)
- [6. Giao diện Reel](#6-giao-diện-reel)
- [7. Thứ tự làm đề xuất](#7-thứ-tự-làm-đề-xuất)

---

## 0. Việc nền phải làm trước

### N0. Stack navigator bao ngoài tab

- **Hiện trạng:** `RootNavigator` trả thẳng `MainTabNavigator`; `MainTabParamList` chỉ có 5 tab. Không có cách mở một màn hình đè lên tab.
- **Vì sao phải làm trước:** profile người khác (2.3), chi tiết bài viết (3.11), danh sách follower (3.16), cài đặt (3.13), onboarding (2.7) đều cần chỗ để "push" màn hình.
- **MB cần làm:**
  - Thêm `MainStackNavigator` bằng `@react-navigation/native-stack` (đã cài, `AuthNavigator` đang dùng). Màn đầu là `Tabs` (chính là `MainTabNavigator` hiện tại).
  - Khai báo `MainStackParamList`: `Tabs`, `UserProfile { userId }`, `PostDetail { postId, commentId? }`, `FollowList { userId, type: 'followers' | 'following' }`, `Settings`, `ChangePassword`, `BlockedUsers`, `Legal { doc: 'terms' | 'privacy' }`.
  - `ProfileScreen` hiện gắn với `BottomTabScreenProps` và lấy user từ session. Tách phần hiển thị thành `ProfileView({ userId })` dùng chung cho tab Profile (chính mình) và `UserProfile`.
- **Lưu ý:** tab bar không đổi vị trí nên `scripts/qa/e2e.ps1` (bấm theo tọa độ) không bị ảnh hưởng. Chạy lại `verify-ui.mjs` và Jest sau khi đổi.
- **Xong khi:** từ bất kỳ tab nào gọi `navigation.navigate('UserProfile', { userId })` mở được màn mới, nút back quay về đúng tab cũ.

---

## 1. Lỗi trong các luồng đang có (P0)

Các mục này không phải tính năng mới. Chúng là luồng đã có giao diện nhưng sẽ hỏng hoặc chạy giả khi tắt mock (`EXPO_PUBLIC_USE_MOCK` khác `true`).

### A1. Đăng ký xong không đăng nhập được

- **Hiện trạng:**
  - BE: `login` từ chối tài khoản chưa xác thực email (`"Please verify your email before logging in"`, 401). Có sẵn `POST /auth/verify-email { email, otp }` và `POST /auth/resend-verification { email }`.
  - MB: `RegisterScreen` đăng ký xong chuyển về `Login` với câu "Account created. Sign in with your email and password." `authService` không gọi `verify-email` hay `resend-verification`. Không có màn nhập mã xác thực email.
- **Hậu quả:** người đăng ký bằng email không bao giờ vào được app.
- **MB cần làm:**
  - Sau đăng ký → màn nhập mã 6 số (dùng lại `VerifyCodeScreen`, thêm tham số `mode: 'verifyEmail' | 'resetPassword'`).
  - Gọi `auth/verify-email`; thành công → về `Login` (điền sẵn email) hoặc đăng nhập luôn nếu BE trả token.
  - Nút gửi lại gọi `auth/resend-verification`, đếm ngược như hiện có.
  - Khi đăng nhập gặp lỗi "chưa xác thực" → chuyển sang màn nhập mã với email vừa nhập, tự gửi lại mã.
- **BE nên sửa:** lỗi chưa xác thực đang dùng chung mã 401 với sai mật khẩu. Thêm trường `code: 'EMAIL_NOT_VERIFIED'` để mobile không phải so chuỗi thông báo.
- **Giới hạn BE đang áp (mobile phải hiển thị đúng):** mã hết hạn sau 5 phút; sai quá 5 lần thì mã bị khóa; tối đa 3 lần gửi mỗi giờ (trả 429).
- **Xong khi:** đăng ký tài khoản mới bằng email thật → nhận mã → nhập → đăng nhập được. Nhập sai mã, mã hết hạn, gửi quá 3 lần đều có thông báo riêng.

### A2. Quên mật khẩu đang chạy giả và gọi sai endpoint

- **Hiện trạng:**
  - MB: `passwordResetService.ts` có `export const USE_MOCK = true` viết cứng (không theo `USE_MOCK_API`), mã giả `123456`. Nhánh thật gọi `auth/verify-reset-code` — endpoint này **không tồn tại**. `VerifyCodeScreen` không có ô nhập mật khẩu mới; xác thực xong quay về `Login`.
  - BE: có `POST /auth/forgot-password { email }` và `POST /auth/reset-password { email, otp, newPassword }` (mật khẩu mới tối thiểu 8 ký tự). Không có bước xác thực mã riêng.
- **MB cần làm:**
  - Đổi cờ sang `USE_MOCK_API`.
  - Luồng 3 bước: nhập email → nhập mã + mật khẩu mới + nhập lại → về `Login` kèm thông báo thành công.
  - Gọi `auth/reset-password` một lần với cả ba trường. Bỏ lời gọi `verify-reset-code`.
  - Kiểm tra phía client: mật khẩu ≥ 8 ký tự (BE cho tối đa 72 ở đăng ký), hai ô khớp nhau, có nút hiện/ẩn.
- **Lưu ý:** BE luôn trả cùng một câu ("If the account is eligible…") dù email có tồn tại hay không. Mobile giữ nguyên hành vi đó, không báo "email không tồn tại".
- **Xong khi:** đổi được mật khẩu bằng mã trong email thật và đăng nhập bằng mật khẩu mới; mật khẩu cũ không còn dùng được.

### A3. Feed lỗi khi có bài đăng lại

- **Hiện trạng:**
  - BE: `GET /posts/feed` trả lẫn hai loại item. Loại `type: 'POST'` có `author`, `content`, `media` ở cấp ngoài. Loại `type: 'REPOST'` có dạng `{ id, createdAt, repostedBy, originalPost: { available, id, content, author, media, … } }`.
  - MB: `mapApiPost` trong `postMapper.ts` không đọc `type`, gọi thẳng `post.media.map(...)`. Với item `REPOST`, `media` là `undefined` nên ném lỗi và cả feed không tải được.
- **MB cần làm:** xem mục 2.4. Tối thiểu để hết lỗi: mapper phân nhánh theo `type`, bỏ qua item không hiểu thay vì ném lỗi.
- **Xong khi:** tài khoản A đăng lại một bài, tài khoản B (follow A) mở feed không lỗi.

### A4. Nút "Chia sẻ lên bảng tin" không gọi API

- **Hiện trạng:** `SharePostModal.handleRepost` chỉ hiện `Alert` "Đã chia sẻ…" rồi gọi `onRepostSuccess`. Không có lời gọi nào tới `POST /posts/:id/repost` trong toàn bộ mobile.
- **MB cần làm:** xem mục 2.4.

### A5. Lộ bài riêng tư qua trang cá nhân (BE)

- **Hiện trạng:** `UsersService.findUserPosts` lọc bằng `{ authorId, deletedAt: null }`, **không** lọc `privacy`. Gọi `GET /users/:id/posts` với id người khác sẽ trả cả bài `PRIVATE` và `FRIENDS`. Tham số `viewerUserId` có truyền vào nhưng không dùng để lọc quyền.
- **Vì sao chưa ai thấy:** mobile hiện chỉ mở profile của chính mình. Khi làm mục 2.3 thì lỗi này lộ ra ngay.
- **BE cần làm:** áp cùng điều kiện với `PostsService.getFeed`: `PUBLIC`, hoặc chính chủ, hoặc `FRIENDS` khi hai bên follow nhau. Đếm `postsCount` trong `findProfile` cũng nên theo quyền của người xem.
- **Xong khi:** có test: B xem profile A chỉ thấy bài `PUBLIC`; B và A follow nhau thì thấy thêm `FRIENDS`; không bao giờ thấy `PRIVATE`.

### A6. Sửa hồ sơ báo lỗi 501

- **Hiện trạng:** `profileService.updateProfile` ở chế độ thật ném `ApiError` 501 "Máy chủ chưa hỗ trợ cập nhật hồ sơ." `UsersController` chỉ có ba route GET.
- **Cần làm:** xem mục 2.6.

### A7. Bấm vào thông báo không đi đâu

- **Hiện trạng:** `NotificationsScreen.handlePressItem` chỉ đánh dấu đã đọc.
- **Cần làm:** xem mục 3.11.

### A8. Các danh sách chỉ tải trang đầu

- **Hiện trạng:**
  - Feed: `HomeScreen` chỉ gọi `feedService.getFeed(1)`, không có `onEndReached`.
  - Bài trên profile: `profileService.getUserPosts(user)` không truyền `page`.
  - Bình luận: viết cứng `page=1&limit=50`.
  - Thông báo và tìm kiếm: viết cứng `page=1`.
- **Cần làm:** xem mục 2.5 (feed) và 3.10 (các danh sách còn lại).

### A9. Bốn hành động chỉ lưu tạm trong bộ nhớ

- **Hiện trạng:** lưu bài (`setPostSavedLocally`), like bình luận (`locallyLikedCommentIds`), "Ẩn bài viết", "Báo cáo bài viết" đều không có backend. Tắt app là mất.
- **Cần làm:** báo cáo → mục 3.7. Lưu bài, like bình luận, ẩn bài → mục 4.

### A10. Quyền riêng tư của bài không hiển thị với dữ liệu thật

- **Hiện trạng:** item trong `GET /posts/feed` không có trường `privacy`; `ApiPost` và `mapApiPost` cũng không có. Huy hiệu quyền riêng tư trên `PostCard` và giá trị ban đầu của `PostPrivacyModal` vì thế chỉ đúng ở chế độ mock.
- **BE:** trả `privacy` trong feed, chi tiết bài và bài trên profile.
- **MB:** thêm `privacy` vào `ApiPost` và mapper.

### A11. "Sao chép liên kết" không sao chép

- **Hiện trạng:** `SharePostModal.handleCopyLink` chỉ hiện `Alert`, không ghi vào clipboard. Liên kết dùng tên miền `https://mobilesocial.app/p/{id}` (cần kiểm tra tên miền này có thật không).
- **Cần làm:** xem mục 4.6.

### A12. Phiên đăng nhập hết hạn sau 1 ngày

- **Hiện trạng:** `auth.module.ts` đặt `expiresIn: "1d"`, không có refresh token. `httpClient` gặp 401 thì xóa token và đưa về màn đăng nhập.
- **Cần làm:** xem mục 3.3.

### A13. Giới hạn độ dài bình luận lệch nhau

- **Hiện trạng:** ô nhập ở `CommentModal` giới hạn 500 ký tự; `CreateCommentDto` cho 1000.
- **Cần làm:** chọn một số và dùng chung cho cả tạo lẫn sửa bình luận (mục 2.2).

---

## 2. Mười mục trong danh sách của bạn

### 2.1. Xóa bình luận (giao diện + backend, có pop-up)

- **Hiện trạng:**
  - BE: có `DELETE /comments/:id`. Chỉ chủ bình luận được xóa (người khác nhận 403). Xóa cứng; các trả lời con và thông báo liên quan bị xóa theo (cascade trong schema). Trả `{ data: { deleted: true } }`.
  - MB: `CommentItem` không có nhấn giữ hay menu; `commentService` chưa có hàm xóa.
- **BE cần bổ sung:**
  - Cho chủ bài viết xóa bình luận trên bài của mình (hành vi chuẩn của các MXH).
  - Trả về `commentsCount` mới của bài. Xóa một bình luận cha có 3 trả lời làm bộ đếm giảm 4; mobile không tự tính được.
- **MB cần làm:**
  - `commentService.deleteComment(commentId)`, có nhánh mock.
  - Nhấn giữ `CommentItem` (hoặc nút "…") mở bảng lựa chọn. Chủ bình luận thấy "Sửa", "Xóa"; chủ bài viết thấy "Xóa"; người khác thấy "Báo cáo".
  - Pop-up xác nhận kiểu clay. `DeletePostModal` đã có sẵn giao diện này: tách thành `ConfirmModal` dùng chung (tiêu đề, mô tả, nhãn nút, màu nguy hiểm) rồi dùng cho cả xóa bài, xóa bình luận, đăng xuất, chặn.
  - Xóa lạc quan: gỡ khỏi danh sách ngay, lỗi thì trả lại và báo.
  - Phát sự kiện `feedEvents.commentDeleted { postId, commentsCount }` để `PostCard` ở Home và Profile cập nhật số (đã có mẫu `commentAdded`).
  - Pop-up thông báo kết quả: hiện app dùng `Alert.alert`. Nếu muốn pop-up đồng bộ giao diện thì làm một `ClayToast` dùng chung (tự ẩn sau 2–3 giây).
- **Trường hợp biên:**
  - 404 (bình luận đã bị xóa từ máy khác) → coi như thành công.
  - 403 → trả bình luận lại, báo "Bạn không có quyền xóa".
  - Đang gửi yêu cầu xóa thì khóa nút để không gửi hai lần.
  - Bình luận đang gửi dở (bản lạc quan chưa có id thật) → chưa cho xóa.
- **Xong khi:** xóa bình luận của mình → biến mất, số bình luận trên thẻ bài giảm đúng (kể cả khi có trả lời con), mở lại modal không còn. Tài khoản khác không thấy nút xóa.

### 2.2. Sửa nội dung bình luận

- **Hiện trạng:** BE chưa có route; MB chưa có giao diện. Bảng `Comment` đã có `updatedAt`.
- **BE cần làm:**
  - `PATCH /comments/:id` với `{ content }`, cùng quy tắc kiểm tra với tạo bình luận (không rỗng sau khi cắt khoảng trắng, cùng giới hạn độ dài — xem A13).
  - Chỉ chủ bình luận được sửa (403). Bình luận không tồn tại → 404.
  - Trả bình luận đã cập nhật, gồm `updatedAt`.
  - Thêm cột `editedAt DateTime?` để biết đã sửa hay chưa. So sánh `updatedAt` với `createdAt` không đáng tin vì hai giá trị lệch nhau vài mili giây ngay lúc tạo.
- **MB cần làm:**
  - `commentService.updateComment(commentId, content)`, có nhánh mock.
  - Chọn "Sửa" → ô nhập của `CommentModal` chuyển sang chế độ sửa: điền sẵn nội dung, hiện dải "Đang sửa bình luận" kèm nút hủy, nút gửi đổi thành "Lưu".
  - Nút Lưu tắt khi nội dung rỗng hoặc không đổi.
  - Cập nhật lạc quan, lỗi thì trả nội dung cũ.
  - Hiện nhãn "đã chỉnh sửa" cạnh thời gian.
- **Trường hợp biên:** đang sửa mà đóng modal → hỏi bỏ thay đổi; đang sửa thì không cho trả lời hoặc sửa bình luận khác cùng lúc.
- **Xong khi:** sửa xong hiện nội dung mới và nhãn "đã chỉnh sửa" trên cả hai máy.

### 2.3. Bấm vào profile người khác

- **Phụ thuộc:** N0, A5.
- **Hiện trạng:**
  - MB: không có điểm nào bấm vào người dùng. `PostCard` (avatar, tên), `CommentItem`, `UserSearchCard`, `NotificationItem` đều không điều hướng.
  - BE: `GET /users/:id` trả `id, username, displayName, avatarUrl, bio, createdAt, postsCount` và các số follow (mobile đang hiển thị `followersCount`, `followingCount`). Không có cờ quan hệ.
- **BE cần bổ sung vào `GET /users/:id`:** `isFollowing` (tôi follow họ), `followsYou` (họ follow tôi), sau này thêm `isBlocked` (mục 3.6). Sửa A5.
- **MB cần làm:**
  - Màn `UserProfile` dùng `ProfileView({ userId })`.
  - Phần đầu: thay "Sửa hồ sơ" và "Đăng xuất" bằng nút "Theo dõi" / "Đang theo dõi" (dùng `followApi` đã có, cập nhật lạc quan); hiện nhãn "Theo dõi bạn" nếu `followsYou`; nút "…" mở: Chặn, Báo cáo, Sao chép liên kết.
  - Điểm vào (làm đủ): avatar và tên trong `PostCard`; avatar và tên trong `CommentItem`; cả thẻ `UserSearchCard`; avatar trong `NotificationItem`; từng dòng trong danh sách follower/following; tên người đăng lại; `@username` trong nội dung (khi có mục 4.4).
  - Bấm vào chính mình → chuyển sang tab Profile, không mở màn mới.
  - Mở profile từ trong `CommentModal` → đóng modal trước rồi mới điều hướng.
  - Đồng bộ: follow ở đây phải cập nhật trạng thái ở `SearchScreen` và các danh sách đang mở. Thêm sự kiện `followChanged { userId, isFollowing }` theo mẫu `feedEvents`.
- **Trạng thái cần có:** khung chờ khi tải; 404 → "Người dùng không tồn tại"; lỗi mạng kèm nút thử lại; chưa có bài → trạng thái rỗng riêng (không dùng lời mời "tạo bài đầu tiên" của profile mình); kéo để làm mới.
- **Xong khi:** từ mỗi điểm vào ở trên đều mở đúng profile; follow/unfollow đổi số người theo dõi ngay; quay lại màn trước thì trạng thái follow ở đó cũng đã đổi.

### 2.4. Luồng đăng lại (hiện trên profile)

- **Hiện trạng:**
  - BE: có `POST /posts/:id/repost` và `DELETE /posts/:id/repost`; mỗi người chỉ đăng lại một bài một lần (ràng buộc unique); chỉ đăng lại được bài `PUBLIC`, hoặc `FRIENDS` khi hai bên follow nhau. Feed trả item `REPOST` (xem A3). `GET /users/:id/posts` không trả bài đăng lại. Không có thông báo loại `REPOST` (hiện chỉ có `LIKE`, `COMMENT`, `FOLLOW`).
  - MB: xem A3 và A4.
- **BE cần bổ sung:**
  - `GET /users/:id/reposts?page=&limit=` trả cùng dạng item `REPOST` như feed. Tách riêng thay vì trộn vào `/users/:id/posts` để phân trang đơn giản và làm được tab riêng.
  - Trên mỗi bài (feed, chi tiết, profile): thêm `isReposted` và `repostsCount`.
  - Thông báo `REPOST` cho tác giả bài gốc (không gửi khi tự đăng lại bài của mình).
  - Quyết định và ghi rõ: có cho đăng lại bài của chính mình không.
- **MB cần làm:**
  - Kiểu dữ liệu: `FeedItem = PostItem | RepostItem`; mapper phân nhánh theo `type`.
  - `PostCard`: thêm dải "🔁 {tên} đã đăng lại" phía trên bài gốc; bấm tên → profile người đăng lại.
  - `originalPost.available === false` → thẻ xám "Bài viết không còn khả dụng", không có nút tương tác.
  - Nút đăng lại: gọi API thật, cập nhật lạc quan, đổi trạng thái thành "Đã đăng lại"; bấm lần nữa → hỏi "Hủy đăng lại?" rồi gọi `DELETE`. 409 (đã đăng lại) → coi như thành công.
  - Profile: thêm hai tab "Bài viết" và "Đăng lại" (cả profile mình lẫn người khác).
  - `keyExtractor` dùng id của bản đăng lại, không dùng id bài gốc. Một bài có thể xuất hiện hai lần trong feed (bản gốc và bản đăng lại) và sẽ trùng key.
  - Like hoặc bình luận trên thẻ đăng lại là tác động vào bài gốc; hai thẻ cùng bài phải đổi số đồng thời.
  - Hủy đăng lại ngay trên profile → gỡ thẻ khỏi tab "Đăng lại".
- **Xong khi:** A đăng lại bài của C → bài hiện ở feed của B (follow A) với dải "A đã đăng lại" và hiện ở tab "Đăng lại" trên profile A; C nhận thông báo; A hủy → biến mất ở cả hai nơi; C xóa bài gốc → thẻ đăng lại hiện "không còn khả dụng".

### 2.5. Cuộn hết feed thì hiện "Bạn đã lướt quá nhiều rồi, đi ngủ đi"

- **Hiện trạng:** xem A8. `mapApiPostList` đã tính sẵn `meta.hasMore`.
- **MB cần làm:**
  - State: `page`, `hasMore`, `isLoadingMore`, `loadMoreError`.
  - `onEndReached` với `onEndReachedThreshold={0.5}`; bỏ qua khi đang tải, đang làm mới hoặc hết dữ liệu.
  - `ListFooterComponent` có bốn trạng thái: đang tải thêm (vòng quay); lỗi tải thêm (nút "Thử lại", giữ nguyên danh sách); hết bài (thẻ clay + emoji + dòng chữ của bạn); chưa có gì để hiện (ẩn).
  - Chỉ hiện dòng "đi ngủ đi" khi `!hasMore` **và** đã có ít nhất một bài. Feed rỗng vẫn dùng `FeedEmptyState`.
  - Nối trang có khử trùng theo id. Trong lúc đang cuộn có người đăng bài mới thì các trang bị lệch và một bài có thể lặp lại.
  - Kéo để làm mới → về `page = 1`, xóa lỗi, tính lại `hasMore`.
- **Tùy chọn:** đổi câu theo giờ (sau 23 giờ: "đi ngủ đi"; ban ngày: "Bạn đã xem hết rồi").
- **Lưu ý BE:** `getFeed` phân trang bằng cách lấy `skip + limit` bản ghi của cả bài viết lẫn bài đăng lại rồi cắt, nên trang càng sâu càng chậm. Chấp nhận được ở quy mô hiện tại; về sau nên chuyển sang phân trang theo con trỏ thời gian.
- **Xong khi:** với hơn 30 bài, cuộn tải dần từng trang, không có bài lặp, cuối cùng hiện dòng chữ đúng một lần; tắt mạng giữa chừng hiện nút thử lại và bấm được.

### 2.6. Chỉnh sửa profile

- **Hiện trạng:** xem A6. `EditProfileModal` chỉ có tên hiển thị (tối đa 50) và tiểu sử (tối đa 160), chưa đổi được ảnh đại diện.
- **BE cần làm:**
  - `PATCH /users/me` nhận JSON `{ displayName?, bio?, username? }`. Kiểm tra: tên hiển thị 1–50 ký tự sau khi cắt khoảng trắng; tiểu sử ≤ 160; username theo đúng quy tắc của `RegisterDto` (3–30 ký tự, chỉ chữ, số, dấu chấm, gạch dưới), trùng → 409. Trả về đúng dạng của `GET /users/me`.
  - `POST /users/me/avatar` nhận multipart, trường `avatar`. Dùng lại multer và `StorageService.upload` như ảnh bài viết, cùng giới hạn loại và dung lượng. Lưu xong thì xóa ảnh cũ trên storage.
  - `DELETE /users/me/avatar` để gỡ ảnh.
- **MB cần làm:**
  - Nối `profileService.updateProfile` vào API; giữ nhánh mock.
  - `EditProfileModal` thêm đổi ảnh: bấm avatar → chọn từ thư viện bằng `expo-image-picker` (đã cài) với `allowsEditing: true, aspect: [1, 1]`; xem trước; có lựa chọn "Gỡ ảnh".
  - Tải ảnh theo cách `postService.toUploadPart` đang làm (đọc qua `File` của `expo-file-system`). Kiểu `{ uri, name, type }` cũ không chạy trên Expo SDK 57.
  - Tùy chọn: cho đổi username, hiện lỗi 409 ngay dưới ô nhập.
  - Sau khi lưu phải cập nhật ba nơi: `profile` trên màn hình; `user` trong `AuthSession` (cần thêm hàm `updateUser`, nếu không avatar ở các nơi khác vẫn là ảnh cũ); tác giả trong các bài đang hiển thị (sự kiện `profileUpdated`).
- **Trường hợp biên:** tải ảnh thành công nhưng lưu chữ thất bại (hoặc ngược lại) → báo rõ phần nào chưa lưu; đang lưu thì khóa nút và không cho đóng modal; chưa đổi gì thì nút Lưu tắt.
- **Xong khi:** đổi tên, tiểu sử, ảnh → thấy ngay trên profile, trên các bài cũ trong feed, và trên máy của người khác sau khi làm mới.

### 2.7. Trang giới thiệu và thiết lập lần đầu

Đây là hai phần riêng.

**a) Giới thiệu sản phẩm (trước khi đăng nhập)**
- 3–4 trang vuốt ngang: ảnh/emoji clay, tiêu đề, một câu mô tả; chấm chỉ trang; nút "Bỏ qua" ở mọi trang, "Bắt đầu" ở trang cuối.
- Chỉ hiện lần đầu mở app. Lưu cờ `hasSeenIntro` bằng `expo-secure-store` (đã cài) để khỏi thêm thư viện lưu trữ.
- Vị trí: màn đầu của `AuthNavigator` khi cờ chưa bật.

**b) Thiết lập sau lần đăng nhập đầu tiên**
- **Phụ thuộc:** 2.6 (ảnh và tên), 2.8 (gợi ý theo dõi).
- Các bước, bước nào cũng có "Bỏ qua":
  1. Ảnh đại diện và tên hiển thị. Tài khoản Google có username tự sinh nên cho đổi username ở đây.
  2. Tiểu sử.
  3. Gợi ý theo dõi: danh sách từ 2.8, nút Theo dõi từng người, nút "Theo dõi tất cả".
  4. Màn chào và nút "Vào bảng tin".
- **BE cần làm:** thêm `User.onboardedAt DateTime?`, trả trong `GET /users/me`; `POST /users/me/onboarding/complete` đặt giá trị.
  - Cách thay thế không cần BE: lưu cờ cục bộ theo `userId`. Nhược điểm: cài lại app hoặc đổi máy sẽ bị hỏi lại.
- **MB cần làm:** `RootNavigator` có ba nhánh: chưa đăng nhập → `AuthNavigator`; đã đăng nhập nhưng `onboardedAt` rỗng → `OnboardingNavigator`; còn lại → màn chính.
- **Về "tìm bạn bè quen":** tìm theo danh bạ cần quyền truy cập danh bạ và gửi số điện thoại hoặc email của người khác lên server. App không lưu số điện thoại nên chỉ khớp được email, và việc này kéo theo nghĩa vụ về quyền riêng tư. Nên bỏ, thay bằng gợi ý 2.8 và một ô tìm theo tên.
- **Xong khi:** tài khoản mới đi hết các bước và vào feed đã có bài của người vừa follow; thoát giữa chừng rồi mở lại vẫn quay về đúng luồng thiết lập; tài khoản cũ không bị hỏi.

### 2.8. Bạn bè có thể quen

- **Hiện trạng:** chưa có ở cả hai phía.
- **BE cần làm:** `GET /users/suggestions?limit=20`. Thứ tự nguồn:
  1. Người đang follow tôi mà tôi chưa follow lại.
  2. Bạn của bạn: người được những người tôi follow theo dõi, tôi chưa follow; xếp theo số người chung giảm dần.
  3. Dự phòng cho tài khoản mới chưa follow ai: tài khoản có nhiều người theo dõi nhất.
  - Luôn loại: chính tôi, người tôi đã follow, người bị chặn hoặc chặn tôi (mục 3.6).
  - Mỗi item: `id, username, displayName, avatarUrl, mutualCount, mutualPreview` (tối đa 2 người, để hiện "Được A, B và 3 người khác theo dõi"), `reason: 'FOLLOWS_YOU' | 'MUTUAL' | 'POPULAR'`.
  - Tùy chọn: `POST /users/suggestions/:id/dismiss` để ẩn một gợi ý.
- **MB cần làm:**
  - Thành phần `SuggestedUsers` dùng chung: thẻ ngang có avatar, tên, dòng lý do, nút Theo dõi, nút "×".
  - Vị trí: `SearchScreen` khi ô tìm trống (hiện chỉ có trạng thái rỗng); bước 3 của thiết lập (2.7); tùy chọn chèn một dải vào feed sau bài thứ 5.
  - Follow xong thì đổi nút thành "Đang theo dõi", không gỡ thẻ ngay để người dùng còn hoàn tác được.
- **Xong khi:** A follow B và C; B và C cùng follow D → A thấy D với dòng "Được B và C theo dõi"; A follow D rồi làm mới thì D không còn trong gợi ý.

### 2.9. Email chứa mã: thêm dòng "đừng gửi mã này cho ai"

- **Hiện trạng:** `mail.service.ts` có hai mẫu (xác thực email, đặt lại mật khẩu), viết bằng tiếng Anh, chỉ có câu "If you did not…, ignore this email". Tiêu đề thư không chứa mã (đúng).
- **BE cần làm:** thêm vào **cả bản text và bản HTML** của **cả hai** mẫu:
  > Không chia sẻ mã này với bất kỳ ai. MobileSocialMedia không bao giờ yêu cầu bạn cung cấp mã qua điện thoại, tin nhắn hay email.
- **Nên làm cùng lúc:** chọn một ngôn ngữ cho toàn bộ thư; thêm dòng "Mã hết hạn sau 5 phút" (đã có) ngay dưới mã; in mã cỡ lớn, giãn chữ.
- **Xong khi:** nhận cả hai loại thư trên Gmail thật, dòng cảnh báo hiện ở cả chế độ HTML lẫn văn bản thuần.

### 2.10. Đăng nhập bằng Google

- **Hiện trạng: code đã có đủ.** BE có `POST /auth/google`, `GoogleVerifierService`, biến `GOOGLE_WEB_CLIENT_ID`. MB có `googleSignIn.ts`, `GoogleButton`, `signInWithGoogle` trong session, plugin `@react-native-google-signin/google-signin` trong `app.json`; đăng xuất đã gọi `googleSignIn.signOut()`.
- **Vì sao bạn chưa thấy:** nút chỉ hiện khi `isGoogleSignInAvailable()` đúng, tức là không ở chế độ mock **và** có `EXPO_PUBLIC_GOOGLE_WEB_CLIENT_ID`. Thiếu một trong hai thì nút bị ẩn.
- **Việc còn lại (cấu hình, không phải code):**
  1. Google Cloud Console: tạo OAuth client loại **Web** (id này dùng cho cả `EXPO_PUBLIC_GOOGLE_WEB_CLIENT_ID` ở mobile lẫn `GOOGLE_WEB_CLIENT_ID` ở backend) và một client loại **Android** với package `com.mobilesocial.app` và SHA-1 của keystore dùng để build.
  2. Điền biến vào `apps/mobile/.env.local` và `apps/api/.env`, khởi động lại Expo.
  3. Chạy bằng **dev build**, không phải Expo Go: thư viện Google Sign-In là mã native. `expo-dev-client` đã cài sẵn.
  4. Thử trên máy có Google Play Services (máy thật hoặc BlueStacks đã đăng nhập Google).
- **Cần kiểm tra khi chạy được:** hủy giữa chừng không hiện lỗi; máy không có Play Services báo rõ; đăng xuất rồi đăng nhập lại được chọn tài khoản khác; tài khoản Google mới đi vào luồng thiết lập (2.7); email Google trùng với tài khoản email đã có thì được liên kết (BE có `linkGoogle`).

---

## 3. Chức năng nhỏ bắt buộc còn thiếu (P1)

### 3.1. Xác thực email sau đăng ký
Xem A1.

### 3.2. Quên mật khẩu chạy thật
Xem A2.

### 3.3. Duy trì đăng nhập

- **Hiện trạng:** xem A12.
- **Cách tối thiểu (một dòng):** tăng `expiresIn` trong `auth.module.ts` lên `30d`. Kém an toàn hơn (token lộ thì dùng được 30 ngày) nhưng hết cảnh bị đăng xuất mỗi ngày. Đủ cho bản thử nghiệm.
- **Cách đầy đủ:**
  - BE: access token 15 phút + refresh token 30 ngày, lưu **băm** của refresh token trong bảng mới (`userId, tokenHash, expiresAt, revokedAt`). `POST /auth/refresh` đổi refresh cũ lấy cặp mới (xoay vòng); dùng lại refresh đã thu hồi thì thu hồi toàn bộ phiên của người đó. `login` và `google` trả thêm `refreshToken`; `logout` thu hồi.
  - MB: lưu refresh token trong SecureStore. Trong `httpClient`, khi gặp 401: gọi refresh **một lần** (nhiều request cùng 401 phải chờ chung một lần refresh), thành công thì gửi lại request cũ; thất bại mới gọi `unauthorizedHandler` như hiện tại. Socket.IO kết nối lại bằng token mới.
- **Xong khi:** để app qua đêm, mở lại vẫn ở trong; đổi mật khẩu trên máy khác thì máy này bị đăng xuất ở lần refresh kế tiếp.

### 3.4. Đổi mật khẩu khi đang đăng nhập

- **BE:** `PATCH /auth/password { currentPassword, newPassword }`; sai mật khẩu cũ → 401; mật khẩu mới theo quy tắc đăng ký (8–72 ký tự), khác mật khẩu cũ. Tài khoản chỉ có Google (`passwordHash` rỗng) → cho đặt mật khẩu mà không cần mật khẩu cũ, hoặc trả lỗi rõ ràng.
- **MB:** màn `ChangePassword` trong Cài đặt: ba ô (cũ, mới, nhập lại), nút hiện/ẩn, kiểm tra phía client; thành công → thông báo và quay lại. Ẩn hoặc đổi nhãn mục này với tài khoản Google.

### 3.5. Xóa tài khoản

- **Vì sao bắt buộc:** cả App Store và Google Play yêu cầu app cho tạo tài khoản thì phải cho xóa tài khoản ngay trong app. Google Play còn yêu cầu một đường dẫn web để gửi yêu cầu xóa.
- **BE:** `DELETE /users/me` với `{ password }` (tài khoản Google: xác nhận bằng cách gõ lại username). Schema đã đặt `onDelete: Cascade` cho bài viết, like, bình luận, follow, thông báo, token, bài đăng lại, nên xóa bản ghi `User` là đủ ở tầng database. **Phải tự xóa file** trên Supabase Storage (ảnh bài viết, ảnh đại diện): lấy danh sách đường dẫn trước khi xóa.
- **MB:** Cài đặt → "Xóa tài khoản" (chữ đỏ, cuối trang) → màn cảnh báo nêu rõ những gì sẽ mất và không khôi phục được → nhập mật khẩu → `ConfirmModal` → gọi API → xóa session, về màn đăng nhập.
- **Xong khi:** xóa xong không đăng nhập lại được; bài và bình luận của người đó biến mất khỏi feed của người khác; file trên storage đã bị xóa.

### 3.6. Chặn người dùng

- **Vì sao bắt buộc:** yêu cầu của hai store với app có nội dung do người dùng đăng.
- **BE:**
  - Bảng `Block(blockerId, blockedId, createdAt)`, khóa chính kép.
  - `POST /users/:id/block`, `DELETE /users/:id/block`, `GET /users/me/blocked`.
  - Khi chặn: hủy follow cả hai chiều.
  - Áp vào mọi truy vấn, theo cả hai chiều: feed, bài trên profile, bình luận, tìm kiếm, gợi ý, thông báo, danh sách follower. Không cho follow, like, bình luận, đăng lại giữa hai người.
  - `GET /users/:id` của người đã chặn mình → 404.
- **MB:** mục "Chặn" trong menu "…" của `UserProfile` và trong `PostOptionsModal`; `ConfirmModal` giải thích hậu quả; sau khi chặn gỡ ngay bài của người đó khỏi các danh sách đang mở; màn `BlockedUsers` trong Cài đặt có nút "Bỏ chặn".

### 3.7. Báo cáo nội dung

- **Hiện trạng:** `PostOptionsModal` đã có mục "Báo cáo bài viết" (`onReport`) nhưng không có backend.
- **BE:** bảng `Report(id, reporterId, targetType: POST | COMMENT | USER, targetId, reason, note?, status, createdAt)`, unique theo `(reporterId, targetType, targetId)`. `POST /reports`; báo cáo trùng → trả thành công, không tạo thêm. Chưa cần trang quản trị: xem bằng Prisma Studio hoặc SQL. Tùy chọn: tự ẩn nội dung khi đủ N báo cáo từ N người khác nhau.
- **MB:** bảng chọn lý do (Spam, Quấy rối, Nội dung nhạy cảm, Thông tin sai lệch, Khác + ô ghi chú); dùng cho bài viết, bình luận (menu ở 2.1) và người dùng (menu ở 2.3). Gửi xong: thông báo "Cảm ơn bạn đã báo cáo", ẩn nội dung đó ở phía mình.

### 3.8. Điều khoản sử dụng và chính sách quyền riêng tư

- **Nội dung tối thiểu của chính sách:** thu thập gì (email, ảnh, nội dung đăng, và lịch sử xem khi có Reel), dùng để làm gì, lưu ở đâu, cách yêu cầu xóa, liên hệ.
- **MB:** dòng "Bằng việc đăng ký, bạn đồng ý với Điều khoản và Chính sách quyền riêng tư" ở `RegisterScreen`, hai cụm từ bấm được; mục tương ứng trong Cài đặt. Hiển thị bằng một màn `Legal` có `ScrollView` và nội dung tĩnh (không cần thêm thư viện), hoặc mở trang web bằng `Linking.openURL`.
- **Ngoài app:** cả hai store yêu cầu đường dẫn chính sách quyền riêng tư công khai khi đăng app.

### 3.9. Giới hạn tần suất ở API

- **Hiện trạng:** chỉ có giới hạn riêng cho việc gửi mã (3 lần mỗi giờ mỗi người dùng) và số lần nhập sai mã (5). Đăng nhập, đăng ký và mọi endpoint khác không có giới hạn.
- **BE:** thêm `@nestjs/throttler` (thư viện mới, cần duyệt theo RULE.md). Gợi ý: mặc định 100 yêu cầu/phút/IP; đăng nhập 5/phút; đăng ký 3/giờ/IP; quên mật khẩu 3/giờ/IP; tạo bài 10/phút; bình luận 20/phút; follow 30/phút.
- **MB:** xử lý 429 thành thông báo "Bạn thao tác quá nhanh, thử lại sau ít phút" thay vì lỗi máy chủ chung.

### 3.10. Tải thêm cho các danh sách còn lại

Áp cùng mẫu với 2.5 (nên viết một hook `usePaginatedList` dùng chung):
- Bài và bài đăng lại trên profile.
- Bình luận (hiện cứng 50) và trả lời của bình luận.
- Thông báo.
- Kết quả tìm kiếm.
- Danh sách follower/following.

### 3.11. Chi tiết bài viết và điều hướng từ thông báo

- **Phụ thuộc:** N0.
- **Hiện trạng:** BE có `GET /posts/:id` (đã kiểm tra quyền riêng tư). MB không có màn chi tiết; xem A7.
- **MB:**
  - Màn `PostDetail { postId, commentId? }`: `PostCard` đầy đủ, bên dưới là danh sách bình luận (dùng lại phần thân của `CommentModal`), ô nhập cố định ở đáy.
  - Bấm thông báo: `LIKE` → `PostDetail`; `COMMENT` → `PostDetail` cuộn tới bình luận đó; `FOLLOW` → `UserProfile` của người thực hiện; `REPOST` (khi có) → `PostDetail`. Vẫn đánh dấu đã đọc như hiện tại.
  - Bài đã xóa hoặc không còn quyền xem (404/403) → màn "Bài viết không còn tồn tại" có nút quay lại.
  - Đây cũng là đích của liên kết chia sẻ (mục 4.6) và thông báo đẩy (3.12).

### 3.12. Thông báo đẩy khi app đang tắt

- **Hiện trạng:** chỉ có Socket.IO khi app đang mở.
- **BE:** bảng `DeviceToken(userId, token, platform, updatedAt)`; `POST /devices` khi đăng nhập, `DELETE /devices/:token` khi đăng xuất. Ở chỗ đang tạo `Notification` và phát socket, gửi thêm qua Expo Push API. Gỡ token mà Expo báo không còn hợp lệ.
- **MB:** thêm `expo-notifications` (thư viện mới). Xin quyền đúng lúc (sau thiết lập lần đầu, không phải ngay khi mở app); Android 13 trở lên phải xin quyền lúc chạy. Bấm thông báo → mở đúng `PostDetail` hoặc `UserProfile`. Cần dev build và cấu hình FCM; Expo Go trên Android không nhận được thông báo đẩy từ xa.
- **Tùy chọn:** công tắc bật/tắt theo loại trong Cài đặt.

### 3.13. Màn hình Cài đặt

- **Hiện trạng:** nút đăng xuất nằm trong `ProfileHeader` và đăng xuất ngay, không hỏi lại.
- **MB:** màn `Settings`, mở từ biểu tượng bánh răng trên profile của mình. Các nhóm:
  - **Tài khoản:** Sửa hồ sơ (2.6), Đổi mật khẩu (3.4), email đang dùng (chỉ xem).
  - **Quyền riêng tư:** Người đã chặn (3.6).
  - **Thông báo:** bật/tắt thông báo đẩy (3.12).
  - **Giới thiệu:** Điều khoản, Chính sách (3.8), số phiên bản app.
  - **Đăng xuất** (có `ConfirmModal`).
  - **Xóa tài khoản** (3.5), chữ đỏ, cuối trang.

### 3.14. Trả lời bình luận

- **Hiện trạng:** BE có `POST /comments/:id/replies` và `GET /comments/:id/replies`; MB chưa có giao diện.
- **MB:** nút "Trả lời" dưới mỗi bình luận → ô nhập hiện dải "Đang trả lời @tên" kèm nút hủy; dòng "Xem N trả lời" để mở ra, thụt lề một cấp; trả lời một câu trả lời thì vẫn gắn vào bình luận gốc (chỉ hai cấp).
- **BE nên bổ sung:** `repliesCount` trên mỗi bình luận cha; thông báo `REPLY` cho chủ bình luận.

### 3.15. Số thông báo chưa đọc trên tab

- **Hiện trạng:** API thông báo trả `unreadCount`; `NotificationsScreen` có hiện số bên trong màn hình; `ClayTabBar` không có huy hiệu.
- **MB:** đưa `unreadCount` vào một context dùng chung; `ClayTabBar` vẽ chấm đỏ hoặc số trên tab Thông báo; tăng khi nhận sự kiện socket, giảm khi đánh dấu đã đọc; quá 99 hiện "99+".

### 3.16. Danh sách người theo dõi và đang theo dõi

- **Phụ thuộc:** N0.
- **Hiện trạng:** BE có `GET /users/:id/followers` và `/following` (có phân trang), mỗi item chỉ có `id, username, displayName, avatarUrl`. Hai con số trên `ProfileHeader` không bấm được.
- **BE nên bổ sung:** `isFollowing` cho từng item để vẽ đúng nút.
- **MB:** bấm vào con số → màn `FollowList` có hai tab; mỗi dòng có avatar, tên, nút Theo dõi (ẩn với chính mình), bấm dòng → `UserProfile`; tải thêm khi cuộn; trạng thái rỗng.

---

## 4. Nên có (P2)

### 4.1. Lưu bài viết ở backend
- **BE:** bảng `Save(userId, postId, createdAt)`; `POST` và `DELETE /posts/:id/save`; `GET /users/me/saved`; trả `isSaved` trên mỗi bài.
- **MB:** thay `setPostSavedLocally` bằng API; thêm tab hoặc mục "Đã lưu" trên profile của mình.

### 4.2. Like bình luận ở backend
- **BE:** bảng `CommentLike(userId, commentId)`; `POST` và `DELETE /comments/:id/like`; trả `likesCount`, `isLiked` trên mỗi bình luận.
- **MB:** thay `locallyLikedCommentIds` bằng API.

### 4.3. Danh sách người đã like
- **BE:** `GET /posts/:id/likes?page=&limit=`.
- **MB:** bấm vào số like → danh sách người dùng (dùng lại dòng của `FollowList`).

### 4.4. Hashtag và nhắc tên
- **BE:** tách `#tag` và `@username` khi tạo/sửa bài và bình luận; bảng `Hashtag`, `PostHashtag`; `GET /hashtags/:tag/posts`; thông báo `MENTION`.
- **MB:** tô màu và cho bấm trong nội dung; gợi ý tên khi gõ `@`.
- **Liên quan:** hashtag là dữ liệu đầu vào cho phần gợi ý Reel.

### 4.5. Tìm bài viết
- **BE:** `GET /posts/search?q=` (chỉ bài `PUBLIC`).
- **MB:** hai tab "Người dùng" và "Bài viết" trong `SearchScreen`; lưu vài từ khóa gần đây.

### 4.6. Liên kết chia sẻ thật
- **Hiện trạng:** xem A11. `app.json` đã có `scheme: "mobilesocial"`.
- **MB:** thêm `expo-clipboard` (thư viện mới) để sao chép thật; cấu hình `linking` của React Navigation để `mobilesocial://p/:id` mở `PostDetail` và `mobilesocial://u/:username` mở `UserProfile`.
- **Lưu ý:** liên kết `https://` chỉ mở được app khi có tên miền thật và cấu hình App Links. Chưa có tên miền thì dùng scheme riêng.

### 4.7. Ẩn bài viết ở backend
- Mục "Ẩn bài viết" trong `PostOptionsModal` hiện chỉ có tác dụng tạm. Cần bảng `HiddenPost(userId, postId)` và lọc trong feed. Khi làm Reel, đây chính là hành động "Không quan tâm".

### 4.8. Bắt lỗi và báo lỗi
- **MB:** một `ErrorBoundary` ở gốc app, hiện màn "Đã có lỗi" với nút tải lại thay vì màn trắng; dịch vụ báo lỗi (ví dụ Sentry) để biết app của người dùng hỏng ở đâu.
- **BE:** bộ lọc lỗi chung trả về cùng một dạng `{ message, code }`; ghi log lỗi 5xx.

### 4.9. Thống nhất ngôn ngữ
- **Hiện trạng:** các màn đăng nhập, đăng ký, nhập mã dùng tiếng Anh ("Resend code", "Account created…"); phần còn lại dùng tiếng Việt. Thông báo lỗi từ BE là tiếng Anh và đang được hiện thẳng cho người dùng.
- **Cần làm:** chọn một ngôn ngữ cho giao diện. Mobile tự ánh xạ lỗi theo `code` thay vì hiện `message` của BE.

### 4.10. Các mục nhỏ khác
- Xem ảnh toàn màn hình, phóng to bằng hai ngón.
- Tài khoản riêng tư (phải duyệt yêu cầu theo dõi).
- Thông báo cho trả lời bình luận và đăng lại (đã nhắc ở 3.14 và 2.4).
- Xác nhận khi rời màn tạo bài đang viết dở; lưu nháp.
- Gỡ một người khỏi danh sách người theo dõi mình.

---

## 5. Chuẩn chung cho mọi màn hình

Dùng làm danh sách kiểm tra trước khi coi một mục ở trên là xong.

- **Bốn trạng thái dữ liệu:** đang tải (khung chờ, không phải màn trắng), có dữ liệu, rỗng (có lời hướng dẫn), lỗi (có nút thử lại).
- **Mạng:** mất mạng báo riêng, không gộp vào "lỗi máy chủ"; hết thời gian chờ có nút thử lại.
- **Hành động ghi:** cập nhật lạc quan và hoàn tác khi lỗi; khóa nút trong lúc gửi để không gửi hai lần.
- **Danh sách:** kéo để làm mới; tải thêm khi cuộn; khử trùng theo id; `keyExtractor` ổn định.
- **Biểu mẫu:** kiểm tra phía client trùng với quy tắc của BE; lỗi hiện ngay dưới ô; bàn phím không che ô nhập; nút gửi tắt khi chưa hợp lệ.
- **Hành động phá hủy** (xóa, chặn, đăng xuất): luôn qua `ConfirmModal`.
- **Phân quyền giao diện:** chỉ hiện nút mà người dùng được phép bấm; BE vẫn phải kiểm tra lại.
- **Mã lỗi:** 401 → về đăng nhập (đã có); 403 → "không có quyền"; 404 → "không còn tồn tại"; 409 → thông báo theo ngữ cảnh; 429 → "thao tác quá nhanh".
- **Đồng bộ giữa các màn:** thay đổi ở một màn phải phản ánh ở màn khác qua `feedEvents` (đã có `postCreated`, `commentAdded`, `postDeleted`, `postUpdated`).
- **Chế độ mock:** mỗi hàm service mới có nhánh mock để Jest và script QA chạy không cần backend.
- **Trợ năng:** mọi nút chỉ có biểu tượng phải có `accessibilityLabel`; vùng bấm tối thiểu 44×44.
- **Kiểm tra trước khi báo xong:** `tsc --noEmit`, `jest`, `verify-ui.mjs`; ghi `docs/change.md`.

---

## 6. Giao diện Reel

Phần bạn phụ trách. Thiết kế tổng thể đã có ở `docs/reel/REEL_FINAL_SPEC_AND_PLAN.md` mục 7; dưới đây là danh sách chi tiết những gì giao diện phải có.

### 6.1. Thứ cần Dev B cung cấp (để chốt sớm)

| Endpoint (theo bản đặc tả MVP) | Trường tối thiểu giao diện cần |
|---|---|
| `GET /reels/feed?limit=&exclude=` | Mỗi item: `id`, `author { id, username, displayName, avatarUrl, isFollowing }`, `content`, `media[] { id, url, thumbnailUrl, width, height, durationMs }`, `likeCount`, `commentsCount`, `isLiked`, `isSaved`, `reason { code, text }`; kèm `requestId` của cả lô |
| `POST /media/upload-url` | `uploadUrl`, `storageKey`, giới hạn dung lượng và thời lượng |
| `POST /posts/media` | Trả về bài vừa tạo cùng dạng với item ở trên |
| `POST /interactions` | Nhận một lô sự kiện; cần biết tên các trường và các loại sự kiện |
| `POST /posts/:id/not-interested` | Chỉ cần mã trạng thái |

Trong lúc chờ: `reelService` chạy nhánh mock với 5–10 video mẫu ngắn, đủ để làm xong toàn bộ giao diện.

### 6.2. Trình phát

- Mỗi thời điểm chỉ một video phát; video vừa lướt qua dừng và tắt tiếng ngay.
- Tự phát khi video chiếm phần lớn màn hình; tự lặp lại khi hết.
- Hiện ảnh thu nhỏ cho tới khi có khung hình đầu tiên, không để màn đen.
- Vòng quay chỉ hiện khi chờ lâu hơn khoảng 300 ms, để không nhấp nháy.
- Chạm một lần: tạm dừng/tiếp tục, hiện biểu tượng mờ ở giữa.
- Chạm hai lần: like, có hiệu ứng trái tim tại vị trí chạm.
- Nút bật/tắt tiếng; nhớ lựa chọn cho các video sau.
- Thanh tiến trình mảnh ở đáy.
- Lỗi phát: hiện "Không phát được video" với nút thử lại; vuốt sang video khác vẫn hoạt động.
- Dừng phát khi: chuyển tab, app xuống nền, mở màn hình khác đè lên. Quay lại thì phát tiếp.
- Mở bảng bình luận: video vẫn phát.
- Chỉ giữ ba trình phát trong bộ nhớ (trước, hiện tại, sau); nạp trước video kế tiếp.

### 6.3. Lớp phủ thông tin

- Góc dưới trái: avatar và tên (bấm → `UserProfile`), nút "Theo dõi" nhỏ cạnh tên (ẩn nếu đã theo dõi hoặc là mình), chú thích tối đa hai dòng kèm "xem thêm", hashtag.
- Cột phải: like kèm số, bình luận kèm số (mở `CommentModal` có sẵn), chia sẻ (mở `SharePostModal` có sẵn), lưu, nút "…".
- Nút "…": Không quan tâm, Báo cáo (3.7), Vì sao tôi thấy video này (hiện `reason.text`), Sao chép liên kết. Với video của mình: thêm Xóa.
- Dải tối dần ở đáy để chữ trắng luôn đọc được.
- Tôn trọng vùng an toàn; lớp phủ không bị tab bar che.
- Số lớn viết gọn: 1,2 N; 3,4 Tr.

### 6.4. Danh sách và trạng thái

- `FlatList` với `pagingEnabled`, `getItemLayout`, `windowSize` khoảng 3; chiều cao item đo bằng `onLayout` của vùng chứa (theo bản đặc tả, để tab bar vẫn còn).
- Tải lô tiếp theo khi còn 3 video chưa xem; gửi kèm danh sách `exclude`.
- Kéo xuống ở video đầu để làm mới.
- Hết video: một thẻ cuối ("Bạn đã xem hết video mới") với nút làm mới.
- Trạng thái: đang tải lần đầu, rỗng, lỗi mạng (nút thử lại), mất mạng giữa chừng.
- Mở Reels từ một video trong feed → bắt đầu đúng tại video đó.
- "Không quan tâm" → gỡ video khỏi danh sách và tự chuyển sang video kế tiếp.

### 6.5. Đo hành vi xem

- Với mỗi video: thời gian xem thực (không tính lúc tạm dừng hay đang chờ tải), đã xem hết chưa (≥ 90% thời lượng), số lần lặp, lướt qua nhanh (dưới 2 giây).
- Gửi theo lô: khi đủ khoảng 10 sự kiện, sau mỗi khoảng 10 giây, và khi app xuống nền.
- Mỗi sự kiện có `eventId` tự sinh, `requestId` và vị trí của video trong lô (xem `docs/reel/REEL_RECSYS_PRODUCTION_PLAN.pdf` mục 4.3).
- Gửi lỗi thì giữ lại và gửi kèm lô sau; không chặn giao diện.
- Like, lưu, bình luận, theo dõi thực hiện trên Reel cũng gửi thành sự kiện.

### 6.6. Đăng video

- Nút "Video" cạnh "Ảnh" ở màn Tạo bài.
- Chọn bằng `expo-image-picker` với `mediaTypes: ['videos']` và `videoMaxDuration: 60`.
- Kiểm tra trước khi tải: thời lượng, dung lượng, định dạng; báo lỗi cụ thể từng trường hợp.
- Xem trước video đã chọn, có nút bỏ chọn.
- Thanh tiến trình phần trăm khi tải; nút hủy; lỗi thì thử lại mà không phải chọn lại video.
- Đang tải mà rời màn hình → cảnh báo.
- Không đọc cả file vào bộ nhớ (không dùng `File.bytes()` cho video).
- Đăng xong: thông báo, xóa trắng màn tạo bài, bài mới xuất hiện ở feed và profile.

### 6.7. Hiển thị video trong feed thường

- `PostCard` hiện ảnh thu nhỏ, biểu tượng phát và thời lượng. Không tự phát trong feed.
- Bấm vào → mở Reels tại video đó.

### 6.8. Kiểm tra trước khi coi là xong

- Vuốt liên tục 30 video: không chồng tiếng, không giật, bộ nhớ không tăng mãi.
- Chạy trên ít nhất một máy Android thật, không chỉ BlueStacks.
- Có cuộc gọi đến hoặc khóa màn hình → video dừng.
- Mạng chậm: vẫn vuốt được, video hiện ảnh thu nhỏ và vòng quay.

---

## 7. Thứ tự làm đề xuất

**Đợt 0 — sửa cho chạy được với API thật**
1. A3: mapper không làm sập feed khi gặp bài đăng lại.
2. A1: màn xác thực email.
3. A2: quên mật khẩu chạy thật.
4. A5: lọc quyền riêng tư ở `GET /users/:id/posts`.
5. N0: stack navigator.

**Đợt 1 — danh sách của bạn, theo thứ tự phụ thuộc**
1. 2.9 Dòng cảnh báo trong email (vài phút).
2. 2.6 Sửa hồ sơ.
3. 2.3 Profile người khác.
4. 2.1 và 2.2 Xóa, sửa bình luận (làm luôn `ConfirmModal`).
5. 2.5 Tải thêm ở feed và dòng "đi ngủ đi".
6. 2.4 Luồng đăng lại.
7. 2.8 Bạn bè có thể quen.
8. 2.7 Giới thiệu và thiết lập lần đầu (cần 2.6 và 2.8).
9. 2.10 Cấu hình Google.

**Đợt 2 — bắt buộc trước khi đưa cho người dùng thật**
1. 3.13 Cài đặt, 3.4 Đổi mật khẩu, 3.5 Xóa tài khoản, 3.8 Điều khoản.
2. 3.6 Chặn, 3.7 Báo cáo.
3. 3.3 Duy trì đăng nhập, 3.9 Giới hạn tần suất.
4. 3.11 Chi tiết bài viết, 3.15 Huy hiệu chưa đọc, 3.16 Danh sách follower, 3.10 Tải thêm, 3.14 Trả lời bình luận.
5. 3.12 Thông báo đẩy.

**Đợt 3 — nên có:** mục 4, theo thứ tự 4.1, 4.2, 4.8, 4.6, 4.4, còn lại.

**Giao diện Reel (mục 6)** chạy song song từ Đợt 1 bằng dữ liệu mock, vì không phụ thuộc các mục trên ngoài N0 (để mở profile từ Reel).
