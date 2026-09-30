# Dàn Ý Trình Chiếu Báo Cáo - Phần Ứng Dụng Mobile (Slide Outline)

Dàn ý nội dung slide thuyết trình bảo vệ Tuần 4 dự án **MobileSocialMedia** (Phần việc Dev A - Mobile & Tự Động Hóa QA).

---

## Slide 1: Trang Tiêu Đề
- **Tiêu đề:** MobileSocialMedia - Ứng Dụng Mạng Xã Hội Đa Phương Tiện
- **Phong cách thiết kế:** Độc bản Claymorphism (Soft 3D, Tactile UI)
- **Người thực hiện:** Dev A (Mobile Engineer & Automated QA)
- **Nội dung:** Tổng kết Nghiệm thu Tuần 4 - "Hoàn thiện, Kiểm thử & Tối ưu hóa"

---

## Slide 2: Kiến Trúc Ứng Dụng & Công Nghệ Cốt Lõi (Architecture & Tech Stack)
- **Nền tảng:** React Native 0.86.3, Expo SDK 57 (New Architecture ready).
- **Hệ thống gói:** Monorepo quản lý bằng `pnpm` (Corepack) với cơ chế hoisted node-linker tối ưu bộ nhớ.
- **Mô hình kiến trúc:**
  - **Feature-based Architecture:** Chia nhỏ theo từng miền chức năng (`features/auth`, `features/feed`, `features/post`, `features/comment`, `features/search`, `features/notifications`, `features/profile`).
  - **Clean Service Layer:** Phân tách rõ ràng giữa UI Components, State Management và Service Layer (hỗ trợ chuyển đổi liền mạch giữa Live REST API và Isolated Mock Layer).
  - **Clay Design System:** Hệ thống theme tập trung (`colors`, `clay`, `typography`, `spacing`), 100% tuân thủ thiết kế bóng đổ nổi 3D đa lớp.

---

## Slide 3: Hệ Thống Màn Hình & Tính Năng Trọng Tâm
- **Bảng tin (Home Feed):** Cuộn mượt mà, phân trang thông minh, hỗ trợ bài đăng văn bản và hình ảnh.
- **Tương tác đa chiều:** Thả tim tức thì, bình luận lồng nhau (Replies), và Lưu bài viết (Bookmark - S6b).
- **Tìm kiếm đa năng:** Tra cứu theo username và tên hiển thị, hỗ trợ Follow trực tiếp từ danh sách tìm kiếm.
- **Trung tâm thông báo:** Thông báo hoạt động tương tác, đánh dấu đã đọc chuẩn xác.
- **Hồ sơ cá nhân & Cài đặt (S6c):** Thống kê người theo dõi, danh mục bài viết, chỉnh sửa hồ sơ và đăng xuất an toàn.

---

## Slide 4: Quy Trình QA Tự Động & G-BASE Gate Protocol
- **Triết lý kiểm thử:** Evidence First - Không tuyên bố PASS khi không có bằng chứng rõ ràng.
- **Hạ tầng tự động hóa:**
  - Bộ script PowerShell tự động tương tác thiết bị Android qua ADB (`smoke.ps1`, `adb-helpers.ps1`, `gate.ps1`, `e2e.ps1`).
  - G-BASE Protocol 4 chốt chặn bắt buộc trước mỗi phase:
    1. Scope Guard: Cấm sửa đổi backend (`apps/api/`).
    2. TypeScript Strict Typecheck: 0 lỗi.
    3. Jest Unit Suite: 49/49 passed.
    4. Android Export Bundle: Build thành công không cảnh báo lệch gói.
- **Kết quả:** 100% test cases tự động hóa (44/44 ca kiểm thử) đạt trạng thái PASS, 0 bug P0/P1 mở.

---

## Slide 5: Đột Phá Tối Ưu Hiệu Năng (Performance Engineering - S5)
- **Vấn đề nhận diện:** Việc import barrel file của `phosphor-react-native` kéo theo toàn bộ hàng nghìn icon không sử dụng vào bundle, khiến Metro bundle lên tới 4.099 modules, dung lượng bytecode 8.6MB và thời gian build lâu (~48.7s).
- **Giải pháp kỹ thuật:** Chuyển đổi import trực tiếp từng file icon Phosphor tương ứng qua cấu trúc CommonJS/ESM độc lập, bổ sung typing definition an toàn.
- **Kết quả đo lường thực tế:**
  - **Số lượng Modules:** 4.099 -> **1.115 modules** (**Giảm 72.8%**).
  - **Kích thước Bundle:** 8.6 MB -> **2.4 MB** (**Giảm 72.1%**).
  - **Thời gian Build Export:** 48.7s -> **12.3s** (**Nhanh hơn 3.94 lần**).
  - **Thời gian chạy Jest:** 34.1s -> **11.8s** (**Nhanh hơn 2.88 lần**).

---

## Slide 6: Kiểm Thử Đa Cấu Hình Màn Hình (Multi-Device Testing - S3)
- **Phương pháp:** Điều khiển mật độ điểm ảnh và độ phân giải thực tế bằng `wm size` & `wm density` qua ADB trên BlueStacks.
- **3 Cấu hình thực nghiệm:**
  - **Config 1 (720x1280 @ 320dpi):** Màn hình HD kích thước nhỏ, bố cục co giãn chuẩn xác, không bị tràn phím.
  - **Config 2 (1080x1920 @ 420dpi):** Màn hình FHD tiêu chuẩn, hiển thị hoàn hảo.
  - **Config 3 (1080x2400 @ 440dpi):** Màn hình dài tỉ lệ 20:9, Safe Area Top bar & Bottom navigation bảo đảm không che khuất nội dung.

---

## Slide 7: Bài Học Kinh Nghiệm & Hướng Phát Triển
- **Bài học kinh nghiệm:**
  - Việc tự động hóa QA bằng ADB script giúp phát hiện sớm các lỗi tương thích layout và tiết kiệm hàng chục giờ kiểm thử thủ công.
  - Tối ưu hóa bundle và tree-shaking từ sớm mang lại bước nhảy vọt về tốc độ phản hồi và trải nghiệm người dùng.
- **Kế hoạch tiếp theo:**
  - Hỗ trợ Dev B tích hợp API thật khi backend hoàn thành các endpoint chỉnh sửa/xóa bài viết (S6a) và tải media multipart.
  - Đóng gói ứng dụng dạng APK Production độc lập.
