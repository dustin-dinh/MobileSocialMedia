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
*(Sẽ cập nhật ở Phase 3)*

---

## 4. Kết quả Đa cấu hình & Hiệu năng (S3, S4, S5)
*(Sẽ cập nhật ở Phase 4)*

---

## 5. Kết quả Kịch bản E2E 10 Bước (S7)
*(Sẽ cập nhật ở Phase 6)*
