# Decisions Needed - Week 4 (MobileSocialMedia)

Mục này ghi lại toàn bộ các vấn đề cần người dùng/Team Lead quyết định theo Quy tắc 1 & 3:
- Cần đổi cờ `USE_MOCK` hoặc `BYPASS_AUTH_FOR_TESTING` (hiện đang giữ nguyên theo quy tắc).
- Cần quyết định thiết kế vượt ngoài roadmap/scope.
- Các vấn đề phát sinh từ backend (Dev B).

---

## 1. Quyết định về Chế độ Chạy (MODE)
- **Tình trạng xác định ở Phase 0:**
  - `BYPASS_AUTH_FOR_TESTING = true` trong `src/features/auth/authSession.tsx`
  - `USE_MOCK = true` trong tất cả các service: `searchService.ts`, `profileService.ts`, `postService.ts`, `notificationService.ts`, `feedService.ts`, `commentService.ts`
- **Kết luận:** **MODE = MOCK**. Toàn bộ test của Dev A ở Tuần 4 sẽ tập trung kiểm thử hoàn thiện phía Mobile với Mock layer ổn định, các chức năng phụ thuộc server thực tế sẽ được gắn nhãn `BLOCKED-BACKEND (mock)`.
- **Trạng thái:** ĐÃ XÁC ĐỊNH THEO QUY TẮC. Không cần thay đổi cờ.

---

## 2. Danh sách các quyết định đang chờ
*(Hiện tại không có quyết định nào đang chờ)*
