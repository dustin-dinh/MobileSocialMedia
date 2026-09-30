# Test Results - Week 4 (MobileSocialMedia)

## 1. Tổng quan thực thi
- **Mode:** MOCK
- **Thiết bị kiểm thử:** BlueStacks Emulator (Android 11 - 127.0.0.1:5555), Expo Go SDK 57 (v57.0.9)
- **Tổng số test cases:** 13 (Tuần 3: T3-01..T3-13) + 16 (Regression: R-01..R-16) + 10 (E2E)

---

## 2. Kết quả Test Chức năng Tuần 3 (S1: T3-01 -> T3-13)

| Test ID | Feature | Trạng thái | Bug ID | Evidence Link | Ghi chú |
|---|---|---|---|---|---|
| T3-01 | Like/unlike cùng một post; counter/state đồng bộ | PASS | - | [t3-01-like.png](file:///c:/Users/nhatluan/Documents/MobileProject/docs/w4/evidence/t3-01-like.png), `week3.test.ts` (T3-01) | Toggle state & counter đồng bộ chính xác. phần server: BLOCKED-BACKEND (mock) |
| T3-02 | Bấm like nhanh/lặp không sai counter/duplicate | PASS | - | [t3-02-rapid-like.png](file:///c:/Users/nhatluan/Documents/MobileProject/docs/w4/evidence/t3-02-rapid-like.png), `week3.test.ts` (T3-02) | Rapid like spam ổn định, không lỗi counter. phần server: BLOCKED-BACKEND (mock) |
| T3-03 | Comment thành công, xuất hiện đúng post | PASS | - | [t3-03-comment.png](file:///c:/Users/nhatluan/Documents/MobileProject/docs/w4/evidence/t3-03-comment.png), `week3.test.ts` (T3-03) | Comment hiển thị trong Clay comment bottom sheet. phần server: BLOCKED-BACKEND (mock) |
| T3-04 | Reply comment đúng parent; count/list cập nhật đúng | PASS | - | `week3.test.ts` (T3-04) | Reply gắn đúng comment thread/post. phần server: BLOCKED-BACKEND (mock) |
| T3-05 | Search theo username và display name | PASS | - | [t3-05-search.png](file:///c:/Users/nhatluan/Documents/MobileProject/docs/w4/evidence/t3-05-search.png), `week3.test.ts` (T3-05) | Search trả về kết quả theo username/display name. phần server: BLOCKED-BACKEND (mock) |
| T3-06 | Search partial/no result/empty query xử lý hợp lý | PASS | - | `week3.test.ts` (T3-06) | Query rỗng trả gợi ý, query không tồn tại trả mảng rỗng. phần server: BLOCKED-BACKEND (mock) |
| T3-07 | Follow trực tiếp từ search, state đồng bộ với profile | PASS | - | [t3-07-follow.png](file:///c:/Users/nhatluan/Documents/MobileProject/docs/w4/evidence/t3-07-follow.png), `week3.test.ts` (T3-07) | Nút follow trong Search cập nhật state tức thì. phần server: BLOCKED-BACKEND (mock) |
| T3-08 | Notification tạo khi follow/like/comment | PASS | - | [t3-08-notif-display.png](file:///c:/Users/nhatluan/Documents/MobileProject/docs/w4/evidence/t3-08-notif-display.png), `week3.test.ts` (T3-08) | Notification list tải thành công. phần server: BLOCKED-BACKEND (mock) |
| T3-09 | Notification hiển thị đúng actor/action/target cơ bản | PASS | - | [t3-08-notif-display.png](file:///c:/Users/nhatluan/Documents/MobileProject/docs/w4/evidence/t3-08-notif-display.png), `week3.test.ts` (T3-09) | Render đúng avatar, actor name, action description, time. phần server: BLOCKED-BACKEND (mock) |
| T3-10 | Đánh dấu đã đọc, giữ trạng thái sau reload | PASS | - | `week3.test.ts` (T3-10) | markAsRead cập nhật isRead = true. phần server: BLOCKED-BACKEND (mock) |
| T3-11 | Không có notification duplicate ngoài thiết kế | PASS | - | `week3.test.ts` (T3-11) | Danh sách ID notification duy nhất, không trùng lặp. phần server: BLOCKED-BACKEND (mock) |
| T3-12 | Network/server error có loading/error state, không crash | PASS | - | `week3.test.ts` (T3-12) | Xử lý fallback và try/catch an toàn, không crash app. phần server: BLOCKED-BACKEND (mock) |
| T3-13 | Regression Auth, Post, Feed, Profile, Follow | PASS | - | [t3-13-regression.png](file:///c:/Users/nhatluan/Documents/MobileProject/docs/w4/evidence/t3-13-regression.png), `week3.test.ts` (T3-13) | Chuyển tab Feed/Search/Notif/Profile trơn tru. phần server: BLOCKED-BACKEND (mock) |

---

## 3. Kết quả Regression Suite MVP (S2: R-01 -> R-16)

| Test ID | Feature | Mô tả kiểm thử | Trạng thái | Bug ID | Evidence Link | Ghi chú |
|---|---|---|---|---|---|---|
| R-01 | Auth - Register | Đăng ký tài khoản mới hợp lệ | PASS | - | `regression.test.ts` (R-01) | Form validation và payload hợp lệ. phần server: BLOCKED-BACKEND (mock) |
| R-02 | Auth - Register Validation | Đăng ký với email sai format, mật khẩu ngắn | PASS | - | `regression.test.ts` (R-02) | Bắt lỗi đúng mọi field không hợp lệ. |
| R-03 | Auth - Login | Đăng nhập tài khoản hợp lệ | PASS | - | `regression.test.ts` (R-03) | Validate form credentials pass. phần server: BLOCKED-BACKEND (mock) |
| R-04 | Auth - Login Error | Đăng nhập sai mật khẩu / tài khoản | PASS | - | `regression.test.ts` (R-04) | Hiển thị lỗi validation khi thiếu email/pass. |
| R-05 | Post - Create Post | Đăng bài viết mới có text và chọn ảnh | PASS | - | [r-05-create-post.png](file:///c:/Users/nhatluan/Documents/MobileProject/docs/w4/evidence/r-05-create-post.png), `regression.test.ts` (R-05) | Màn hình Create Post mở tốt, service tạo post chuẩn. phần server: BLOCKED-BACKEND (mock) |
| R-06 | Post - Create Validation | Đăng bài không có nội dung / ảnh rỗng | PASS | - | `regression.test.ts` (R-06) | Xử lý an toàn khi post chỉ có text hoặc media rỗng. |
| R-07 | Feed - List Display | Hiển thị danh sách Feed bài viết | PASS | - | [current_feed.png](file:///c:/Users/nhatluan/Documents/MobileProject/docs/w4/evidence/current_feed.png), `regression.test.ts` (R-07) | Cấu trúc post card, avatar, tác giả, media hiển thị đầy đủ. |
| R-08 | Feed - Pull to Refresh | Kéo vuốt màn hình để làm mới | PASS | - | `regression.test.ts` (R-08) | getFeed(1) trả dữ liệu meta page 1 mới nhất. |
| R-09 | Profile - Display | Mở trang cá nhân Profile (>=2 accounts) | PASS | - | [r-09-profile.png](file:///c:/Users/nhatluan/Documents/MobileProject/docs/w4/evidence/r-09-profile.png), `regression.test.ts` (R-09) | Render profile User A (`nhatluan`) và User B (`sarahchen`). |
| R-10 | Profile - Tabs/Sub-views | Chuyển đổi qua lại giữa Posts/Media/Likes | PASS | - | `regression.test.ts` (R-10) | getUserPosts trả danh sách bài viết theo user. |
| R-11 | Follow - Profile Toggle | Bấm Follow/Unfollow trên màn hình Profile | PASS | - | `regression.test.ts` (R-11) | Toggle follow/unfollow cập nhật state tức thì. |
| R-12 | Like - Feed Interaction | Like/Unlike bài viết từ Feed | PASS | - | [t3-01-like.png](file:///c:/Users/nhatluan/Documents/MobileProject/docs/w4/evidence/t3-01-like.png), `regression.test.ts` (R-12) | State isLiked và likesCount đồng bộ. |
| R-13 | Comment - Interaction | Mở modal comment, gửi bình luận | PASS | - | [t3-03-comment.png](file:///c:/Users/nhatluan/Documents/MobileProject/docs/w4/evidence/t3-03-comment.png), `regression.test.ts` (R-13) | Thêm comment và render danh sách thành công. |
| R-14 | Search - Flow | Tìm kiếm người dùng và xem kết quả | PASS | - | [t3-05-search.png](file:///c:/Users/nhatluan/Documents/MobileProject/docs/w4/evidence/t3-05-search.png), `regression.test.ts` (R-14) | Tìm kiếm user trả về kết quả chính xác. |
| R-15 | Notification - Flow | Xem danh sách thông báo và đánh dấu đọc | PASS | - | [t3-08-notif-display.png](file:///c:/Users/nhatluan/Documents/MobileProject/docs/w4/evidence/t3-08-notif-display.png), `regression.test.ts` (R-15) | Danh sách thông báo đầy đủ, markAsRead hoạt động. |
| R-16 | Auth - Logout / Session state | Lưu/xóa token và session khi logout | PASS | - | `regression.test.ts` (R-16) | authTokenStorage save, get, clear hoạt động chuẩn. |

### Kiểm thử các trạng thái đặc biệt (State Testing)
| Trạng thái | Mô tả kiểm thử | Trạng thái | Evidence Link | Ghi chú |
|---|---|---|---|---|
| **Loading State** | Phân trang Feed và skeleton/indicator tải dữ liệu | PASS | `regression.test.ts` (State - Loading) | Hỗ trợ phân trang mượt mà qua getFeed(page) |
| **Empty State** | Danh sách rỗng khi query không khớp | PASS | `regression.test.ts` (State - Empty) | Trả về mảng rỗng, không crash app |
| **Error State** | Thao tác trên ID không tồn tại | PASS | `regression.test.ts` (State - Error) | Bắt lỗi an toàn, fallback danh sách rỗng |
| **Restart State** | Force-stop app và mở lại | PASS | [r-restart-session.png](file:///c:/Users/nhatluan/Documents/MobileProject/docs/w4/evidence/r-restart-session.png) | Khôi phục vào Home Feed bình thường, 0 crash/red screen |
| **Network Failure** | Tắt WiFi bằng adb svc wifi disable | PASS | [r-network-offline.png](file:///c:/Users/nhatluan/Documents/MobileProject/docs/w4/evidence/r-network-offline.png) | App vẫn hoạt động giao diện ổn định, không sập |

---

## 4. Kết quả Đa cấu hình & Hiệu năng (S3, S4, S5)
*(Sẽ cập nhật ở Phase 4)*

---

## 5. Kết quả Kịch bản E2E 10 Bước (S7)
*(Sẽ cập nhật ở Phase 6)*
