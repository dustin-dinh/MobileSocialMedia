# Danh Sách Các Vấn Đề Đã Biết (Known Issues) - Tuần 4

Tài liệu ghi nhận toàn bộ các vấn đề, lỗi kỹ thuật, cảnh báo và giới hạn hệ thống còn mở hoặc đã được xử lý trong Tuần 4 của dự án **MobileSocialMedia** (Khớp với `docs/w4/BUGS.md`).

---

## 1. Bảng Tổng Hợp Vấn Đề Kỹ Thuật

| Mã Vấn Đề | Tiêu đề | Mức độ | Chủ sở hữu (Owner) | Trạng thái | Giải pháp tạm thời (Workaround) / Khắc phục |
|---|---|---|---|---|---|
| **BUG-001** | Cảnh báo LogBox require cycle trong theme | P3 | Dev A (Mobile) | **RESOLVED** | Đã tách hàm `setActivePaletteName` trong `colors.ts` và thiết lập tại `index.ts` để gỡ bỏ vòng lặp require cycle. Không còn cảnh báo. |
| **BUG-002** | Thiếu nạp các biến thể phụ của font Nunito | P3 | Dev A (Mobile) | **RESOLVED** | Đã nạp đầy đủ 7 biến thể Nunito (`Nunito_500Medium`, `Nunito_600SemiBold_Italic`, `Nunito_900Black`...) trong `App.tsx` và `jest.setup.js`. |
| **BUG-003** | Thiếu backend endpoints Xóa/Sửa bài viết (S6a) | P2 | Dev B (Backend) | **OPEN (Backend)** | Chức năng S6a tạm thời được đánh dấu `BLOCKED-BACKEND`. Phía Mobile đã có sẵn unit test và service signature. Khi Dev B triển khai endpoint `DELETE /posts/:id` và `PATCH /posts/:id`, Mobile chỉ cần kết nối và mở giao diện. |

---

## 2. Chi Tiết Các Hạn Chế Còn Mở & Hướng Dẫn Vận Hành

### Vấn đề 1: Backend Endpoints cho S6a (Xóa & Sửa bài viết)
- **Mã định danh:** BUG-003
- **Mức độ nghiêm trọng:** P2 (Tính năng nhỏ mở rộng Tuần 4)
- **Phạm vi tác động:** Chỉ ảnh hưởng tới tính năng tùy chọn S6a. Không ảnh hưởng đến các luồng core MVP (Auth, Create Post, Feed, Like, Comment, Search, Follow, Notifications, Profile, Bookmark S6b, Settings S6c).
- **Trạng thái hiện tại:** Phía Mobile đã chuẩn bị sẵn test case `week4_features.test.ts` (S6a), tạm thời chưa nối vào giao diện `PostDetailScreen.tsx` do file này được bảo vệ bởi Rule H của `verify-ui.mjs` và backend chưa có route.
- **Workaround:** Người dùng quản lý bài viết thông qua danh sách bài đã đăng trên Profile.

### Vấn đề 2: Phiên Bản Chạy Kiểm Thử Hiện Tại Là MOCK Mode
- **Hiện trạng:** Biến `USE_MOCK = true` và `BYPASS_AUTH_FOR_TESTING = true` được duy trì theo đúng cam kết Rule 1 (Scope) và chưa có chỉ đạo chuyển đổi sang LIVE.
- **Tác động:** Dữ liệu demo (Feed, Search, Comments, Notifications) được nạp từ mock store trong bộ nhớ.
- **Workaround:** Dữ liệu hoạt động 100% ổn định kể cả khi mất mạng internet (Resilience offline).
