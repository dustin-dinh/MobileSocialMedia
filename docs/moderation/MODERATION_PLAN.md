# Kế hoạch kiểm duyệt nội dung và an toàn người dùng

Cập nhật: 17/10/2026. Áp dụng cho `apps/api` (NestJS) và `apps/mobile` (Expo).

Tài liệu này dành cho đội phát triển và cho người mua mã nguồn. Nó mô tả hệ thống đang làm gì để giữ người dùng an toàn, phần nào đã có trong code, phần nào còn là kế hoạch, và phần trách nhiệm thuộc về người vận hành ứng dụng.

> Các mục nói về pháp luật chỉ để định hướng, không phải tư vấn pháp lý. Người vận hành cần kiểm tra lại với luật sư ở nơi mình hoạt động.

---

## 1. Nguyên tắc

1. **Máy xem trước, người chỉ xem khi có báo cáo.** Kiểm tra tự động chạy trên mọi nội dung thuộc phạm vi. Người quản trị chỉ thấy nội dung riêng tư (tin nhắn) khi một trong hai người trong cuộc trò chuyện bấm báo cáo.
2. **Ít dữ liệu nhất có thể.** Không gửi ảnh tin nhắn ra dịch vụ bên ngoài. Chỉ lưu kết quả "nhạy cảm / không", không lưu điểm số hay đặc trưng của ảnh.
3. **Cảnh báo và để người dùng quyết định khi rủi ro thấp; chặn khi rủi ro cao.** Ví dụ: ảnh nhạy cảm giữa người quen thì làm mờ; đường link hay số tài khoản trong tin nhắn ẩn danh thì chặn.
4. **Ẩn danh với người dùng khác, không ẩn danh với nền tảng.** Server luôn biết ai gửi; nhờ vậy báo cáo, khóa tài khoản và yêu cầu hợp pháp vẫn xử lý được.
5. **Mọi tính năng rủi ro đều tắt mặc định và bật có chủ đích**, có màn hình nói rõ rủi ro.
6. **Nhà cung cấp kiểm duyệt là thành phần thay được.** Mặc định chạy được không cần khóa API trả phí.

---

## 2. Hiện trạng: những gì đã có trong code

| Hạng mục | Đã làm | Nơi trong code |
|---|---|---|
| Ảnh tin nhắn riêng tư | Kho riêng không đọc công khai, link có chữ ký hết hạn sau 1 giờ | `storage/media-url.ts`, `storage/storage.service.ts` |
| Làm mờ ảnh nhạy cảm trong tin nhắn | Mô hình nhận diện chạy trên server, người nhận chạm để xem | `moderation/image-moderation.service.ts`, `ChatScreen.tsx` |
| Tin nhắn chờ (người lạ) | Chỉ chữ, tối đa 3 tin trước khi được trả lời, không "Đã xem", người gửi không biết bị từ chối | `messages/messages.service.ts` |
| Nhắn tin ẩn danh | Che danh tính ở API, socket, thông báo đẩy; tự tiết lộ; chặn ẩn danh | `messages/messages.service.ts` |
| Chặn thông tin liên lạc | Link, số điện thoại, số tài khoản trong tin ẩn danh và tin nhắn chờ | `moderation/text-safety.ts` |
| Cảnh báo lừa đảo | Đánh dấu tin có cụm từ hay gặp trong lừa đảo | `moderation/text-safety.ts` |
| Báo cáo hội thoại | Lưu bản chụp 50 tin gần nhất; hội thoại ẩn danh bị đóng ngay | `reports/reports.service.ts` |
| Tước quyền gửi ẩn danh | Ngay khi bị báo cáo; admin trả lại hoặc tước bằng tay | `reports`, `admin` |
| Giới hạn 18+ | Ngày sinh khi đăng ký; tài khoản cũ khai một lần; dưới 18 bị khóa | `moderation/age.ts`, `auth`, `users` |
| Story ẩn danh | Chủ story chọn cho phép; không có danh sách người xem; cảm xúc ẩn danh | `stories/stories.service.ts` |
| Trang quản trị | Báo cáo hội thoại kèm danh tính thật và bản chụp (ảnh nhạy cảm bị làm mờ cho người duyệt); mở khóa tuổi; trả / tước quyền ẩn danh; cảnh báo khi bộ nhận diện ảnh không chạy | `admin/admin.html`, `admin/admin.service.ts` |
| Có từ trước | Chặn người dùng, báo cáo bài viết / bình luận / người dùng, khóa tài khoản, giới hạn tần suất API | `users`, `reports`, `admin`, `app.module.ts` |

Kiểm tra tự động: `apps/api/scripts/safety-smoke.cjs` (76 phép thử trên API thật) và `apps/mobile/__tests__/live/safetyLive.test.ts`.

---

## 3. Các lớp kiểm duyệt

| Lớp | Kiểm cái gì | Lúc nào | Hành động | Trạng thái |
|---|---|---|---|---|
| Ảnh tin nhắn | Ảnh khỏa thân / gợi dục | Ngay khi gửi, trước khi lưu | Làm mờ phía người nhận | **Đã làm** |
| Ảnh trong tin ẩn danh và tin nhắn chờ | — | Khi gửi | Cấm gửi ảnh | **Đã làm** |
| Chữ trong tin ẩn danh / tin nhắn chờ | Link, số điện thoại, số tài khoản | Khi gửi | Chặn tin, báo lý do | **Đã làm** |
| Chữ trong tin ẩn danh / tin nhắn chờ | Cụm từ lừa đảo | Khi đọc | Cảnh báo người nhận | **Đã làm** |
| Hành vi gửi ẩn danh | Tài khoản mới, gửi hàng loạt | Khi mở hội thoại | Từ chối (7 ngày tuổi, 10 hội thoại mới / ngày) | **Đã làm** |
| Chữ trong bài viết, bình luận, tên, tiểu sử | Chửi bới, xúc phạm, quảng cáo bẩn | Sau khi đăng (không làm chậm việc đăng) | Giảm hiển thị / đưa vào hàng chờ duyệt | Kế hoạch (mục 8) |
| Ảnh bài viết, story, ảnh đại diện, ảnh bìa | Ảnh nhạy cảm, bạo lực | Sau khi tải lên | Hàng chờ duyệt, làm mờ trong bảng tin | Kế hoạch (mục 8) |
| Video bài viết, Reels, story | Như ảnh | Trích vài khung hình sau khi tải lên | Như ảnh | Kế hoạch (mục 8) |
| Chữ nằm trong ảnh (meme, ảnh chụp màn hình) | Số điện thoại, link, lời lẽ xúc phạm | Sau khi tải lên | Như chữ | Kế hoạch (mục 8) |

---

## 4. Ảnh trong tin nhắn

**Mô hình.** `AdamCodd/vit-base-nsfw-detector` trên Hugging Face, bản ONNX lượng tử hóa (88 MB), hai nhãn `sfw` / `nsfw`, đầu vào 384×384. Chạy bằng `onnxruntime-node`; ảnh được giải mã bằng `sharp`. Trên CPU một ảnh mất khoảng 0,5–0,7 giây.

**Cài đặt.** `node scripts/download-moderation-model.cjs` (trong `apps/api`) tải mô hình vào `apps/api/models/nsfw-vit/`. Thư mục này không đưa vào git.

**Hành vi.**
- Xác suất `nsfw` từ ngưỡng `IMAGE_MODERATION_THRESHOLD` (mặc định 0,7) trở lên thì tin nhắn được gắn `sensitive: true`.
- Người nhận thấy ảnh bị làm mờ, kèm "Ảnh có thể nhạy cảm · Chạm để xem". Người gửi thấy dòng "Ảnh này được làm mờ với người nhận".
- Ảnh không giải mã được thì coi như nhạy cảm, để người nhận tự quyết.
- Mô hình chủ ý chặt tay: ảnh hở nhiều da cũng có thể bị làm mờ. Làm mờ nhầm chỉ tốn một lần chạm.
- **Không có mô hình** (chưa tải hoặc lỗi): mặc định ảnh vẫn gửi được nhưng **không** được làm mờ. Server ghi log và trang quản trị hiện cảnh báo đỏ. Đặt `IMAGE_MODERATION_REQUIRED=true` để từ chối ảnh thay vì gửi mà không kiểm.

**Quyền riêng tư.**
- Ảnh không rời máy chủ. Chỉ lưu cờ `sensitive`.
- Ảnh nằm trong kho riêng tư (`S3_PRIVATE_BUCKET`). Client chỉ nhận link có chữ ký, hết hạn sau 1 giờ, và chỉ hai người trong cuộc trò chuyện nhận được link.
- Xóa tài khoản thì xóa luôn ảnh trong mọi cuộc trò chuyện của tài khoản đó.
- Người quản trị chỉ thấy ảnh khi cuộc trò chuyện bị báo cáo. Trong trang quản trị, ảnh nhạy cảm cũng bị làm mờ cho tới khi người duyệt bấm vào.

**Ảnh xâm hại trẻ em.** Bộ nhận diện ảnh nhạy cảm thông thường **không** phát hiện đáng tin loại nội dung này và không được dùng thay cho công cụ chuyên dụng. Công cụ chuyên dụng (đối chiếu dấu vân tay ảnh đã biết, ví dụ PhotoDNA) phải xin cấp quyền từ nhà cung cấp. Ở nhiều nước, nhà cung cấp dịch vụ phải báo cáo cho cơ quan chức năng và không được tự lưu giữ hay chia sẻ bằng chứng. Mã nguồn chừa sẵn chỗ: thêm bước kiểm tra vào `ImageModerationService.classify`. Việc đăng ký và vận hành công cụ đó là trách nhiệm của người vận hành.

---

## 5. Tin nhắn chờ, nhắn tin ẩn danh và chống lừa đảo

### 5.1 Tin nhắn chờ (người lạ)

- Một hội thoại thường mới mở là **tin nhắn chờ** khi người nhận chưa theo dõi người mở.
- Khi đang chờ:
  - người mở chỉ gửi được chữ, tối đa **3 tin**;
  - không gửi được link, số điện thoại, số tài khoản;
  - không thấy "Đã xem".
- Người nhận có các lựa chọn: **Chấp nhận**, **Xóa** (người mở không được báo, với họ vẫn là "đang chờ"), **Báo cáo**, hoặc trả lời (trả lời coi như chấp nhận).
- Tin nhắn chờ không tính vào huy hiệu tab Tin nhắn. Xem trước trong hộp thư chỉ ghi "Muốn gửi tin nhắn cho bạn", không hiện nội dung.
- Hội thoại đã có trước 17/10/2026 được coi là đã chấp nhận.

### 5.2 Ai được gửi ẩn danh

Server kiểm tra đủ các điều kiện sau mới cho mở hội thoại ẩn danh:

| Điều kiện | Giá trị |
|---|---|
| Người nhận cho phép | Trang cá nhân: người nhận bật "Nhận tin nhắn ẩn danh". Story: chủ story bật "cho phép tương tác ẩn danh" khi đăng |
| Quan hệ | Trang cá nhân: phải đang theo dõi người nhận. Story: phải xem được story (nghĩa là đang theo dõi) |
| Xác thực | Đã xác thực email, hoặc đăng nhập bằng Google |
| Tuổi tài khoản | Từ 7 ngày |
| Không bị tước quyền | `anonymousSuspendedAt` trống |
| Không chặn nhau | Cả hai chiều |
| Giới hạn | 10 hội thoại ẩn danh **mới** mỗi 24 giờ |

### 5.3 Cuộc trò chuyện ẩn danh

- Mỗi cặp người dùng có một hội thoại thường và **tối đa một hội thoại ẩn danh mỗi chiều**, tách riêng. Gộp chung sẽ lộ danh tính.
- **Chỉ có chữ.** Không ảnh, không link, không số điện thoại, không số tài khoản.
- Bắt đầu ở trạng thái tin nhắn chờ (mục 5.1).
- **Che danh tính ở server.** Với người nhận, `senderId` của người ẩn danh là `anonymous`, còn người đối diện là `{ id: "anonymous", displayName: "Người ẩn danh" }`. Áp dụng cho:
  - danh sách hội thoại;
  - lịch sử tin;
  - sự kiện socket `message:new`;
  - thông báo đẩy (tiêu đề "Người ẩn danh").

  `safety-smoke.cjs` kiểm tra rằng không dữ liệu nào trong số đó chứa id hay username thật.
- **Tiết lộ.** Chỉ người ẩn danh tự làm được, phải xác nhận, và không thu hồi được. Không có chức năng "yêu cầu tiết lộ", vì dễ thành công cụ gây áp lực.
- **Chặn người ẩn danh.** Người nhận bấm "Chặn" thì hội thoại bị đóng vĩnh viễn. Người kia không mở lại hội thoại ẩn danh với người nhận được nữa. Người nhận vẫn không biết đó là ai, và danh sách "đã chặn" của họ không hiện ai cả.

### 5.4 Luật chặn và cảnh báo (`moderation/text-safety.ts`)

Áp dụng cho tin của người ẩn danh (chưa tiết lộ) và của người mở tin nhắn chờ. Nội dung được chuẩn hóa trước: bỏ dấu tiếng Việt, đổi về chữ thường.

**Bị chặn** (server trả `CONTACT_INFO_BLOCKED`):
- Đường link: `http(s)://`, `www.`, tên miền viết lách kiểu "abc chấm com" hay "abc (.) vn", và các dịch vụ rút gọn hoặc chuyển hướng như `t.me`, `bit.ly`, `zalo.me`.
- Số điện thoại Việt Nam, kể cả khi viết tách bằng dấu cách, chấm, gạch: `0912 345 678`, `+84 912...`.
- Dãy 8–19 chữ số, tức dạng số tài khoản ngân hàng.

**Chỉ cảnh báo** (tin vẫn gửi; người nhận thấy "Tin nhắn có dấu hiệu lừa đảo. Đừng chuyển tiền hay gửi mã OTP."):
- Các cụm như: chuyển khoản, chuyển khoản trước, mã OTP, mã xác nhận, mật khẩu, nạp tiền, nạp thẻ, số tài khoản, việc nhẹ lương cao, kiếm tiền online, cộng tác viên, hoa hồng, đầu tư, lợi nhuận, trúng thưởng, nhận quà, vay tiền, giải ngân, tiền ảo, USDT, Zalo, Telegram…
- Danh sách nằm trong `SCAM_PHRASES`; sửa ở đó là đủ.

### 5.5 Báo cáo và tước quyền

- Nút **Báo cáo** có ngay trong cuộc trò chuyện. Lý do đứng đầu danh sách là "Lừa đảo, đòi tiền hoặc mã OTP" (`SCAM`).
- Báo cáo lưu kèm **bản chụp 50 tin gần nhất**, để người kia không xóa được bằng chứng.
- Báo cáo một hội thoại **ẩn danh** thì:
  1. Hội thoại đóng ngay, không ai gửi thêm được.
  2. Người gửi ẩn danh **mất quyền gửi ẩn danh ngay** (với mọi người), chờ admin xem.
- Admin thấy danh tính thật và bản chụp. Các hành động:
  - **Bỏ qua:** trả lại quyền gửi ẩn danh, **trừ khi** người đó đã bị **từ 3 người khác nhau** báo cáo trong 30 ngày. Khi đó phải trả quyền bằng tay.
  - **Khóa tài khoản.**
  - **Trả quyền** hoặc **tước quyền** gửi ẩn danh bằng tay, ở danh sách người dùng.
- Với hội thoại thường (không ẩn danh), báo cáo không tự đóng hội thoại. Người dùng chặn bằng nút "Chặn" như bình thường.

---

## 6. Giới hạn 18+

- **Đăng ký bằng email:** bắt buộc ngày sinh (`YYYY-MM-DD`). Dưới 18 tuổi thì server từ chối (`403 AGE_RESTRICTED`). Tuổi tính theo ngày ở giờ Việt Nam.
- **Tài khoản cũ và đăng ký bằng Google:** `birthDate = null`. App chặn ở màn "Ngày sinh của bạn" trước mọi màn khác.
  - Ngày sinh khai **một lần** (`PATCH /users/me/birth-date`); khai lần hai bị từ chối.
  - Dưới 18 tuổi thì tài khoản bị khóa vì tuổi (`ageLockedAt`): đăng nhập và mọi request trả `401 AGE_RESTRICTED`. Dữ liệu không bị xóa.
- **Admin "Mở khóa tuổi"** (khai nhầm, đã xác minh): xóa ngày sinh để người dùng khai lại.
- **Hạn chế:**
  - Ngày sinh do người dùng tự khai, không phải xác minh tuổi thật. Nếu cần xác minh thật (giấy tờ, eKYC), đó là dịch vụ bên ngoài và người vận hành phải tự tích hợp.
  - Server chỉ chặn tài khoản thiếu ngày sinh ở phía app, không chặn ở mọi API.

---

## 7. Story

- Chủ story **không thấy ai đã xem**. Hệ thống vẫn ghi lượt xem, chỉ để tô vòng "đã xem" phía người xem. Không còn API danh sách người xem.
- Chủ story thấy **ai thả cảm xúc**. Người thả ẩn danh hiện là "Người ẩn danh"; API trả `user: null`.
- **Cho phép tương tác ẩn danh** được chọn khi đăng từng story, mặc định tắt. Khi bật:
  - người xem thả cảm xúc ẩn danh được;
  - người xem trả lời ẩn danh được. Trả lời ẩn danh mở hội thoại ẩn danh (mục 5), có đủ mọi điều kiện và giới hạn ở đó.
- Thông báo cảm xúc được gộp: mỗi story tối đa một thông báo đẩy mỗi 15 phút, và thông báo không nêu tên ai.

---

## 8. Kế hoạch các giai đoạn sau (chưa làm)

1. **Lọc chữ tiếng Việt cho bài viết, bình luận, tên, tiểu sử.**
   - Chuẩn hóa: bỏ dấu, teencode ("dm", "vl", "cc"), chữ tách hoặc chèn ký tự ("đ.m", "đ m"), số thay chữ.
   - Danh sách từ chia mức (nặng: chặn; nhẹ: giảm hiển thị).
   - Sau đó thêm mô hình phân loại có hỗ trợ tiếng Việt.
2. **Nhận diện ảnh cho bài viết, story, ảnh đại diện, ảnh bìa.** Dùng lại `ImageModerationService`; ảnh nhạy cảm vào hàng chờ duyệt và bị làm mờ trong bảng tin.
3. **Video:** trích 3–5 khung hình (đầu, giữa, cuối) rồi chấm như ảnh.
4. **Chữ trong ảnh (OCR):** áp luật chặn liên lạc của mục 5.4 cho ảnh chụp màn hình có số điện thoại hay mã QR chuyển tiền.
5. **Hàng chờ duyệt và kháng nghị:**
   - nội dung bị giữ hiện cho người đăng là "đang được xem xét";
   - người đăng gửi kháng nghị một lần;
   - admin có nhật ký thao tác và phân quyền "người kiểm duyệt" riêng với "quản trị".
6. **Đo chất lượng:** tập ảnh và chữ có gán nhãn để đo tỉ lệ chặn đúng / chặn nhầm khi đổi ngưỡng hoặc mô hình.
7. **Nhà cung cấp thay được:** giao diện `classifyImage`, `classifyText` với các bản cài đặt (mô hình cục bộ, dịch vụ đám mây) chọn bằng biến môi trường.
8. **Tài khoản phụ:** phát hiện người bị khóa tạo lại tài khoản (cùng thiết bị hoặc cùng email gốc) để lách khóa và lách tước quyền ẩn danh.

---

## 9. Quyền riêng tư và pháp lý (định hướng)

- **Việt Nam:**
  - Nghị định 13/2023/NĐ-CP và Luật Bảo vệ dữ liệu cá nhân (hiệu lực từ 01/01/2026) yêu cầu thông báo mục đích xử lý dữ liệu, có căn cứ xử lý, và có đánh giá tác động khi chuyển dữ liệu ra nước ngoài.
  - Nghị định 147/2024/NĐ-CP đặt nghĩa vụ cho mạng xã hội về gỡ nội dung vi phạm khi có yêu cầu và về xác thực tài khoản.
  - Người vận hành cần kiểm tra các yêu cầu cụ thể này.
- **Chính sách quyền riêng tư** (`LegalScreen`, hiện là bản nháp) phải nói rõ:
  - ảnh tin nhắn được máy kiểm tra để làm mờ;
  - nền tảng biết danh tính người gửi ẩn danh;
  - quản trị viên xem tin nhắn khi có báo cáo;
  - ngày sinh được thu thập để giới hạn tuổi.
- **Yêu cầu từ cơ quan chức năng:** danh tính người gửi ẩn danh lưu trong `Conversation` (bên ẩn danh) và `Message.senderId`. Trả lời yêu cầu hợp pháp là việc của người vận hành.
- **Ở nước khác:** người mua mã nguồn phải tự xem luật nơi mình hoạt động. Ví dụ: EU có GDPR và các quy định về quét nội dung riêng tư; Mỹ có nghĩa vụ báo cáo nội dung xâm hại trẻ em. Mỗi tính năng ẩn danh đều tắt được bằng cấu hình (mục 10) nếu không phù hợp.

---

## 10. Cấu hình

| Biến (`apps/api/.env`) | Mặc định | Ý nghĩa |
|---|---|---|
| `S3_PRIVATE_BUCKET` | `<S3_BUCKET>-private` | Kho ảnh tin nhắn và tệp bài viết, story (ảnh, video, ảnh thu nhỏ), không đọc công khai; ứng dụng nhận URL có chữ ký, hết hạn sau 1 giờ |
| `IMAGE_MODERATION_MODEL_DIR` | `models/nsfw-vit` | Thư mục mô hình nhận diện ảnh |
| `IMAGE_MODERATION_THRESHOLD` | `0.7` | Ngưỡng xác suất để làm mờ |
| `IMAGE_MODERATION_REQUIRED` | `false` | `true`: không có mô hình thì từ chối ảnh (tin nhắn và bài viết) |

Các con số khác (3 tin chờ, 7 ngày tuổi, 10 hội thoại ẩn danh / ngày, 3 người báo cáo / 30 ngày, 50 tin trong bản chụp, 15 phút gộp thông báo story) là hằng số ở đầu các file:
- `messages.service.ts`
- `admin.service.ts`
- `reports.service.ts`
- `stories.service.ts`

---

## 11. Giấy phép mô hình

`AdamCodd/vit-base-nsfw-detector` dùng giấy phép **Apache-2.0**: được dùng thương mại và phân phối lại. Khi phân phối kèm mô hình phải giữ bản giấy phép và ghi nguồn. `download-moderation-model.cjs` ghi nguồn vào `models/nsfw-vit/SOURCE.txt`. Nếu đóng gói mô hình kèm sản phẩm, đưa thêm toàn văn Apache-2.0.

Thư viện: `onnxruntime-node` (MIT), `sharp` (Apache-2.0; thư viện libvips đi kèm dùng giấy phép LGPL và được liên kết động — kiểm tra lại điều khoản khi đóng gói).

---

## 12. Hạn chế đã biết

- **Danh sách tài khoản bị khóa** (khóa thường và khóa vì tuổi) nằm trong bộ nhớ của một tiến trình API. Chạy nhiều bản API thì phải chuyển sang Redis hoặc kiểm tra database.
- **Mốc gộp thông báo cảm xúc story** cũng nằm trong bộ nhớ một tiến trình.
- **Chặn liên lạc theo luật** lách được bằng cách viết số thành chữ ("không chín một hai…"). Lớp OCR và mô hình chữ ở mục 8 sẽ giảm việc này.
- **Bộ nhận diện ảnh** đã chạy cho ảnh tin nhắn và ảnh bài viết tải lên qua API (`PostMedia.sensitive`: người xem thấy ảnh mờ, tự chọn có xem không; tác giả thấy ảnh rõ). Chưa chạy cho tệp tải thẳng lên kho qua URL có chữ ký (video, ảnh thu nhỏ, story) và ảnh đại diện, ảnh bìa.
- **Báo cáo hội thoại thường** không tự đóng hội thoại; người dùng tự chặn.
