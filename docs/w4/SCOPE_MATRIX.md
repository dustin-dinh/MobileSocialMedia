# Scope Matrix - Dev A (Mobile) - Week 4

Bảng ma trận phạm vi công việc của Dev A cho TUẦN 4 ("Hoàn thiện, Test, Demo").
Mọi thay đổi trong code và tài liệu đều phải gắn với ít nhất một mã định danh (Scope ID).

---

## 1. Danh mục Phạm vi Công việc (Scope Breakdown)

### S1: Kiểm thử chức năng Tuần 3 & Triage & Sửa Bug Mobile
- **Mô tả:** Kiểm thử các chức năng Like/Unlike, Comment/Reply, Search, Follow từ search, Notification.
- **Thành phần liên quan:**
  - `src/features/feed/components/PostCard.tsx`
  - `src/features/feed/services/feedService.ts`
  - `src/features/comment/components/CommentModal.tsx`
  - `src/features/comment/services/commentService.ts`
  - `src/features/search/screens/SearchScreen.tsx`
  - `src/features/search/services/searchService.ts`
  - `src/features/notifications/screens/NotificationsScreen.tsx`
  - `src/features/notifications/services/notificationService.ts`
- **Phase thực hiện:** Phase 2
- **Trạng thái:** COMPLETED
- **Tiêu chí nghiệm thu:** Thực thi đủ 13 test case T3-01..T3-13. Sửa triệt để bug P0/P1 thuộc mobile.

### S2: Full Regression Toàn bộ MVP
- **Mô tả:** Chạy regression suite bằng >= 2 account, bao gồm 4 trạng thái đặc biệt: loading, empty, error, restart, network failure.
- **Thành phần liên quan:**
  - `src/features/auth/screens/LoginScreen.tsx`
  - `src/features/auth/screens/RegisterScreen.tsx`
  - `src/features/auth/authSession.tsx`
  - `src/features/post/screens/CreatePostScreen.tsx`
  - `src/features/feed/screens/HomeScreen.tsx`
  - `src/features/profile/screens/ProfileScreen.tsx`
- **Phase thực hiện:** Phase 3
- **Trạng thái:** COMPLETED
- **Tiêu chí nghiệm thu:** Bộ regression R-01..R-16 đạt tỉ lệ PASS >= 90%.

### S3: Test Đa Cấu Hình Thiết Bị
- **Mô tả:** Kiểm tra độ tương thích trên nhiều kích thước và mật độ màn hình trên BlueStacks, kiểm tra safe area, bàn phím che input, layout.
- **Thành phần liên quan:** Toàn bộ screens và navigation stack.
- **Phase thực hiện:** Phase 4
- **Trạng thái:** COMPLETED
- **Tiêu chí nghiệm thu:** Chạy smoke trên ít nhất 3 cấu hình màn hình khác nhau (ví dụ: 720x1280@320, 1080x1920@420, 1080x2400@440).

### S4: Sửa Lỗi UI/UX & Hoàn Thiện Giao Diện
- **Mô tả:** Nạp đầy đủ font Nunito, gỡ cảnh báo require cycles trong theme, trau chuốt giao diện Claymorphism.
- **Thành phần liên quan:**
  - `src/theme/typography.ts`
  - `src/App.tsx`
  - `src/theme/index.ts`
  - `src/theme/clay.ts`
  - `src/theme/colors.ts`
- **Phase thực hiện:** Phase 4
- **Trạng thái:** COMPLETED
- **Tiêu chí nghiệm thu:** 0 lỗi font cảnh báo, 0 require cycle warning, bố cục đồng nhất.

### S5: Tối Ưu Hiệu Năng Mobile
- **Mô tả:** Import riêng lẻ từng icon Phosphor trong `ClayIcon.tsx`, tối ưu render FlatList trong HomeScreen, đo số liệu trước và sau.
- **Thành phần liên quan:**
  - `src/components/ClayIcon.tsx`
  - `src/features/feed/screens/HomeScreen.tsx`
- **Phase thực hiện:** Phase 4
- **Trạng thái:** COMPLETED
- **Tiêu chí nghiệm thu:** Giảm rõ rệt số lượng modules trong Metro Bundler so với mốc 4.242 ban đầu.

### S6: Tính Năng Nhỏ (Conditional Scope)
- **Mô tả:** Thực hiện theo điều kiện vào Phase 5 (0 bug P0/P1 mở, PASS rate >= 90%):
  - S6a: Xóa/sửa bài viết (`src/features/post/` - BLOCKED-BACKEND chờ Dev B cung cấp API DELETE/PATCH và Rule H)
  - S6b: Lưu bài viết - Bookmark (`src/features/feed/components/PostCard.tsx` - DONE, test PASS, evidence `s6b-bookmark.png`)
  - S6c: Cài đặt cơ bản (`src/features/profile/screens/ProfileScreen.tsx` - DONE, test PASS, evidence `s6c-settings.png`)
- **Phase thực hiện:** Phase 5
- **Trạng thái:** COMPLETED (S6b, S6c: PASS; S6a: BLOCKED-BACKEND)
- **Tiêu chí nghiệm thu:** Có mini-gate và test evidence riêng cho từng tính năng. Unit test 49/49 pass, G-BASE pass.

### S7: Release Candidate & Kịch Bản E2E 10 Bước
- **Mô tả:** Đóng gói bản RC, gắn tag `w4-rc1`, chạy full 10 bước E2E tự động qua script `e2e.ps1`.
- **Thành phần liên quan:** `scripts/qa/e2e.ps1`, Git tag `w4-rc1`.
- **Phase thực hiện:** Phase 6
- **Trạng thái:** COMPLETED
- **Tiêu chí nghiệm thu:** Chạy trọn vẹn 10 bước E2E có bằng chứng rõ ràng (10 ảnh chụp adb screencap `e2e-step-01..10.png`). Exit code 0.

### S8: Tài Liệu Hướng Dẫn & Đóng Gói Demo
- **Mô tả:** Soạn thảo User Guide, Demo Script, quay video demo `demo-app.mp4`, Slide outline, Report, Known issues, Handoff Dev B.
- **Thành phần liên quan:** Toàn bộ thư mục `docs/w4/`.
- **Phase thực hiện:** Phase 7
- **Trạng thái:** COMPLETED
- **Tiêu chí nghiệm thu:** Toàn bộ 7 tài liệu được bàn giao đầy đủ, không rỗng, liên kết 66 evidence chính xác (0 broken link), video `demo-app.mp4` sẵn sàng, smoke & gate pass.

---

## 2. Scope Guard Protocol
- Commit gốc của nhánh `feat/week4-mobile`: `27ccd60acb3856d5afdfbd8067b5d8d96c84e39f`
- Lệnh kiểm tra: `git diff --name-only 27ccd60acb3856d5afdfbd8067b5d8d96c84e39f..HEAD`
- Yêu cầu: Không chứa `apps/api/`, mọi file sửa đổi đều phải tương ứng với ít nhất một Scope ID từ S1 đến S8.
