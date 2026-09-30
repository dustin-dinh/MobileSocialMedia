# Test Plan - Mobile Social Media (Week 4)

## 1. Mục tiêu
Đảm bảo chất lượng toàn diện của ứng dụng `apps/mobile` trước thềm release candidate và demo cuối kỳ:
- Nghiệm thu chức năng Tuần 3 (Like, Comment, Reply, Search, Follow, Notification).
- Hồi quy toàn diện MVP (Regression Suite R-xx).
- Kiểm thử đa cấu hình thiết bị, kiểm soát safe area, bàn phím và layout.
- Kiểm thử hiệu năng, độ mượt và tối ưu hóa bundle.
- Đảm bảo kịch bản E2E 10 bước hoạt động ổn định.

---

## 2. Tiêu chí và trạng thái kiểm thử
Mỗi test case tuân thủ cấu trúc chuẩn:
`Test ID | Feature | Precondition | Test data | Steps | Expected | Actual | Trạng thái | Bug ID | Evidence`

Các trạng thái hợp lệ:
- `PASS`: Đạt yêu cầu, có evidence xác thực (ảnh chụp, logcat, jest output).
- `FAIL`: Không đạt yêu cầu, có bug ID tương ứng trong `BUGS.md`.
- `BLOCKED-BACKEND`: Cần backend thật nhưng đang chạy ở chế độ MODE=MOCK hoặc backend không khả dụng.
- `NEEDS-HUMAN`: Cần người dùng xác nhận trực tiếp (cảm nhận độ mượt, kiểm tra trên thiết bị thật).

---

## 3. Danh sách Test Cases Tuần 3 (S1: T3-01 -> T3-13)

| Test ID | Feature | Precondition | Test data | Steps | Expected | Actual | Trạng thái | Bug ID | Evidence |
|---|---|---|---|---|---|---|---|---|---|
| **T3-01** | Like/Unlike Post | App mở ở màn hình Feed, có bài viết | Post ID: `post-1` | 1. Tap icon Like. 2. Quan sát icon và counter tăng. 3. Tap icon Like lần nữa. | Counter tăng từ N lên N+1, sau đó giảm về N, icon đổi trạng thái active/inactive | (Pending execution) | NOT_RUN | - | - |
| **T3-02** | Rapid Like/Unlike Spam | Đang ở Feed, bài viết hiển thị | Post ID: `post-1` | 1. Tap liên tục vào nút Like 5 lần thật nhanh. | Không bị trùng lặp request, counter không bị nhảy sai hoặc âm | (Pending execution) | NOT_RUN | - | - |
| **T3-03** | Comment Post | Đang mở modal comment của bài post | Text: "Bài viết rất hay!" | 1. Mở Comment modal. 2. Nhập text. 3. Bấm gửi. | Comment mới xuất hiện ở danh sách comment của đúng post đó, counter comment tăng 1 | (Pending execution) | NOT_RUN | - | - |
| **T3-04** | Reply Comment | Comment modal đang mở, có comment cha | Parent ID: `c-1`, Text: "Đồng quan điểm!" | 1. Bấm nút Reply ở comment cha. 2. Nhập nội dung. 3. Gửi. | Reply xuất hiện lùi lề/nhóm dưới đúng comment cha, counter comment tăng | (Pending execution) | NOT_RUN | - | - |
| **T3-05** | Search User | Chuyển sang Tab Search | Query: "sarah", "Sarah Chen" | 1. Nhập username hoặc display name vào ô tìm kiếm. | Hiển thị kết quả đúng người dùng tương ứng | (Pending execution) | NOT_RUN | - | - |
| **T3-06** | Search Edge Cases | Đang ở Tab Search | Query: "   ", "@xyznotfound123" | 1. Thử search chuỗi rỗng. 2. Thử search từ khóa không tồn tại. | Rỗng: hiển thị gợi ý hoặc danh sách trống; Không thấy: hiển thị empty state phù hợp, không crash | (Pending execution) | NOT_RUN | - | - |
| **T3-07** | Follow from Search | Kết quả tìm kiếm hiển thị user chưa follow | Target user: `@alexrivera` | 1. Tap nút Follow ngay trong kết quả tìm kiếm. 2. Chuyển sang xem profile user đó. | Nút đổi sang "Following", vào profile user thấy trạng thái đồng bộ | (Pending execution) | NOT_RUN | - | - |
| **T3-08** | Notification Creation | User thực hiện follow/like/comment | Action: Follow hoặc Like | 1. Thực hiện action tương tác. 2. Mở tab Notifications. | Thông báo mới được tạo theo thiết kế | (Pending execution) | NOT_RUN | - | - |
| **T3-09** | Notification Display | Tab Notifications có thông báo | Danh sách thông báo | 1. Quan sát danh sách thông báo. | Hiển thị rõ actor (avatar, tên), hành động (liked/commented/followed), thời gian và target | (Pending execution) | NOT_RUN | - | - |
| **T3-10** | Notification Read State | Tab Notifications có thông báo chưa đọc | Notif ID: `notif-1` | 1. Tap vào thông báo hoặc nút "Mark all as read". 2. Reload app. | Trạng thái đã đọc được lưu giữ sau khi reload | (Pending execution) | NOT_RUN | - | - |
| **T3-11** | No Duplicate Notifications | Nhiều thao tác tương tác | Thao tác like/unlike lặp lại | 1. Thao tác tương tác lặp lại. 2. Kiểm tra danh sách thông báo. | Không sinh thông báo trùng lặp rác ngoài thiết kế | (Pending execution) | NOT_RUN | - | - |
| **T3-12** | Network & Error Handling | Thao tác khi mạng chập chờn/lỗi service | Tắt mạng hoặc service trả lỗi | 1. Gửi request khi mất mạng hoặc backend lỗi. | Có thông báo lỗi/loading state thân thiện, không làm sập ứng dụng (không đỏ) | (Pending execution) | NOT_RUN | - | - |
| **T3-13** | Regression Suite Tuần 3 | Toàn bộ các luồng Auth, Post, Feed, Profile, Follow | Tổng hợp bộ test case | 1. Chạy lại smoke & regression ngắn cho các luồng cốt lõi. | Mọi luồng cơ bản hoạt động bình thường, không hồi quy lỗi | (Pending execution) | NOT_RUN | - | - |

---

## 4. Danh sách Regression Suite MVP (S2: R-01 -> R-16)

| Test ID | Feature | Mô tả kiểm thử | Kỳ vọng | Trạng thái |
|---|---|---|---|---|
| **R-01** | Auth - Register | Đăng ký tài khoản mới hợp lệ | Tạo tài khoản thành công hoặc chuyển sang bước tiếp theo | NOT_RUN |
| **R-02** | Auth - Register Validation | Đăng ký với email sai format, mật khẩu ngắn | Báo lỗi validation ngay trên form, không cho submit | NOT_RUN |
| **R-03** | Auth - Login | Đăng nhập tài khoản hợp lệ | Lưu token, chuyển vào màn hình chính (Main Tabs) | NOT_RUN |
| **R-04** | Auth - Login Error | Đăng nhập sai mật khẩu / tài khoản | Hiển thị thông báo lỗi rõ ràng, giữ nguyên form | NOT_RUN |
| **R-05** | Post - Create Post | Đăng bài viết mới có text và chọn ảnh | Bài viết được tạo, xuất hiện trên đầu Feed | NOT_RUN |
| **R-06** | Post - Create Validation | Đăng bài không có nội dung | Nút Đăng bị disabled hoặc báo lỗi validation | NOT_RUN |
| **R-07** | Feed - List Display | Hiển thị danh sách Feed bài viết | Hiển thị đầy đủ avatar, tên tác giả, nội dung, ảnh đính kèm | NOT_RUN |
| **R-08** | Feed - Pull to Refresh | Kéo vuốt màn hình để làm mới | Hiển thị indicator làm mới, cập nhật lại danh sách bài | NOT_RUN |
| **R-09** | Profile - Display | Mở trang cá nhân Profile | Hiển thị đúng thông tin user, avatar, số following/followers, bài viết cá nhân | NOT_RUN |
| **R-10** | Profile - Tabs/Sub-views | Chuyển đổi qua lại giữa Posts/Media/Likes | Tab chuyển mượt mà, nội dung tương ứng hiển thị đúng | NOT_RUN |
| **R-11** | Follow - Profile Toggle | Bấm Follow/Unfollow trên màn hình Profile | Nút chuyển đổi trạng thái Follow/Unfollow, cập nhật số follower | NOT_RUN |
| **R-12** | Like - Feed Interaction | Like/Unlike bài viết từ Feed | Counter like cập nhật tức thì, animation/icon thay đổi mượt | NOT_RUN |
| **R-13** | Comment - Interaction | Mở modal comment, gửi bình luận | Bình luận xuất hiện ngay lập tức trong danh sách | NOT_RUN |
| **R-14** | Search - Flow | Tìm kiếm người dùng và xem kết quả | Tìm kiếm nhanh, hiển thị đúng card người dùng | NOT_RUN |
| **R-15** | Notification - Flow | Xem danh sách thông báo | Danh sách cuộn tốt, phân biệt rõ thông báo đọc/chưa đọc | NOT_RUN |
| **R-16** | Auth - Logout | Bấm Đăng xuất từ trang Profile/Settings | Xóa token/session, điều hướng quay lại màn hình Login | NOT_RUN |

---

## 5. Kiểm thử các trạng thái đặc biệt (State Testing)
- **Loading State:** Kiểm tra skeleton / spinner hiển thị khi dữ liệu đang tải.
- **Empty State:** Kiểm tra thông điệp thân thiện khi danh sách rỗng (Feed rỗng, Search không có kết quả, Thông báo rỗng).
- **Error State:** Kiểm tra giao diện báo lỗi kèm nút Thử lại (Retry) khi có sự cố.
- **Restart State:** Đóng hoàn toàn app (force-stop) rồi mở lại; kiểm tra session và dữ liệu có được khôi phục nguyên vẹn.
- **Network Failure:** Tắt kết nối mạng khi đang thao tác; kiểm tra app xử lý lịch sự, không crash.
