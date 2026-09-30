# Biên Bản Chuyển Giao Cho Dev B (Backend Handoff)

**Dự án:** MobileSocialMedia  
**Bên chuyển giao:** Dev A (Mobile Engineer & Automated QA)  
**Bên tiếp nhận:** Dev B (Backend Engineer)  
**Giai đoạn:** Nghiệm thu Tuần 4 & Chuẩn bị Live Integration  

---

## 1. Danh Sách Yêu Cầu & Bug Thuộc Phạm Vi Backend (Action Items for Dev B)

Phía Mobile (Dev A) đã hoàn thành nghiệm thu toàn bộ 8 phase với 100% test pass. Dưới đây là các yêu cầu và đầu việc cần Dev B thực hiện để ứng dụng có thể kết nối Live REST API đầy đủ:

### 1.1 Triển Khai Endpoints Quản Lý Bài Viết (BUG-003 - S6a)
- **Endpoint 1: Xóa bài viết**
  - **Method:** `DELETE`
  - **Route:** `/api/posts/:id`
  - **Yêu cầu:** Xác thực JWT token của người dùng hiện tại (chỉ tác giả bài viết mới có quyền xóa). Xóa cascades bình luận và lượt thích liên quan.
  - **Response mong đợi:** `200 OK` với `{ success: true, message: "Post deleted" }` hoặc `204 No Content`.
- **Endpoint 2: Chỉnh sửa bài viết**
  - **Method:** `PATCH` hoặc `PUT`
  - **Route:** `/api/posts/:id`
  - **Payload:** `{ content: string, mediaUrls?: string[] }`
  - **Response mong đợi:** `200 OK` với object bài viết đã cập nhật `Post`.

### 1.2 Hỗ Trợ Tải File Ảnh Đa Phương Tiện (Multipart/Form-Data)
- **Endpoint:** `POST /api/upload` hoặc `POST /api/posts`
- **Mô tả:** Hỗ trợ upload ảnh thật từ thiết bị di động (React Native FormData). Hiện tại mock layer đang sử dụng URL tĩnh `https://images.unsplash.com/...`.

---

## 2. Các Hạng Mục Ngoài Scope Dev A (Cần Dev B Đảm Trách Cho Báo Cáo Chung)

Theo phân công trách nhiệm Tuần 4, các hạng mục sau thuộc quyền sở hữu của Dev B và cần được bổ sung vào bộ tài liệu tổng kết dự án của nhóm:
1. **Triển Khai Hạ Tầng & Deploy Backend:** Cấu hình môi trường Production cho Express/Node.js backend, container Docker hoặc máy chủ cloud (Render, Railway, Fly.io, AWS...).
2. **Tài Liệu Đặc Tả API (API Documentation):** Cập nhật Swagger/OpenAPI hoặc file Markdown mô tả đầy đủ các request/response schemas, mã lỗi HTTP và token authentication headers.
3. **Tối Ưu Hóa Cơ Sở Dữ Liệu & Truy Vấn (Database & Query Optimization):** Đánh chỉ mục (Index) trên các trường khóa ngoại `userId`, `postId`, `createdAt` trong cơ sở dữ liệu để đảm bảo tốc độ phản hồi khi tải feed phân trang.
4. **Báo Cáo Kỹ Thuật Phía Backend:** Soạn thảo phần kiến trúc hệ thống backend, mô hình cơ sở dữ liệu (ERD), và số liệu kiểm thử tải/hiệu năng server để ghép vào slide và báo cáo tổng kết môn học.

---

## 3. Checklist Tích Hợp Chuyển Đổi Sang LIVE Mode (Live Integration Checklist)

Khi Dev B hoàn tất các yêu cầu trên và backend server chạy ổn định:
1. Đặt lại biến `USE_MOCK = false` trong toàn bộ các service tại `apps/mobile/src/features/*/services/*.ts`.
2. Đặt `BYPASS_AUTH_FOR_TESTING = false` trong `apps/mobile/src/features/auth/authSession.tsx`.
3. Cấu hình biến môi trường `EXPO_PUBLIC_API_URL` trỏ tới IP/domain thật của backend server.
4. Chạy lại bộ script QA tự động `apps/mobile/scripts/qa/gate.ps1` và `smoke.ps1` để nghiệm thu tích hợp Live.
