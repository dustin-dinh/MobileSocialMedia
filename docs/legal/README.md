# Tài liệu pháp lý: hướng dẫn dùng

Soạn ngày 01/11/2026, theo code ở nhánh `feat/gap-checklist` (commit `9d1f5b1`).

> Đây là bản soạn để luật sư rà soát, **không phải tư vấn pháp lý**. Không công bố trước khi điền đủ chỗ trống và luật sư xác nhận các mục ở phần 3.

---

## 1. Các tệp

| Tệp | Là gì | Dùng ở đâu |
|---|---|---|
| `chinh-sach-quyen-rieng-tu.md` | Chính sách quyền riêng tư: dữ liệu thu thập, mục đích, căn cứ, chia sẻ, chuyển ra nước ngoài, thời gian lưu, quyền và cách thực hiện, xóa tài khoản, 18+ | Màn đăng ký, Cài đặt > Giới thiệu, URL công khai cho App Store và Google Play |
| `dieu-khoan-su-dung.md` | Điều khoản sử dụng, kiêm "Thỏa thuận cung cấp và sử dụng dịch vụ mạng xã hội" theo Nghị định 147/2024/NĐ-CP | Màn đăng ký (người dùng chấp nhận trước khi dùng), Cài đặt > Giới thiệu, URL công khai |
| `tieu-chuan-cong-dong.md` | Tiêu chuẩn cộng đồng: nội dung bị cấm và cách xử lý báo cáo. Có mục an toàn trẻ em mà Google Play yêu cầu | Liên kết từ Điều khoản, màn báo cáo, URL công khai (Google Play Child Safety Standards) |

Mọi câu mô tả hành vi của ứng dụng đều lấy từ code. Ví dụ:

- `schema.prisma`;
- các module `auth`, `users`, `messages`, `reports`, `admin`, `moderation`, `storage`, `notifications`, `reels`, `stories`;
- `app.json`;
- `MODERATION_PLAN.md`.

Tính năng còn trong kế hoạch (E1, E2, B2, C1) **không** được mô tả như đã có. Ở các chỗ cần thiết, tài liệu ghi "hiện nay", "chưa có", hoặc "làm thủ công".

---

## 2. Chỗ trống phải điền

| Chỗ trống | Điền gì | Có ở |
|---|---|---|
| `[TÊN DOANH NGHIỆP]` | Tên pháp nhân vận hành | Cả 3 tệp |
| `[ĐỊA CHỈ]` | Địa chỉ trụ sở | Chính sách, Điều khoản |
| `[MÃ SỐ DOANH NGHIỆP]` | Mã số doanh nghiệp | Chính sách, Điều khoản |
| `[EMAIL LIÊN HỆ]` | Hộp thư hỗ trợ, báo cáo, kháng nghị | Cả 3 tệp |
| `[EMAIL BẢO VỆ DỮ LIỆU]` | Hộp thư nhận yêu cầu về dữ liệu cá nhân | Chính sách, Điều khoản |
| `[NGÀY HIỆU LỰC]` | Ngày áp dụng, dạng 01/11/2026 | Cả 3 tệp |
| `[TÊN ỨNG DỤNG]` | Tên thương mại. `app.json` hiện là "Mobile Social Network MVP"; email gửi mã ghi "MobileSocialMedia" | Cả 3 tệp |
| `[NHÀ CUNG CẤP LƯU TRỮ TỆP]`, `[VỊ TRÍ LƯU TRỮ TỆP]` | Ví dụ AWS S3 hoặc Cloudflare R2, và vùng đặt dữ liệu | Chính sách 8.1 |
| `[NHÀ CUNG CẤP MÁY CHỦ API]`, `[VỊ TRÍ MÁY CHỦ API]` | Nơi chạy API NestJS | Chính sách 8.1 |
| `[NHÀ CUNG CẤP EMAIL]`, `[VỊ TRÍ NHÀ CUNG CẤP EMAIL]` | Dịch vụ SMTP (`SMTP_HOST`) | Chính sách 8.1 |
| `[THỜI HẠN GIỮ BÁO CÁO]` | Thời gian giữ báo cáo và bản chụp tin nhắn sau khi xử lý (bản kế hoạch E2 đề xuất 12 tháng) | Chính sách 10 |
| `[THỜI HẠN SAO LƯU]` | Thời gian giữ bản sao lưu theo gói Supabase đang dùng | Chính sách 10 |
| `[ĐƯỜNG DẪN XÓA TÀI KHOẢN]` | Trang web hướng dẫn hoặc nhận yêu cầu xóa (Google Play bắt buộc) | Chính sách 13 |
| `[ĐƯỜNG DẪN CHÍNH SÁCH]` | URL HTTPS công khai của chính sách | Chính sách 15 |

Nếu chưa có trang xóa tài khoản trên web, có thể tạm thời đặt `[ĐƯỜNG DẪN XÓA TÀI KHOẢN]` là trang HTTPS mô tả cách gửi email yêu cầu xóa. Google Play chấp nhận một đường dẫn web để "yêu cầu" xóa, nhưng hãy kiểm tra lại khi khai Data safety.

---

## 3. Cần luật sư xác nhận

### Luật Việt Nam

1. **Căn cứ xử lý cho từng nhóm dữ liệu.**
   - Chính sách ghi "sự đồng ý", "thực hiện thỏa thuận", "lợi ích an toàn", "tuân thủ pháp luật".
   - Cần đối chiếu từng nhóm với Điều 9 (đồng ý) và Điều 19 (trường hợp không cần đồng ý) của Luật 91/2025/QH15.
   - Đặc biệt cần xem "lợi ích an toàn của người dùng" có phải căn cứ hợp lệ không.
2. **Dữ liệu nhạy cảm.**
   - Nghị định 356/2025/NĐ-CP, Điều 4 có liệt kê "đời sống riêng tư" và "dữ liệu theo dõi hành vi, hoạt động sử dụng mạng xã hội".
   - Cần xác nhận nội dung tin nhắn và lịch sử xem Reels có thuộc nhóm này không.
   - Nếu có, cần xác nhận các nghĩa vụ thêm: thông báo riêng, có thể phải xin đồng ý riêng.
3. **Hình thức đồng ý.**
   - Hiện nay người dùng chỉ thấy câu "By creating an account you agree to…" (tiếng Anh, không có ô đánh dấu).
   - Luật 91 nói im lặng không phải là đồng ý.
   - Cần xác nhận có phải thêm ô đánh dấu riêng cho chính sách dữ liệu và cho việc chuyển dữ liệu ra nước ngoài không.
4. **Thời hạn trả lời yêu cầu.** Chính sách ghi 2 ngày làm việc / 10 / 15 / 20 ngày theo Nghị định 356/2025/NĐ-CP, Điều 5. Con số lấy từ bản trên luatvietnam.vn, chưa đối chiếu Công báo.
5. **Hồ sơ đánh giá tác động** (Luật 91, Điều 20 và Điều 21).
   - Cần xác nhận doanh nghiệp có phải lập và nộp hồ sơ chuyển dữ liệu ra nước ngoài (Supabase Singapore, Expo/Apple/Google tại Hoa Kỳ) trong 60 ngày không.
   - Cần xác nhận có được miễn theo Điều 38 (doanh nghiệp nhỏ, khởi nghiệp) không. Điều 38 chỉ nêu Điều 21, 22 và 33.2.
   - Chính sách mục 9 **cam kết** việc này. Phải làm thật trước khi công bố, hoặc sửa câu.
6. **Cơ quan nhận khiếu nại về dữ liệu.** Chính sách ghi "cơ quan chuyên trách bảo vệ dữ liệu cá nhân thuộc Bộ Công an". Cần xác nhận tên chính xác (A05) và có nên ghi cụ thể không.
7. **Nghị định 147/2024/NĐ-CP.**
   - Ngưỡng phải xin giấy phép mạng xã hội hoặc làm thông báo.
   - Nghĩa vụ xác thực tài khoản bằng số điện thoại Việt Nam hoặc số định danh. Ứng dụng hiện chỉ xác thực email.
   - Nghĩa vụ lưu thông tin tài khoản, giờ đăng nhập, IP trong 2 năm. Ứng dụng hiện **không lưu IP** và không lưu nhật ký đăng nhập.
   - Thời hạn gỡ nội dung (24 giờ theo yêu cầu cơ quan, 48 giờ với khiếu nại). Điều khoản 8.3 chỉ ghi "trong thời hạn pháp luật quy định".
   - Nội dung bắt buộc của "Thỏa thuận cung cấp và sử dụng dịch vụ mạng xã hội".
8. **Luật An ninh mạng 2025 (116/2025/QH15, hiệu lực 01/07/2026) và Nghị định 333/2026/NĐ-CP.**
   - Nghĩa vụ lưu dữ liệu tại Việt Nam của doanh nghiệp trong nước. Ứng dụng lưu ở Singapore.
   - Thời hạn cung cấp thông tin và gỡ nội dung theo yêu cầu của Bộ Công an.
   - Chưa đối chiếu văn bản gốc.
9. **Thời hạn giữ báo cáo về người đã xóa tài khoản**, kèm bản chụp tin nhắn của người khác. Cần xác nhận căn cứ giữ và thời hạn.
10. **Giới hạn trách nhiệm** (Điều khoản 11).
    - Viết theo Bộ luật Dân sự 2015, Điều 405.3 và Luật Bảo vệ quyền lợi người tiêu dùng 2023, Điều 25.
    - Cần xác nhận câu chữ và việc luật người tiêu dùng có áp dụng cho dịch vụ miễn phí không.
11. **Thay đổi điều khoản bằng thông báo trước 15 ngày** và "tiếp tục dùng là chấp nhận" (Điều khoản 14). Cần đối chiếu Luật Bảo vệ quyền lợi người tiêu dùng, Điều 25.
12. **Chuyển giao dữ liệu khi bán doanh nghiệp hoặc ứng dụng** (Chính sách 8.5, Điều khoản 5.2). Cần xác nhận có phải xin đồng ý lại của người dùng không.
13. **Tài khoản bị khóa vì khai dưới 18 tuổi.**
    - Dữ liệu hiện không tự xóa.
    - Cần xác nhận cách xử lý dữ liệu của người chưa thành niên theo Luật 91, Điều 24 và Luật Trẻ em.
    - Cần xác nhận việc tự khai ngày sinh có đủ không, có cần xác minh tuổi không.
    - Dự thảo sửa Nghị định 147 và Luật An ninh mạng 2025 có quy định riêng cho trẻ dưới 16 tuổi.
14. **Tiết lộ danh tính người gửi ẩn danh cho cơ quan nhà nước:** cần xác nhận thủ tục và hình thức yêu cầu hợp lệ.
15. **Báo cáo nội dung xâm hại trẻ em cho cơ quan công an** (Tiêu chuẩn cộng đồng, mục 1): cần xác nhận quy trình và đầu mối.
16. **Số điện thoại hỗ trợ** 111, 113, 115 ở Tiêu chuẩn cộng đồng: cần xác nhận còn đúng và có nên thêm đường dây hỗ trợ sức khỏe tâm thần không.

### Cửa hàng ứng dụng

17. **Nhắn tin ẩn danh trên App Store.** Apple Guideline 1.2 ghi rằng ứng dụng "used primarily for … random or anonymous chat" không thuộc về App Store.
    - Ứng dụng này là mạng xã hội. Nhắn ẩn danh là tính năng phụ, mặc định tắt, chỉ giữa người đang theo dõi nhau.
    - Vẫn là rủi ro duyệt lớn nhất. Chủ dự án quyết định có giữ tính năng trên iOS không.
18. **Đăng nhập Apple.** Ứng dụng có đăng nhập Google nhưng **chưa có Sign in with Apple** (Apple Guideline 4.8). Đây là việc của sản phẩm, văn bản không sửa được.

---

## 4. Lệch giữa `LegalScreen.tsx` hiện tại và thực tế

Văn bản trong `apps/mobile/src/features/settings/screens/LegalScreen.tsx` lệch với code ở các điểm sau. Không sửa trong lần này vì yêu cầu là không đụng tệp có sẵn.

1. **"Khi có tính năng video ngắn, chúng tôi ghi nhận…"** Reels đã có, và lịch sử xem (bảng `ContentInteraction`) **đang** được ghi.
2. **Thiếu hẳn các nội dung sau:**
   - ngày sinh và giới hạn 18+;
   - tin nhắn và ảnh tin nhắn;
   - nhắn ẩn danh, và việc nền tảng biết danh tính thật;
   - quét ảnh tin nhắn để làm mờ;
   - cảnh báo lừa đảo;
   - bản chụp 50 tin khi báo cáo;
   - mã thông báo đẩy;
   - các bên xử lý (Supabase, Expo, Apple, Google, SMTP, kho tệp).

   `MODERATION_PLAN.md` mục 9 đã yêu cầu chính sách nói những điều này.
3. **"Dữ liệu được lưu trên máy chủ của nhà cung cấp hạ tầng"** không nói việc lưu ở **Singapore** và chuyển dữ liệu ra nước ngoài.
4. **"Bạn có thể… xoá bài viết"**: thực tế bài viết chỉ bị xóa mềm (`deletedAt`). Nội dung và tệp ảnh, video vẫn còn tới khi xóa tài khoản. Story hết hạn cũng không bị dọn.
5. **"Xoá tài khoản để xoá toàn bộ dữ liệu của bạn"** chưa chính xác:
   - Báo cáo người khác gửi về bạn (kèm bản chụp tin nhắn) vẫn còn.
   - Bản sao lưu vẫn còn.
   - Việc xóa còn xóa luôn cuộc trò chuyện của người kia, và bình luận của người khác dưới bài của bạn.
6. **Điều khoản "hiển thị nội dung cho những người mà bạn đã chọn"**: ảnh, video bài viết, story, ảnh đại diện nằm trong bucket **đọc công khai**. Ai có đường dẫn trực tiếp đều mở được, kể cả bài "Chỉ mình tôi".
7. **"Ứng dụng được cung cấp ở trạng thái hiện có"** là câu miễn trừ trách nhiệm chung. Câu này có thể vô hiệu theo Bộ luật Dân sự, Điều 405.3 và Luật Bảo vệ quyền lợi người tiêu dùng, Điều 25.
8. **Điều khoản trong app không có:**
   - giới hạn 18+;
   - quy tắc nhắn ẩn danh;
   - cách kháng nghị;
   - thông tin doanh nghiệp, kênh liên hệ (Apple Guideline 1.2 yêu cầu có thông tin liên hệ).
9. **Câu đồng ý ở màn đăng ký là tiếng Anh**, trong khi văn bản là tiếng Việt. Đăng nhập bằng Google ở **màn đăng nhập** tạo được tài khoản mới mà người dùng không thấy câu đồng ý nào.

---

## 5. Đưa vào ứng dụng và cửa hàng

### Trong ứng dụng (Android và iOS)

- **Đăng ký:**
  - Hiện liên kết tới Điều khoản, Chính sách và Tiêu chuẩn cộng đồng **trước** nút tạo tài khoản, bằng tiếng Việt.
  - Nên có ô đánh dấu đồng ý, xem mục 3.3 ở trên.
  - Áp dụng cả cho đường đăng nhập bằng Google lần đầu (tạo tài khoản mới), ở cả màn đăng nhập lẫn màn đăng ký.
- **Cài đặt > Giới thiệu:**
  - Đã có hai dòng "Điều khoản sử dụng" và "Chính sách quyền riêng tư".
  - Thêm dòng "Tiêu chuẩn cộng đồng".
  - Thay văn bản trong `LegalScreen.tsx` bằng nội dung ba tệp này, hoặc mở URL công khai.
- **Xóa tài khoản:** màn `DeleteAccountScreen` nên nói rõ những gì còn lại (mục 13 của Chính sách).
- **Bật nhận tin ẩn danh, và lần đầu gửi tin ẩn danh:** nên dẫn tới Điều khoản mục 7.
- **Khi đổi chính sách:** ghi phiên bản và thời điểm người dùng đồng ý. Hiện chưa có trường lưu việc này.

### URL công khai (HTTPS)

Đăng ba tài liệu lên một tên miền HTTPS, dạng trang web (Google Play không nhận PDF). Gồm:

- `/chinh-sach-quyen-rieng-tu`
- `/dieu-khoan-su-dung`
- `/tieu-chuan-cong-dong`
- `/xoa-tai-khoan`

Dự án hiện **chưa có tên miền web** (`docs/decisions.md`, DEC-024). Một cách làm: phục vụ trang tĩnh từ API, giống trang `/api/admin`.

### App Store Connect

- **Privacy Policy URL:** link Chính sách.
- **Support URL:** trang có `[EMAIL LIÊN HỆ]`.
- **App Privacy (nhãn dinh dưỡng):** khai theo mục 3 của Chính sách:
  - thông tin liên hệ (email);
  - nội dung người dùng (ảnh, video, tin nhắn, nội dung khác);
  - mã định danh (user ID, device ID cho push);
  - dữ liệu sử dụng (tương tác sản phẩm: lịch sử xem Reels).
- **Tracking:** không.
- **Xóa tài khoản trong app:** đã có.

### Google Play Console

- **Privacy policy:** link Chính sách.
- **Data safety:** khai khớp với Chính sách mục 3, 8, 9:
  - dữ liệu được mã hóa khi truyền (HTTPS);
  - người dùng yêu cầu xóa được.
- **Account deletion URL:** `[ĐƯỜNG DẪN XÓA TÀI KHOẢN]`.
- **Child safety standards:** link Tiêu chuẩn cộng đồng (mục 1 là chính sách chống xâm hại trẻ em), cùng đầu mối liên hệ.
- **UGC:** Điều khoản, báo cáo và chặn đã có trong app.

### Việc cần làm cho văn bản đúng sự thật

Nếu không làm được, phải sửa câu tương ứng:

- **HTTPS cho API và kho tệp ở bản phát hành.** Chính sách mục 11 nói có. `RULE.md` cũng bắt buộc.
- **Quyền camera, micro.** Ứng dụng không dùng. Plugin `expo-image-picker` có thể tự khai quyền camera và micro. Nên đặt `cameraPermission: false` và `microphonePermission: false` trong `app.json`, nếu đúng là không dùng. Kiểm tra lại trên cả Android và iOS trước khi khai Data safety và App Privacy.
- **Hộp thư `[EMAIL BẢO VỆ DỮ LIỆU]`** phải có người trực. Mọi quyền truy cập, sửa, xuất dữ liệu và xóa một phần hiện là việc làm tay.

---

## 6. Nguồn đã tham khảo

Kiểm tra ngày 01/11/2026. Một số trang chính thức không mở được: thuvienphapluat.vn trả lỗi 403. Chưa đối chiếu Công báo.

- **Luật Bảo vệ dữ liệu cá nhân số 91/2025/QH15** (thông qua 26/06/2025, hiệu lực 01/01/2026):
  - https://english.luatvietnam.vn/dan-su/law-on-personal-data-protection-law-no-91-2025-qh15-405135-d1.html
  - https://www.tilleke.com/insights/vietnams-new-personal-data-protection-law-a-closer-look/13/
  - https://hatinh.gov.vn/vi/bai-viet/luat-bao-ve-du-lieu-ca-nhan-chinh-thuc-co-hieu-luc-thi-hanh-tu-ngay-112026
- **Nghị định 356/2025/NĐ-CP** (ký 31/12/2025, hiệu lực 01/01/2026, thay Nghị định 13/2023/NĐ-CP):
  - https://luatvietnam.vn/dan-su/nghi-dinh-356-2025-nd-cp-quy-dinh-chi-tiet-luat-bao-ve-du-lieu-ca-nhan-422896-d1.html
  - https://www.ey.com/vi_vn/technical/tax/tax-and-law-updates/nghi-dinh-so-356-2025-nd-cp-quy-dinh-chi-tiet-mot-so-dieu-va-bien-phap-thi-hanh-luat-bao-ve-du-lieu-ca-nhan
- **Nghị định 147/2024/NĐ-CP** (ký 09/11/2024, hiệu lực 25/12/2024):
  - https://luatvietnam.vn/thong-tin/nghi-dinh-147-2024-nd-cp-cua-chinh-phu-quan-ly-cung-cap-su-dung-dich-vu-internet-va-thong-tin-tren-mang-372523-d1.html
  - https://www.tilleke.com/insights/vietnam-issues-new-decree-governing-internet-services-and-online-information/10/
  - Dự thảo sửa đổi (trẻ 13–16 tuổi): https://lsvn.vn/de-xuat-tre-tu-13-16-tuoi-duoc-binh-luan-tren-mxh-khi-co-nguoi-lon-giam-sat-a178911.html
- **Luật An ninh mạng số 116/2025/QH15** (hiệu lực 01/07/2026) và **Nghị định 333/2026/NĐ-CP**:
  - https://apolatlegal.com/vi/laws/luat-an-ninh-mang-2025-so-116-2025-qh15/
  - https://hethongphapluat.com/nghi-dinh-333-2026-nd-cp-huong-dan-luat-an-ninh-mang.html
  - https://hatinh.gov.vn/vi/bai-viet/tre-em-su-dung-mang-xa-hoi-luu-y-4-quy-dinh-tai-luat-an-ninh-mang-2025-
- **Bộ luật Dân sự 2015 (91/2015/QH13):** Điều 38 (bí mật đời tư), Điều 405 (hợp đồng theo mẫu): https://hethongphapluat.com/bo-luat-dan-su-2015/dieu-405
- **Luật Bảo vệ quyền lợi người tiêu dùng 2023 (19/2023/QH15, hiệu lực 01/07/2024):** https://hethongphapluat.com/luat-bao-ve-quyen-loi-nguoi-tieu-dung-2023.html
- **Luật Trẻ em 2016 (102/2016/QH13):** https://hethongphapluat.com/law-no-102-2016-qh13-dated-april-05th-2016-children/dieu-21
- **Apple App Store Review Guidelines** (1.2, 4.8, 5.1.1, 5.1.2): https://developer.apple.com/app-store/review/guidelines/
- **Google Play:**
  - User Data: https://support.google.com/googleplay/android-developer/answer/10144311
  - Account deletion: https://support.google.com/googleplay/android-developer/answer/13327111
  - UGC: https://support.google.com/googleplay/android-developer/answer/9876937
  - Child Safety Standards: https://support.google.com/googleplay/android-developer/answer/14747720
- **Trong repo:**
  - `apps/api/prisma/schema.prisma`, `apps/api/src/modules/*`, `apps/api/.env.example`;
  - `apps/mobile/app.json`, `LegalScreen.tsx`, `RegisterScreen.tsx`, `reportService.ts`;
  - `docs/moderation/MODERATION_PLAN.md`, `docs/decisions.md` (DEC-022 tới DEC-025);
  - `docs/plan/src/sections/E1.html`, `E2.html`, `B2.html`, `C1.html`.
