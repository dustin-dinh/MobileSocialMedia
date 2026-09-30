# Kịch Bản Trình Diễn Ứng Dụng (Demo Script) - MobileSocialMedia

Kịch bản demo sản phẩm MobileSocialMedia cho buổi bảo vệ nghiệm thu Tuần 4. Kịch bản được thiết kế theo 10 bước E2E tiêu chuẩn, khớp 100% với kịch bản kiểm thử tự động trên bản đóng gói Release Candidate `w4-rc1`.

---

## 1. Thông Tin Chung & Dữ Liệu Chuẩn Bị (Demo Context)

- **Thời lượng dự kiến:** 5 - 7 phút.
- **Môi trường demo chính:** BlueStacks Android Emulator (1080x1920@420dpi) kết nối Expo Go SDK 57 qua Metro Dev Server (`127.0.0.1:8081`).
- **Tài khoản Demo A:** `nhatluan` (Tên: *Luan Dinh*, Email: `luan@example.com`, Vai trò: Kỹ sư Mobile)
- **Tài khoản Demo B:** `sarahchen` (Tên: *Sarah Chen*, Email: `sarah@example.com`, Vai trò: Nhiếp ảnh gia/Creator)
- **Bài viết mẫu:** Bài đăng ảnh cảnh đẹp thiên nhiên với chú thích "Exploring the beautiful landscapes today! ✨"

---

## 2. Chi Tiết Kịch Bản 10 Bước (10-Step Timeline)

| Bước | Phân đoạn | Thời lượng | Thao tác thực hiện | Lời thoại thuyết minh (Script Voiceover) | Bằng chứng kiểm thử |
|---|---|---|---|---|---|
| **1** | **Khởi động & Phiên làm việc A** | 30s | Mở app trên BlueStacks, hiển thị giao diện Claymorphism mềm mại, chào đón User A. | *"Xin chào thầy cô và các bạn. Đây là MobileSocialMedia với ngôn ngữ thiết kế Claymorphism độc bản. Tài khoản A hiện đang đăng nhập vào phiên làm việc."* | [e2e-step-01-auth-a.png](file:///c:/Users/nhatluan/Documents/MobileProject/docs/w4/evidence/e2e-step-01-auth-a.png) |
| **2** | **Tạo bài viết mới (Account B)** | 40s | Nhấn nút `(+)` nổi bật ở chính giữa bottom bar, gõ caption, chọn ảnh, nhấn Đăng bài. | *"Chúng ta cùng xem quy trình tạo bài viết mới với nút bấm nổi khối 3D. Người dùng có thể đính kèm ảnh và xuất bản tức thì."* | [e2e-step-02-create-post-b.png](file:///c:/Users/nhatluan/Documents/MobileProject/docs/w4/evidence/e2e-step-02-create-post-b.png) |
| **3** | **Tìm kiếm & Theo dõi** | 35s | Chuyển sang Tab Kính lúp, gõ 'sarah', danh sách hiển thị Sarah Chen, nhấn nút 'Follow'. | *"Tại màn hình tìm kiếm, hệ thống tìm tức thì theo username hoặc tên hiển thị. Nút Follow cho phép theo dõi trực tiếp từ danh sách mà không cần mở profile."* | [e2e-step-03-search-follow-b.png](file:///c:/Users/nhatluan/Documents/MobileProject/docs/w4/evidence/e2e-step-03-search-follow-b.png) |
| **4** | **Lướt Bảng tin (Feed)** | 30s | Quay lại Tab Feed (House icon), cuộn mượt mà xem các bài đăng của Sarah Chen. | *"Quay trở lại Home Feed, bài viết mới được đưa vào luồng bài đăng. Bố cục thẻ bài với hiệu ứng bóng đổ đôi mềm mắt tạo cảm giác xúc giác chân thực."* | [e2e-step-04-feed-view-b.png](file:///c:/Users/nhatluan/Documents/MobileProject/docs/w4/evidence/e2e-step-04-feed-view-b.png) |
| **5** | **Like & Bình luận** | 45s | Nhấn Like (trái tim chuyển đỏ), nhấn Comment mở bottom sheet, gõ bình luận và gửi. | *"Tương tác xã hội phản hồi tức thời: trái tim đỏ nhũ khi thả tim, và modal bình luận dạng Clay sheet trượt lên tinh tế để trao đổi thảo luận."* | [e2e-step-05-like-comment-b.png](file:///c:/Users/nhatluan/Documents/MobileProject/docs/w4/evidence/e2e-step-05-like-comment-b.png) |
| **6** | **Trung tâm Thông báo** | 30s | Chuyển sang Tab Chuông, hiển thị thông báo ai vừa like, comment hoặc follow. | *"Mọi tương tác đều được đồng bộ về tab Thông báo với đầy đủ avatar, tên người tác động và mốc thời gian rõ ràng."* | [e2e-step-06-notifications-b.png](file:///c:/Users/nhatluan/Documents/MobileProject/docs/w4/evidence/e2e-step-06-notifications-b.png) |
| **7** | **Đọc thông báo** | 20s | Nhấn vào thông báo để chuyển trạng thái đã đọc. | *"Chạm vào thông báo sẽ đánh dấu đã đọc và giữ trạng thái bền vững."* | [e2e-step-07-read-notification.png](file:///c:/Users/nhatluan/Documents/MobileProject/docs/w4/evidence/e2e-step-07-read-notification.png) |
| **8** | **Trang cá nhân & Bookmark** | 40s | Chuyển Tab Profile, kiểm tra số người theo dõi, số bài đăng, và kho bài lưu (S6b). | *"Màn hình Profile tổng hợp đầy đủ số liệu cá nhân, danh mục bài viết và tính năng Bookmark vừa được bổ sung tại Tuần 4."* | [e2e-step-08-profile-state.png](file:///c:/Users/nhatluan/Documents/MobileProject/docs/w4/evidence/e2e-step-08-profile-state.png) |
| **9** | **Kiểm thử khôi phục phiên (Restart)** | 35s | Tắt ứng dụng đột ngột (force-stop), sau đó mở lại ngay lập tức. | *"Chúng ta kiểm chứng tính bền bỉ của ứng dụng: tắt đột ngột và mở lại, phiên đăng nhập và dữ liệu được khôi phục ngay lập tức, không hề có màn hình đỏ."* | [e2e-step-09-session-persistence.png](file:///c:/Users/nhatluan/Documents/MobileProject/docs/w4/evidence/e2e-step-09-session-persistence.png) |
| **10** | **Cài đặt & Đăng xuất (S6c)** | 30s | Vào Profile, chọn Đăng xuất an toàn. | *"Cuối cùng, người dùng có thể tùy chỉnh giao diện và thực hiện Đăng xuất để xóa token an toàn."* | [e2e-step-10-logout-auth.png](file:///c:/Users/nhatluan/Documents/MobileProject/docs/w4/evidence/e2e-step-10-logout-auth.png) |

---

## 3. Kế Hoạch Dự Phòng Sự Cố (Contingency & Fallback Plans)

Nhằm đảm bảo buổi trình diễn diễn ra liên tục, không bị gián đoạn trước hội đồng, nhóm đã chuẩn bị sẵn 3 phương án dự phòng (Plans A, B, C):

### Phương án A: Demo Trực Tiếp Trên BlueStacks Emulator (Ưu tiên số 1)
- Thiết bị BlueStacks chạy ổn định ở cổng ADB `127.0.0.1:5555`.
- Chạy lệnh tự động hoặc thao tác chuột trực tiếp.

### Phương án B: Chế Độ Mock Cách Ly (Khi Mạng Internet hoặc Backend bị sập)
- **Tình huống:** Mất kết nối internet phòng họp hoặc server backend của Dev B không phản hồi.
- **Giải pháp:** Ứng dụng đã được tích hợp sẵn tầng **Mock Service** hoàn chỉnh độc lập (`USE_MOCK = true`). Toàn bộ luồng dữ liệu 10 bước hoạt động 100% ngoại tuyến trên bộ nhớ local mà không yêu cầu mạng.

### Phương án C: Trình Chiếu Video Demo Đã Quay Sẵn (Khi Thiết Bị Máy Tính Gặp Sự Cố)
- **Tình huống:** Máy tính demo gặp trục trặc BlueStacks hoặc Expo Go lỗi kết nối.
- **Giải pháp:** Sử dụng ngay video demo đã được quay trực tiếp từ máy ảo bằng lệnh `screenrecord`:
  - **Đường dẫn file video:** [demo-app.mp4](file:///c:/Users/nhatluan/Documents/MobileProject/docs/w4/evidence/demo-app.mp4)
  - Video ghi lại đầy đủ các bước thao tác, chuyển tab, like, comment, bookmark, search và profile với độ phân giải mượt mà.
