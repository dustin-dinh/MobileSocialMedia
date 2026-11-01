# Brief chung: kế hoạch tích hợp tính năng (mọi agent đọc hết file này trước khi làm)

PLAN = C:\Users\nhatluan\AppData\Local\Temp\claude\c--Users-nhatluan-Documents-MobileProject\b986c090-2bd3-459a-a35d-d6f23c4f2d3d\scratchpad\plan
REPO = C:\Users\nhatluan\Documents\MobileProject

## Bối cảnh

Chủ dự án muốn đưa app mạng xã hội (Expo/React Native + NestJS + Prisma/PostgreSQL Supabase + S3/MinIO + Socket.IO)
lên mức "khoảng 60% Facebook hoặc các app mạng xã hội nhỏ", có 2FA, và làm thật kỹ các tính năng an toàn — đây là
điểm khác biệt của sản phẩm (tin nhắn chờ, nhắn ẩn danh có giới hạn, tự làm mờ ảnh nhạy cảm, cảnh báo lừa đảo, giới hạn 18+).
Kết quả cuối là một PDF kế hoạch. Mỗi agent viết đặc tả cho một nhóm tính năng: mô tả bằng lời + flowchart chi tiết.

Người đọc: chủ dự án (không chuyên sâu kỹ thuật, nhưng sẽ đưa cho dev làm theo). Viết sao cho người không code hiểu
được cách tính năng hoạt động, còn dev đọc phần dữ liệu/API là bắt tay làm được.

**Đọc trước khi viết** (bắt buộc):
- `REPO\RULE.md` (quy tắc dự án: Android + iOS bắt buộc, không bịa API contract, v.v.)
- `REPO\docs\report\bao-cao-tinh-nang.template.html` (báo cáo các tính năng ĐÃ có)
- Code liên quan tới nhóm của bạn trong `REPO\apps\api\src\modules\*` và `REPO\apps\mobile\src\features\*`,
  `REPO\apps\api\prisma\schema.prisma`, `REPO\docs\api-contract.md`, `REPO\docs\decisions.md`,
  `REPO\docs\moderation\MODERATION_PLAN.md` (nhóm an toàn/kiểm duyệt).
- Mục "Hiện trạng" phải đúng với code. Chỉ ghi điều đã thấy trong code; chỗ không chắc ghi "cần kiểm tra".

**KHÔNG sửa bất kỳ file nào trong REPO.** Chỉ ghi vào thư mục PLAN.

## Danh sách tính năng, giai đoạn và nhóm (đã chốt, không đổi mã)

Giai đoạn: GĐ1 = Sẵn sàng phát hành · GĐ2 = Bảo mật và an toàn (điểm khác biệt) · GĐ3 = Mạng xã hội đầy đủ · GĐ4 = Mở rộng.

| Mã | Tính năng | GĐ | Agent |
|---|---|---|---|
| A1 | Xác thực hai lớp (2FA): ứng dụng xác thực TOTP, mã dự phòng, OTP email dự phòng | 2 | G1 |
| A2 | Phiên đăng nhập và thiết bị: refresh token xoay vòng, danh sách thiết bị, đăng xuất từ xa | 1 | G1 |
| A3 | Cảnh báo đăng nhập lạ ("Không phải tôi") | 2 | G1 |
| A4 | Chống dò mật khẩu: khóa tạm, chậm dần, thông báo | 1 | G1 |
| A5 | Xác thực số điện thoại (OTP SMS) — có thể bắt buộc theo Nghị định 147/2024, cần luật sư xác nhận | 1 nếu bắt buộc, không thì 4 | G1 |
| A6 | Đăng nhập bằng Apple (bắt buộc trên iOS khi có đăng nhập Google) | 1 | G1 |
| B1 | Tin nhắn chờ và quyền ai được nhắn tin (nâng cấp) | 2 | G2 |
| B2 | Nhắn ẩn danh có giới hạn (nâng cấp) | 2 | G2 |
| B3 | Cảnh báo lừa đảo (tin nhắn, đường link, hồ sơ giả mạo) | 2 | G2 |
| B4 | Giới hạn tạm thời khi bị quấy rối hàng loạt | 2 | G2 |
| B5 | Làm mờ nội dung nhạy cảm toàn app (bài viết, story, ảnh đại diện, tin nhắn) | 2 | G3 |
| B6 | Bảo vệ 18+ và xác minh tuổi (báo cáo người dưới 18, khóa, kháng nghị) | 2 | G3 |
| B7 | Bộ lọc bình luận và từ ngữ ẩn; giới hạn ai được bình luận | 2 | G3 |
| B8 | Hạn chế (Restrict) và tắt tiếng (Mute) | 1 | G3 |
| C1 | Hàng đợi kiểm duyệt (tự động quét + người duyệt) | 1 | G4 |
| C2 | Cảnh cáo, xử phạt theo bậc và kháng nghị | 2 | G4 |
| C3 | Phân quyền quản trị (admin / kiểm duyệt viên) và nhật ký thao tác | 3 | G4 |
| D1 | Nhắn tin nhóm | 3 | G5 |
| D2 | Tin nhắn nâng cao: thu hồi, sửa, trả lời trích dẫn, cảm xúc, đang soạn, gửi video, ghi âm | 3 | G5 |
| D3 | Nhóm cộng đồng (Groups) | 4 | G5 |
| D4 | Gọi thoại và gọi video 1-1 | 4 | G5 |
| D5 | Xếp hạng bảng tin và Reels theo tương tác | 3 | G6 |
| D6 | Bài viết nâng cao: trích dẫn bài, bình chọn, gắn thẻ người, lịch sử chỉnh sửa, ghim bài | 3 | G6 |
| D7 | Bạn thân và tin nổi bật (story) | 3 | G6 |
| D8 | Thông báo đẩy hoàn chỉnh và cài đặt thông báo theo loại, giờ yên lặng | 1 | G6 |
| D9 | Tìm kiếm nâng cao: lịch sử tìm kiếm, gợi ý khi gõ @, tìm trong tin nhắn | 3 | G6 |
| E1 | Tải xuống dữ liệu của bạn | 3 | G7 |
| E2 | Xóa tài khoản có thời gian chờ 30 ngày + trang web yêu cầu xóa | 1 | G7 |
| E3 | Kiểm tra quyền riêng tư (hướng dẫn rà cài đặt) | 3 | G7 |
| E4 | Xác minh tài khoản (dấu tick) | 4 | G7 |

Nếu thấy cần chia nhỏ hay một tính năng phụ thuộc tính năng khác, ghi vào mục "Phụ thuộc" — không tự thêm mã mới.

## Đầu ra của mỗi tính năng

1. `PLAN\sections\<MÃ>.html` — một đoạn HTML (không có html/head/body), chỉ dùng thẻ: h3, h4, p, ul, ol, li, b, i, table, tr, th, td.
   Không style inline, không h1/h2. Cấu trúc **cố định**:

```html
<h3>A1. Xác thực hai lớp (2FA)</h3>
<p><i>Nhóm: Bảo mật tài khoản · Giai đoạn: GĐ2 · Ước lượng: 6–8 ngày công</i></p>
<h4>a) Mục đích</h4>            <!-- 2–4 câu: vấn đề gì, ai được lợi -->
<h4>b) Hiện trạng</h4>          <!-- cái đang có trong code (ghi file, ví dụ <i>apps/api/src/modules/auth</i>), cái thiếu -->
<h4>c) Cách hoạt động</h4>      <!-- từng luồng: tên luồng in đậm, rồi <ol> các bước đánh số, rõ ai làm gì, app hiện gì, máy chủ kiểm tra gì -->
<h4>d) Flowchart</h4>           <!-- một dòng <!--FLOW:flow-id--> cho mỗi sơ đồ, theo thứ tự; có thể có 1 câu dẫn trước mỗi sơ đồ -->
<h4>e) Quy tắc, giới hạn và trường hợp đặc biệt</h4>  <!-- con số cụ thể (đề xuất), lỗi mạng, gửi lại, người bị chặn, tài khoản bị khóa, lạm dụng -->
<h4>f) Dữ liệu và API (đề xuất)</h4>  <!-- bảng/trường Prisma mới, endpoint mới. Ghi rõ đây là đề xuất, cần đưa vào docs/api-contract.md trước khi code -->
<h4>g) Android, iOS và web</h4>  <!-- khác biệt nền tảng, quyền thiết bị (app.json), thư viện cần (phải hỗ trợ cả hai + Expo SDK 57), dịch vụ ngoài (FCM/APNs/SMS...), chi phí -->
<h4>h) Tiêu chí hoàn thành</h4>  <!-- checklist kiểm chứng được: luồng chính, luồng lỗi, chạy trên Android + iPhone, test tự động, admin xử lý được -->
<h4>i) Ước lượng và phụ thuộc</h4>  <!-- backend x ngày, mobile y ngày, kiểm thử z ngày (1 dev đã quen code); phụ thuộc mã nào; rủi ro -->
```

2. Flowchart: **mỗi tính năng ít nhất 1 sơ đồ; tính năng phức tạp 2–3 sơ đồ** (ví dụ A1: bật 2FA, đăng nhập có 2FA, mất điện thoại/khôi phục).
   Chủ dự án muốn càng chi tiết càng tốt: có nhánh lỗi, nhánh vượt giới hạn, thông báo gửi đi, chỗ ghi vào cơ sở dữ liệu, chỗ quản trị viên tham gia.

## Cách vẽ flowchart (bắt buộc dùng công cụ chung)

Viết spec JSON `PLAN\specs\<flow-id>.json` (flow-id: chữ thường, không dấu, bắt đầu bằng mã, ví dụ `a1-dang-nhap-2fa`),
xem định dạng ở đầu `PLAN\tools\flowgen.py` và ví dụ `PLAN\specs\sample.json` (ảnh kết quả: `PLAN\render\sample.png`). Sau đó:

```bash
cd "$PLAN"
python tools/flowgen.py specs/<id>.json flows/<id>.drawio        # phải in 0 ERROR
python C:/Users/nhatluan/.claude/skills/drawio-skill/scripts/validate.py flows/<id>.drawio --score   # 0 error, 0 crossings, 0 through-vertex, 0 overlaps
python tools/render.py flows/<id>.drawio render                   # tạo render/<id>.svg và render/<id>.png
```

Rồi **mở `render/<id>.png` bằng công cụ Read và nhìn**: sửa đường cắt nhau, đường đi xuyên hình, nhãn đè lên nhau,
mũi tên đi vòng khó hiểu. Tối đa 2 vòng sửa mỗi sơ đồ.

Quy ước sơ đồ:
- Làn (lanes) là các bên tham gia, thường: "Người dùng", "Ứng dụng", "Máy chủ", và khi cần "Người nhận" / "Quản trị viên" / "Dịch vụ ngoài".
  Tổng số cột ≤ 4 (một làn có thể có "cols": 2), số hàng ≤ 11. Lớn hơn thì tách thành nhiều sơ đồ.
- Thời gian đi từ trên xuống. Loại nút: start (bắt đầu), end (kết thúc), process (bước xử lý), decision (câu hỏi Có/Không),
  data (ghi/đọc cơ sở dữ liệu), io (màn hình app hiện ra / người dùng nhập), sub (gọi sang sơ đồ khác).
- Mọi cạnh đi ra từ decision phải có nhãn ("Có"/"Không" hoặc điều kiện ngắn). Nhãn nút ngắn (≤ 8 từ), tiếng Việt có dấu.
- Một decision tối đa 3 nhánh. Cạnh quay lại (vòng lặp) dùng "exit"/"entry"/"via" để đi vòng bên ngoài, không cắt qua nút.
- Mẹo: đặt nhánh lỗi sang cột bên cạnh cùng hàng; nhánh chính đi thẳng xuống; dùng hàng .5 nếu cần chen.

Tên sơ đồ (trường "title") là chú thích hình, ví dụ "Đăng nhập khi đã bật 2FA".

## Văn phong

- Tiếng Việt có dấu đầy đủ, câu ngắn, từ thường ngày. Thuật ngữ kỹ thuật lần đầu xuất hiện thì giải thích ngắn trong ngoặc
  (ví dụ: "TOTP (mã 6 số tự đổi mỗi 30 giây trong ứng dụng như Google Authenticator)").
- Không quảng cáo, không phóng đại, không "đột phá", "mạnh mẽ". Con số cụ thể; con số tự đề xuất thì ghi là đề xuất.
- Đúng quy tắc RULE.md: mọi tính năng phải chạy trên cả Android và iOS; quyền thiết bị khai báo cả hai phía; thư viện mới phải
  hỗ trợ Expo SDK 57 và cài bằng `expo install`; dịch vụ cần cả hai phía (APNs + FCM) thì ghi đủ.
- Nói rõ chi phí phát sinh (SMS, TURN server, dịch vụ quét link…) và yêu cầu của App Store / Google Play nếu có.

## Báo cáo khi xong

Ghi thêm `PLAN\sections\<G?>-summary.json`: danh sách object
`{"id": "A1", "name": "...", "phase": 2, "be_days": 4, "mb_days": 3, "qa_days": 1, "depends": ["A2"], "flows": ["a1-bat-2fa", ...], "new_services": ["..."], "risks": ["..."]}`.
Câu trả lời cuối cùng của bạn: liệt kê file đã tạo, số sơ đồ, và điều gì chưa chắc chắn / cần chủ dự án quyết.
