# Hướng Dẫn Sử Dụng Ứng Dụng MobileSocialMedia (User Guide)

Tài liệu hướng dẫn người dùng cuối và kiểm thử viên thao tác các tính năng trên ứng dụng mạng xã hội **MobileSocialMedia** (Tuần 4 - Phiên bản Release Candidate `w4-rc1`). Ứng dụng mang phong cách thiết kế **Claymorphism** cao cấp với các bề mặt mềm mại, bóng đổ nổi khối 3D và màu sắc hiện đại.

---

## 1. Đăng Nhập & Đăng Ký (Authentication)

Ứng dụng hỗ trợ đăng nhập nhanh hoặc đăng ký tài khoản người dùng mới:
- **Đăng ký:** Nhập Họ tên hiển thị, Email hợp lệ, Mật khẩu (tối thiểu 6 ký tự).
- **Đăng nhập:** Nhập Email và Mật khẩu đã đăng ký.
- **Chế độ kiểm thử (Bypass Auth):** Khi bật cờ phát triển, ứng dụng tự động duy trì phiên đăng nhập của tài khoản kỹ sư Dev A (`nhatluan`).

![Màn hình Auth & Khởi động](/c:/Users/nhatluan/Documents/MobileProject/docs/w4/evidence/e2e-step-01-auth-a.png)
*(Minh họa: [e2e-step-01-auth-a.png](file:///c:/Users/nhatluan/Documents/MobileProject/docs/w4/evidence/e2e-step-01-auth-a.png))*

---

## 2. Lướt Bảng Tin (Home Feed)

Màn hình chính hiển thị dòng bài viết đa phương tiện từ bạn bè và cộng đồng:
- **Kéo để làm mới (Pull-to-Refresh):** Vuốt từ trên xuống để cập nhật những bài viết mới nhất.
- **Phân trang vô tận:** Cuộn xuống dưới cùng để tải thêm các bài viết cũ hơn.
- **Nút tải bài mới (New Posts Floating Pill):** Hiển thị pill nổi Clay pill khi có bài viết mới chưa xem.

![Dòng bài viết trên Home Feed](/c:/Users/nhatluan/Documents/MobileProject/docs/w4/evidence/current_feed.png)
*(Minh họa: [current_feed.png](file:///c:/Users/nhatluan/Documents/MobileProject/docs/w4/evidence/current_feed.png))*

---

## 3. Tương Tác Bài Viết: Like, Lưu Trữ (Bookmark) & Bình Luận

Mỗi thẻ bài viết (Clay Post Card) hỗ trợ đầy đủ các thao tác xã hội:
- **Thích bài viết (Like/Unlike):** Nhấn vào biểu tượng trái tim. Trái tim chuyển sang màu đỏ nhũ và tăng biến đếm tức thì.
- **Lưu bài viết (Bookmark - Tính năng S6b):** Nhấn vào biểu tượng Bookmark ở góc phải chân thẻ bài viết. Icon sẽ đổi sang màu vàng nhũ khối đặc để đánh dấu đã lưu vào kho cá nhân.
- **Bình luận (Comments & Replies):** Nhấn vào biểu tượng bóng thoại để mở **Clay Comment Bottom Sheet**. Bạn có thể gõ nội dung bình luận hoặc nhấn "Trả lời" trực tiếp dưới bình luận của người khác.

![Tương tác Thích bài viết](/c:/Users/nhatluan/Documents/MobileProject/docs/w4/evidence/t3-01-like.png)
*(Minh họa Like: [t3-01-like.png](file:///c:/Users/nhatluan/Documents/MobileProject/docs/w4/evidence/t3-01-like.png))*

![Lưu bài viết Bookmark](/c:/Users/nhatluan/Documents/MobileProject/docs/w4/evidence/s6b-bookmark.png)
*(Minh họa Bookmark: [s6b-bookmark.png](file:///c:/Users/nhatluan/Documents/MobileProject/docs/w4/evidence/s6b-bookmark.png))*

![Bình luận bài viết](/c:/Users/nhatluan/Documents/MobileProject/docs/w4/evidence/t3-03-comment.png)
*(Minh họa Comment: [t3-03-comment.png](file:///c:/Users/nhatluan/Documents/MobileProject/docs/w4/evidence/t3-03-comment.png))*

---

## 4. Đăng Bài Viết Mới (Create Post)

- Nhấn vào nút tròn nổi Clay nổi bật có dấu cộng `(+)` nằm chính giữa thanh điều hướng đáy.
- Nhập nội dung suy nghĩ hoặc câu chuyện của bạn vào ô văn bản.
- Nhấn nút "Chọn ảnh" để đính kèm media đa phương tiện từ thiết bị.
- Nhấn "Đăng bài" để xuất bản bài viết lên Bảng tin.

![Màn hình Đăng bài viết](/c:/Users/nhatluan/Documents/MobileProject/docs/w4/evidence/r-05-create-post.png)
*(Minh họa: [r-05-create-post.png](file:///c:/Users/nhatluan/Documents/MobileProject/docs/w4/evidence/r-05-create-post.png))*

---

## 5. Tìm Kiếm Người Dùng & Theo Dõi (Search & Follow)

- Chuyển sang Tab Tìm kiếm (biểu tượng Kính lúp).
- Gõ tên người dùng (username) hoặc tên hiển thị (display name) vào thanh tìm kiếm Clay phía trên.
- Nhấn trực tiếp vào nút **Theo dõi (Follow)** ngay trên danh sách kết quả tìm kiếm mà không cần phải chuyển màn hình. Nút sẽ lập tức chuyển sang trạng thái "Đang theo dõi" (Following).

![Màn hình Tìm kiếm & Theo dõi](/c:/Users/nhatluan/Documents/MobileProject/docs/w4/evidence/t3-05-search.png)
*(Minh họa: [t3-05-search.png](file:///c:/Users/nhatluan/Documents/MobileProject/docs/w4/evidence/t3-05-search.png))*

---

## 6. Trung Tâm Thông Báo (Notifications)

- Nhấn vào biểu tượng Quả chuông trên thanh điều hướng để mở danh sách thông báo.
- Xem danh sách ai vừa thích bài viết của bạn, ai vừa bình luận hoặc ai vừa nhấn theo dõi bạn.
- Nhấn vào từng thông báo để đánh dấu đã đọc.

![Màn hình Thông báo](/c:/Users/nhatluan/Documents/MobileProject/docs/w4/evidence/t3-08-notif-display.png)
*(Minh họa: [t3-08-notif-display.png](file:///c:/Users/nhatluan/Documents/MobileProject/docs/w4/evidence/t3-08-notif-display.png))*

---

## 7. Trang Cá Nhân & Cài Đặt (Profile & Settings - Tính năng S6c)

- Nhấn vào biểu tượng Người dùng ở góc phải thanh điều hướng đáy.
- **Thống kê:** Xem tổng số bài viết đã đăng, số người theo dõi (Followers) và đang theo dõi (Following).
- **Bộ lọc nội dung:** Chuyển qua lại giữa các tab Bài viết, Đa phương tiện, Thích.
- **Tùy chỉnh & Cài đặt (S6c):** Nhấn nút "Chỉnh sửa hồ sơ" hoặc chọn "Đăng xuất" (Sign out) để xóa phiên làm việc an toàn.

![Màn hình Profile & Cài đặt](/c:/Users/nhatluan/Documents/MobileProject/docs/w4/evidence/s6c-settings.png)
*(Minh họa: [s6c-settings.png](file:///c:/Users/nhatluan/Documents/MobileProject/docs/w4/evidence/s6c-settings.png))*
