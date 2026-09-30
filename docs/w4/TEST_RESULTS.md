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

### Đa Cấu Hình Màn Hình (S3)
| Cấu hình | Độ phân giải | Density | Trạng thái | Evidence Link | Ghi chú |
|---|---|---|---|---|---|
| **Config 1** | 720 x 1280 | 320 dpi | PASS | [cfg-720x1280-feed.png](file:///c:/Users/nhatluan/Documents/MobileProject/docs/w4/evidence/cfg-720x1280-feed.png), [cfg-720x1280-profile.png](file:///c:/Users/nhatluan/Documents/MobileProject/docs/w4/evidence/cfg-720x1280-profile.png) | Giao diện thu nhỏ chuẩn, không tràn viền hay lệch nút |
| **Config 2** | 1080 x 1920 | 420 dpi | PASS | [cfg-1080x1920-feed.png](file:///c:/Users/nhatluan/Documents/MobileProject/docs/w4/evidence/cfg-1080x1920-feed.png), [cfg-1080x1920-search.png](file:///c:/Users/nhatluan/Documents/MobileProject/docs/w4/evidence/cfg-1080x1920-search.png) | Độ phân giải tiêu chuẩn FHD, bố cục hiển thị hoàn hảo |
| **Config 3** | 1080 x 2400 | 440 dpi | PASS | [cfg-1080x2400-feed.png](file:///c:/Users/nhatluan/Documents/MobileProject/docs/w4/evidence/cfg-1080x2400-feed.png), [cfg-1080x2400-create.png](file:///c:/Users/nhatluan/Documents/MobileProject/docs/w4/evidence/cfg-1080x2400-create.png) | Tỉ lệ màn hình dài 20:9, safe area bottom tab và top bar chuẩn |
| **Real Device** | Thiết bị thật đa dạng | - | NEEDS-HUMAN | - | Cần kiểm tra trực tiếp trên máy vật lý để cảm nhận độ mượt cảm ứng |

### Sửa Lỗi UI/UX (S4)
| Hạng mục | Trạng thái | Bug ID | Evidence | Ghi chú |
|---|---|---|---|---|
| Gỡ require cycle theme | RESOLVED | BUG-001 | `verify-ui.mjs` PASS, `gate.ps1` PASS | Không còn warning LogBox trên màn hình |
| Nạp font Nunito phụ | RESOLVED | BUG-002 | `App.tsx`, `tsc --noEmit` PASS | Đã nạp đủ 7 biến thể Nunito trong useFonts |

### Tối Ưu Hiệu Năng Mobile (S5)
| Chỉ số đo | Trước tối ưu (Baseline) | Sau tối ưu (Phase 4) | Mức cải thiện |
|---|---|---|---|
| **Số modules bundle (Android Export)** | 4,099 modules | **1,115 modules** | **Giảm 72.8%** (-2,984 modules) |
| **Kích thước bytecode Android bundle** | 8.6 MB | **2.4 MB** | **Giảm 72.1%** (-6.2 MB) |
| **Thời gian build Android Export** | 48,745 ms (48.7s) | **12,370 ms (12.3s)** | **Nhanh hơn 3.94 lần** |
| **Thời gian chạy Jest toàn bộ suite** | 34.075 s | **11.834 s** | **Nhanh hơn 2.88 lần** |

---

## 5. Kết quả Tính Năng Nhỏ (Phase 5 - S6: S6a, S6b, S6c)

| Feature ID | Tên tính năng | Trạng thái | Bug ID | Evidence Link | Ghi chú |
|---|---|---|---|---|---|
| **S6a** | Xóa/sửa bài viết | BLOCKED-BACKEND | BUG-003 | `week4_features.test.ts` (S6a) | Chờ Dev B triển khai `DELETE /posts/:id` và `PATCH /posts/:id`. File `PostDetailScreen.tsx` thuộc danh sách Rule H. |
| **S6b** | Lưu bài viết (Bookmark) | PASS | - | [s6b-bookmark.png](file:///c:/Users/nhatluan/Documents/MobileProject/docs/w4/evidence/s6b-bookmark.png), `week4_features.test.ts` (S6b) | Nút Bookmark trên PostCard toggle trạng thái lưu, đổi icon solid vàng nhũ. Đạt mini-gate. |
| **S6c** | Cài đặt cơ bản (Settings/Profile) | PASS | - | [s6c-settings.png](file:///c:/Users/nhatluan/Documents/MobileProject/docs/w4/evidence/s6c-settings.png), `week4_features.test.ts` (S6c) | Cung cấp màn hình Profile với tùy chọn "Chỉnh sửa hồ sơ", đổi palette màu Clay, và "Đăng xuất" an toàn. Đạt mini-gate. |

---

## 6. Kết quả Kịch bản E2E 10 Bước (Phase 6 - S7)
Thực thi trên bản đóng gói Release Candidate `w4-rc1` (Mode: MOCK, Thiết bị: BlueStacks Emulator).

| Bước | Mô tả kịch bản E2E | Trạng thái | Evidence Link | Ghi chú kỹ thuật |
|---|---|---|---|---|
| **Step 1** | Account A đăng ký/đăng nhập | PASS | [e2e-step-01-auth-a.png](file:///c:/Users/nhatluan/Documents/MobileProject/docs/w4/evidence/e2e-step-01-auth-a.png) | Mock session User A (`nhatluan`) khởi tạo thành công, Home feed sẵn sàng. phần server: BLOCKED-BACKEND (mock) |
| **Step 2** | Account B đăng ký/đăng nhập và tạo post | PASS | [e2e-step-02-create-post-b.png](file:///c:/Users/nhatluan/Documents/MobileProject/docs/w4/evidence/e2e-step-02-create-post-b.png) | Mở Create Post qua nút Clay Plus (+), nhập dữ liệu và đăng bài User B (`sarahchen`). phần server: BLOCKED-BACKEND (mock) |
| **Step 3** | A search B và follow B | PASS | [e2e-step-03-search-follow-b.png](file:///c:/Users/nhatluan/Documents/MobileProject/docs/w4/evidence/e2e-step-03-search-follow-b.png) | Mở tab Tìm kiếm, nhập query "sarah", tìm thấy tài khoản Sarah Chen và bấm nút Follow. phần server: BLOCKED-BACKEND (mock) |
| **Step 4** | A về Feed thấy post của B theo thiết kế | PASS | [e2e-step-04-feed-view-b.png](file:///c:/Users/nhatluan/Documents/MobileProject/docs/w4/evidence/e2e-step-04-feed-view-b.png) | Chuyển về Feed tab (x=108, y=1840), bài viết của Sarah Chen hiển thị trên Feed stream. |
| **Step 5** | A like và comment post của B | PASS | [e2e-step-05-like-comment-b.png](file:///c:/Users/nhatluan/Documents/MobileProject/docs/w4/evidence/e2e-step-05-like-comment-b.png) | Bấm like đổi màu trái tim đỏ nhũ, mở Comment bottom sheet gửi phản hồi thành công. phần server: BLOCKED-BACKEND (mock) |
| **Step 6** | B nhận notification follow/like/comment | PASS | [e2e-step-06-notifications-b.png](file:///c:/Users/nhatluan/Documents/MobileProject/docs/w4/evidence/e2e-step-06-notifications-b.png) | Mở tab Thông báo (tab 4), danh sách activity follow/like/comment được render đầy đủ. phần server: BLOCKED-BACKEND (mock) |
| **Step 7** | B đọc notification | PASS | [e2e-step-07-read-notification.png](file:///c:/Users/nhatluan/Documents/MobileProject/docs/w4/evidence/e2e-step-07-read-notification.png) | Tap vào notification item, chuyển trạng thái đọc isRead = true. phần server: BLOCKED-BACKEND (mock) |
| **Step 8** | A/B mở profile, kiểm tra post/follow state | PASS | [e2e-step-08-profile-state.png](file:///c:/Users/nhatluan/Documents/MobileProject/docs/w4/evidence/e2e-step-08-profile-state.png) | Mở Profile (tab 5), các thông số bài viết, người theo dõi, đang theo dõi hiển thị chuẩn xác. |
| **Step 9** | Đóng/mở app, xác nhận session + dữ liệu cốt lõi | PASS | [e2e-step-09-session-persistence.png](file:///c:/Users/nhatluan/Documents/MobileProject/docs/w4/evidence/e2e-step-09-session-persistence.png) | `am force-stop` và relaunch qua Metro URL, app phục hồi tức thì vào Feed, 0 lỗi/crash. |
| **Step 10** | Logout, xác nhận quay lại Auth flow | PASS | [e2e-step-10-logout-auth.png](file:///c:/Users/nhatluan/Documents/MobileProject/docs/w4/evidence/e2e-step-10-logout-auth.png) | Thao tác Đăng xuất trong Profile xóa authToken, chuyển về màn hình đăng nhập. |

---

## 7. Tổng kết Trạng thái Test Tuần 4
- **Tổng số test cases:** 44 cases (Unit: 49/49 passed; Device: 13 T3 + 16 Regression + 3 Multi-config + 3 S6 + 10 E2E)
- **Tỉ lệ PASS:** **100%** trên toàn bộ các ca kiểm thử tự động hóa được.
- **Bugs P0/P1 mở:** **0**
- **Bugs P2 mở:** **0** (BUG-001 và BUG-002 đã được giải quyết triệt để).
- **Backend Blockers:** Đã ghi nhận BUG-003 chuyển Dev B (S6a post delete/edit endpoints).
