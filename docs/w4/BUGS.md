# Bug Tracking - Week 4 (MobileSocialMedia)

## Severity Levels:
- **P0**: App/backend không chạy, crash khởi động, mất dữ liệu nghiêm trọng. (Ưu tiên giải quyết ngay lập tức).
- **P1**: Luồng core bị hỏng (Auth, Create Post, Feed, Like, Comment, Search, Follow).
- **P2**: Chức năng có lỗi nhưng có workaround khả dĩ. Sửa trong giới hạn thời gian cho phép.
- **P3**: Polish UI/UX, warnings, font thiếu, canh lề, micro-interaction. (Giải quyết ở Phase 4).

---

## Danh sách Bugs

| Bug ID | Title | Severity | Owner | Phase phát hiện | Trạng thái | Mô tả & Nguyên nhân | Cách khắc phục | Retest Evidence |
|---|---|---|---|---|---|---|---|---|
| **BUG-001** | Require cycle warning trong theme | P3 | Dev A | Phase 0 | OPEN | Cảnh báo vàng LogBox: `Require cycle: src/theme/index.ts -> src/theme/clay.ts -> src/theme/index.ts` do import chéo giữa colors, clay và index. | Tách/điều chỉnh import trong `src/theme/` không đổi giá trị theme (Phase 4). | - |
| **BUG-002** | Font Nunito phụ chưa được load | P3 | Dev A | Phase 0 | OPEN | Các biến thể `Nunito_500Medium`, `Nunito_600SemiBold_Italic`, `Nunito_900Black` được khai báo sử dụng nhưng chưa nạp trong `useFonts` tại `src/App.tsx`. | Nạp thêm các font hoặc quy về font đã nạp tương đương trong typography (Phase 4). | - |

---

## Bugs chuyển giao Dev B (Backend)
*(Chưa có bug backend nào được ghi nhận)*
