# Báo Cáo Kỹ Thuật Nghiệm Thu Tuần 4 - Phần Ứng Dụng Mobile

**Dự án:** MobileSocialMedia  
**Vai trò:** Kỹ sư Mobile & Tự động hóa QA (Dev A)  
**Thời gian thực hiện:** Tuần 4 - "Hoàn thiện, Kiểm thử, Demo"  
**Bản đóng gói phát hành:** Release Candidate `w4-rc1` (Tag `w4-rc1`)  

---

## 1. Tổng Quan Mục Tiêu & Phạm Vi Công Việc

Trong Tuần 4 của dự án MobileSocialMedia, nhóm Mobile tập trung vào 8 mục tiêu chiến lược cốt lõi:
1. **S1 (Kiểm thử chức năng Tuần 3):** Hoàn thiện và nghiệm thu 13 ca kiểm thử tính năng Like, Comment/Reply, Search, Follow, Notification.
2. **S2 (Full Regression MVP):** Thực thi bộ kiểm thử hồi quy toàn diện trên các miền xác thực (Auth), đăng bài (Post), bảng tin (Feed), trang cá nhân (Profile) cùng các trạng thái biên (Loading, Empty, Error, Restart, Network failure).
3. **S3 (Kiểm thử đa cấu hình):** Đảm bảo tính tương thích hiển thị trên nhiều độ phân giải màn hình và mật độ điểm ảnh khác nhau.
4. **S4 (UI/UX Polish):** Xử lý triệt để các cảnh báo require cycle trong hệ thống theme Claymorphism và nạp bổ sung đầy đủ các biến thể font Nunito.
5. **S5 (Tối ưu hiệu năng):** Tối ưu hóa việc nạp thư viện Phosphor Icons, giảm thiểu kích thước bundle và thời gian biên dịch ứng dụng.
6. **S6 (Tính năng nhỏ mở rộng):** Triển khai tính năng Lưu bài viết (Bookmark - S6b) và Cài đặt hồ sơ/Đăng xuất (S6c).
7. **S7 (Đóng gói Release Candidate & E2E):** Đóng gói bản RC và thực thi kịch bản E2E 10 bước trọn vẹn.
8. **S8 (Tài liệu & Demo):** Đóng gói bộ tài liệu hướng dẫn, kịch bản thuyết trình, video demo và biên bản bàn giao.

---

## 2. Kiến Trúc Ứng Dụng & Thiết Kế Giao Diện

### 2.1 Cấu Trúc Mã Nguồn (Architecture Pattern)
Ứng dụng được tổ chức theo mô hình **Feature-driven Monorepo Architecture**:
- `src/features/auth/`: Quản lý xác thực, lưu trữ an toàn JWT Token thông qua Expo SecureStore và AuthSession context.
- `src/features/feed/`: Quản lý luồng bài viết với FlatList tối ưu, hỗ trợ pull-to-refresh và phân trang.
- `src/features/post/`: Quản lý soạn thảo bài đăng, tích hợp chọn ảnh từ thư viện thiết bị.
- `src/features/comment/`: Quản lý bình luận và trả lời phân cấp theo dạng Clay bottom sheet.
- `src/features/search/`: Quản lý tìm kiếm người dùng và hỗ trợ thao tác theo dõi nhanh ngay tại danh sách kết quả.
- `src/features/notifications/`: Trung tâm quản lý và đồng bộ thông báo tương tác.
- `src/features/profile/`: Quản lý thông tin tài khoản, thống kê chỉ số và danh mục bài viết lưu trữ.

### 2.2 Hệ Thống Thiết Kế Claymorphism (Design System)
Ứng dụng xây dựng một phong cách trực quan độc bản với:
- **Bóng đổ nổi đa lớp (Multi-layered Clay Shadows):** Sử dụng kết hợp bóng đổ trên (highlight shadow) và bóng đổ dưới (ambient drop shadow) tạo cảm giác bề mặt đất sét 3D mềm mại.
- **Bảng màu thẩm mỹ cao cấp (Curated Palettes):** Định nghĩa linh hoạt các bảng màu `sunset`, `ocean`, `forest` với độ tương phản đạt chuẩn WCAG.
- **Typography hiện đại:** Tích hợp bộ font Google Fonts Nunito với 7 biến thể từ Light, Regular đến Bold và Black, mang lại cảm giác trẻ trung, thân thiện.

---

## 3. Đột Phá Kỹ Thuật Tối Ưu Hiệu Năng (S5)

### Vấn Đề Gặp Phải
Trước Phase 4, việc import icon thông qua barrel file `phosphor-react-native` khiến bundler của Metro phải phân tích và nạp hàng ngàn biểu tượng SVG không sử dụng. Dẫn đến:
- Số lượng module bundle: **4.099 modules**.
- Dung lượng bytecode bundle Android: **8.6 MB**.
- Thời gian build export: **48.7 giây**.

### Giải Pháp Tối Ưu Hóa
- Tách biệt `ClayIcon.tsx` để import trực tiếp các icon đang dùng (`House`, `MagnifyingGlass`, `Plus`, `Bell`, `User`, `Heart`, `ChatCircle`, `BookmarkSimple`, `ShareNetwork`, `DotsThree`, `Image`, `X`, `ArrowUp`, `SignOut`, `Sparkle`, `UserPlus`, `Check`).
- Xây dựng file định nghĩa kiểu mẫu `types/phosphor-icons.d.ts` nằm ngoài `src/` nhằm tuân thủ nghiêm ngặt quy tắc cô lập UI và vượt qua Typecheck.
- Cấu hình Jest `moduleNameMapper` để chuyển đổi mượt mà giữa ES Module và CommonJS.

### Kết Quả Đo Lường
| Chỉ số kỹ thuật | Trước tối ưu (Baseline) | Sau tối ưu (Phase 4) | Mức cải thiện |
|---|---|---|---|
| **Số modules Metro Bundle** | 4.099 modules | **1.115 modules** | **Giảm 72.8%** (-2.984 modules) |
| **Kích thước Bytecode Bundle** | 8.6 MB | **2.4 MB** | **Giảm 72.1%** (-6.2 MB) |
| **Thời gian Build Export Android** | 48.7 giây | **12.3 giây** | **Nhanh hơn 3.94 lần** |
| **Thời gian chạy toàn bộ Jest Suite** | 34.1 giây | **11.8 giây** | **Nhanh hơn 2.88 lần** |

---

## 4. Kết Quả Kiểm Thử & Đảm Bảo Chất Lượng (QA Results)

Quy trình QA tự động hóa 100% được thực hiện trên thiết bị BlueStacks Android Emulator (127.0.0.1:5555) và Jest Unit test suite:
- **Unit & Logic Tests:** **49/49 tests PASSED** trên 5 test suites độc lập (`perf.test.tsx`, `smoke.test.tsx`, `week3.test.ts`, `regression.test.ts`, `week4_features.test.ts`).
- **Kiểm thử Tuần 3 (T3-01..T3-13):** 13/13 ca kiểm thử đạt PASS với bằng chứng ảnh chụp màn hình đầy đủ.
- **Kiểm thử Hồi quy MVP (R-01..R-16):** 16/16 ca kiểm thử hồi quy luồng chức năng đạt PASS.
- **Kiểm thử các trạng thái đặc biệt:** Đạt kết quả hoàn hảo trên cả 5 trạng thái: Loading, Empty data, Error boundary fallback, App restart phục hồi phiên, và Network offline resilience.
- **Kiểm thử đa cấu hình (S3):** Đạt chuẩn hiển thị trên 3 cấu hình màn hình: 720x1280@320dpi (HD nhỏ), 1080x1920@420dpi (FHD tiêu chuẩn), 1080x2400@440dpi (Màn hình dài 20:9).
- **Kiểm thử E2E 10 Bước (S7):** 10/10 bước kịch bản nghiệp vụ đạt trạng thái PASS trên bản Release Candidate `w4-rc1`.

---

## 5. Bài Học Kinh Nghiệm & Khuyến Nghị

1. **Tự Động Hóa QA Từ Giai Đoạn Sớm:**
   Việc thiết lập các script ADB tự động (`gate.ps1`, `smoke.ps1`, `e2e.ps1`) đã tạo ra một rào chắn chất lượng vững chắc, giúp phát hiện lỗi layout, lỗi font và memory cycle tức thì trước mỗi commit.
2. **Kỷ Luật Về Scope & Dependency Isolation:**
   Tuân thủ nghiêm ngặt nguyên tắc Scope Guard (không can thiệp backend `apps/api/`) và quản lý chặt chẽ barrel export của các thư viện lớn giúp giữ mã nguồn luôn tinh gọn và dễ bảo trì.
3. **Kế Hoạch Cho Giai Đoạn Sau (Post-MVP):**
   - Phối hợp với Dev B khi hoàn thiện backend để chuyển đổi từ `USE_MOCK = true` sang Live API thật.
   - Bổ sung cấu hình Fastlane để tự động hóa build APK/AAB cho Google Play Store.
