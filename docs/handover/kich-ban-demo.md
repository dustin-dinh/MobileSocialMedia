# Kịch bản trình diễn 10 phút

Hai phần: (A) ứng dụng chạy bằng dữ liệu mẫu, không cần backend, khoảng 7 phút; (B) trang quản trị trên API thật với PostgreSQL cục bộ, khoảng 3 phút. Cách dựng môi trường ở `cai-dat-va-chay.md`.

Kịch bản viết theo dữ liệu mẫu trong code ngày 08/11/2026 (`features/feed/mockData.ts`, `features/messages/services/messageService.ts`). Chưa được chạy lại từ đầu đến cuối sau đợt phần 1-2: nên tập một lần trước khi trình diễn thật.

## 1. Chuẩn bị (làm trước, không tính vào 10 phút)

### 1.1. Ứng dụng với dữ liệu mẫu

`apps/mobile/.env.local`:

```
EXPO_PUBLIC_USE_MOCK=true
```

Chọn một trong hai:

- **Bản web** (dễ chiếu lên màn hình lớn): `cd apps/mobile && corepack pnpm exec expo start --web --clear`, mở `http://localhost:8081` trong Chrome, bật chế độ thiết bị di động của DevTools (rộng khoảng 390px).
- **Expo Go trên điện thoại Android**: `cd apps/mobile && corepack pnpm start:lan --clear`, quét mã QR. (iPhone chưa từng được thử; không dùng iPhone để trình diễn.)

App mở thẳng vào Trang chủ, đăng nhập sẵn bằng người dùng mẫu (`user-001`). Người dùng mẫu hiện mang tên bên bán; đổi trong `features/auth/authSession.tsx` (`MOCK_TEST_USER`) nếu trình diễn cho bên ngoài.

Dữ liệu mẫu nằm trong bộ nhớ: tải lại trang hoặc mở lại app là về trạng thái ban đầu.

### 1.2. Trang quản trị với dữ liệu thật

Cần API, MinIO và PostgreSQL cục bộ đang chạy (`cai-dat-va-chay.md`, mục 4-7). Trong `apps/api`:

```bash
node scripts/seed-test-users.cjs clean && node scripts/seed-test-users.cjs
node scripts/make-admin.cjs gaptest_c@example.invalid
```

Tạo hai báo cáo để hàng đợi có nội dung: `gaptest_a` đăng một bài và nhắn một tin chờ cho `gaptest_b`; `gaptest_b` báo cáo cả hai. Đoạn dưới chỉ dùng `fetch` / `FormData` có sẵn trong Node 24, không cần thư viện.

```bash
node - <<'EOF'
const BASE = process.env.API ?? 'http://localhost:3000/api';
async function call(method, path, token, body) {
  const headers = token ? { Authorization: `Bearer ${token}` } : {};
  let payload = body;
  if (body && !(body instanceof FormData)) { headers['Content-Type'] = 'application/json'; payload = JSON.stringify(body); }
  const res = await fetch(`${BASE}/${path}`, { method, headers, body: payload });
  const json = await res.json().catch(() => null);
  if (!res.ok) throw new Error(`${method} ${path} -> ${res.status} ${JSON.stringify(json)}`);
  return json;
}
const login = async (n) =>
  (await call('POST', 'auth/login', null, { email: `gaptest_${n}@example.invalid`, password: 'Passw0rd!gap' })).data;
(async () => {
  const a = await login('a');
  const b = await login('b');
  const form = new FormData();
  form.append('content', 'Khuyến mãi lớn, inbox ngay để nhận quà!');
  const post = (await call('POST', 'posts', a.accessToken, form)).data;
  await call('POST', 'reports', b.accessToken, { targetType: 'POST', targetId: post.id, reason: 'SPAM', note: 'Quảng cáo lặp lại' });
  const conversation = (await call('POST', 'conversations', a.accessToken, { userId: b.user.id })).data;
  await call('POST', `conversations/${conversation.id}/messages`, a.accessToken, { content: 'Bạn chuyển trước 500k để giữ chỗ nhé.' });
  await call('POST', 'reports', b.accessToken, { targetType: 'CONVERSATION', targetId: conversation.id, reason: 'SCAM' });
  console.log('Đã tạo 2 báo cáo.');
})().catch((error) => { console.error(error.message); process.exit(1); });
EOF
```

PowerShell không có heredoc: lưu đoạn giữa `node - <<'EOF'` và `EOF` thành một tệp `.cjs` ở thư mục tạm (ngoài repo) rồi chạy `node <tệp>`.

Mở `http://localhost:3000/api/admin` trong một tab khác, chưa đăng nhập.

**Tài khoản trình diễn**

| Dùng cho | Email | Mật khẩu |
|---|---|---|
| Trang quản trị | `gaptest_c@example.invalid` | `Passw0rd!gap` |
| Người đăng bài / gửi tin chờ | `gaptest_a@example.invalid` | `Passw0rd!gap` |
| Người báo cáo | `gaptest_b@example.invalid` | `Passw0rd!gap` |
| App ở chế độ mẫu | Không cần đăng nhập | |

Sau buổi trình diễn: `node scripts/seed-test-users.cjs clean` xóa các tài khoản thử và mọi dữ liệu của chúng (báo cáo do `gaptest_b` gửi đi theo).

## 2. Kịch bản

### 0:00-0:30. Giới thiệu

"Mạng xã hội cho người Việt từ 18 tuổi. Có những thứ quen thuộc: bảng tin, Reels, story, tin nhắn. Khác biệt là lớp an toàn, nhất là trong tin nhắn với người lạ."

### 0:30-2:00. Bảng tin: ảnh nhạy cảm và báo cáo

1. **Trang chủ.** Cuộn tới bài của **Minh Trần** ("Brunch cuối tuần, ba món ba kiểu…"). Ảnh đầu tiên bị làm mờ, có nhãn "Ảnh nhạy cảm · Chạm để xem". Nói: ảnh bài viết được mô hình trên máy chủ chấm lúc tải lên; người xem tự chọn có mở hay không. Chạm để mở.
2. Nhấn giữ nút thích trên một bài: thanh sáu cảm xúc hiện ra.
3. Bấm "…" trên một bài của người khác. Chỉ ra "Tắt tiếng" và "Ẩn bài viết". Chọn **"Báo cáo bài viết"**: bảng lý do có "Xâm hại hoặc gợi dục trẻ em", "Lừa đảo, đòi tiền hoặc mã OTP", "Spam hoặc quảng cáo"… Chọn một lý do, gửi; app báo đã gửi. Nói: báo cáo vào hàng đợi của quản trị viên, xếp theo mức độ nghiêm trọng (phần B).

### 2:00-5:00. Tin nhắn: tin chờ, ảnh mờ, lừa đảo, link đáng ngờ

1. Tab **Tin nhắn** (web: `/messages`). Hai thư mục: **"Tin nhắn"** và **"Tin nhắn chờ"**, có số đếm. Dòng chú thích: tin từ người bạn chưa theo dõi và tin ẩn danh nằm trong Tin nhắn chờ.
2. Mở **Minh Trần**: tin cuối là ảnh bị làm mờ, "Ảnh nhạy cảm · Chạm để xem". Nói: ảnh tin nhắn nằm trong kho riêng tư, chỉ người trong cuộc trò chuyện nhận được đường dẫn, đường dẫn hết hạn sau 1 giờ.
3. Mở **Đức Hoàng**: tin cuối chứa link `vietc0mbank-xacthuc.top`. Dưới tin có cảnh báo link đáng ngờ. Chạm vào link: hộp "Mở đường link?" báo "Đường link có dấu hiệu đáng ngờ. Đừng nhập mật khẩu, mã OTP hay thông tin ngân hàng…". Bấm hủy.
4. Mở **Linh Phạm** để so sánh: link Google Docs bình thường từ người quen, chạm là mở, không cảnh báo.
5. Thư mục **"Tin nhắn chờ"**, mở **Quốc Bảo** (người lạ):
   - Thanh trên cùng có ba nút **Báo cáo**, **Xoá**, **Chấp nhận**. Người gửi không biết mình đã xem tin cho tới khi chấp nhận.
   - Tin thứ hai bị gắn cảnh báo "Tin nhắn có dấu hiệu lừa đảo. Đừng chuyển tiền hay gửi mã OTP."
   - Nói: người lạ chỉ gửi được tối đa 3 tin, chỉ chữ; link, số điện thoại và số tài khoản bị máy chủ chặn ngay khi gửi; mỗi người chỉ mở được 20 tin chờ mới mỗi ngày (5 nếu tài khoản dưới 7 ngày).
   - Bấm **Báo cáo**: bảng "Báo cáo cuộc trò chuyện". Nói: báo cáo hội thoại lưu bản chụp 50 tin gần nhất làm bằng chứng.

### 5:00-6:30. Cài đặt an toàn

Tab **Cá nhân** → nút **Cài đặt** (web: `/settings`).

1. **"Ai được nhắn tin cho tôi"**: hai lựa chọn "Mọi người" (người lạ vào Tin nhắn chờ) và "Người tôi theo dõi".
2. **"Nhận tin nhắn ẩn danh"** (web: `/settings/anonymous`): màn "Tin nhắn ẩn danh" giải thích cách hoạt động, mục "Rủi ro bạn cần biết", mục "Cách ứng dụng bảo vệ bạn", và nút "Tôi đã hiểu, bật tin nhắn ẩn danh". Nói: mặc định tắt; chỉ người đang theo dõi mình mới nhắn ẩn danh được; tài khoản phải từ 7 ngày tuổi, đã xác thực, tối đa 10 hội thoại ẩn danh mới mỗi ngày; chỉ chữ; người gửi tự tiết lộ được, không ai ép được; máy chủ biết danh tính thật, quản trị viên chỉ xem khi có báo cáo và phải ghi lý do.
3. **"Xác thực hai lớp"** (web: `/settings/2fa`): nhập mật khẩu hiện tại (chế độ mẫu chấp nhận mọi mật khẩu), bật. Nói: khi bật, mỗi lần đăng nhập cần thêm mã 6 số gửi qua email; sai mật khẩu 5 lần liên tiếp thì khóa đăng nhập 15 phút; "Đăng xuất" ở đây đăng xuất mọi thiết bị.
4. Lướt qua **"Đã tắt tiếng"**, **"Người dùng đã chặn"**, **"Xoá tài khoản"** (xóa ngay trong app, yêu cầu của cả hai store).
5. Mục **Giới thiệu** → "Điều khoản sử dụng": văn bản pháp lý tiếng Việt, sinh từ `docs/legal`. Các chỗ như `[TÊN DOANH NGHIỆP]` là phần bên mua điền.

### 6:30-7:00. Chuyển sang trang quản trị

"Những gì người dùng báo cáo đi vào đây."

### 7:00-10:00. Trang quản trị (API thật)

Tab `http://localhost:3000/api/admin`, đăng nhập `gaptest_c@example.invalid` / `Passw0rd!gap`.

1. **Thống kê** ở đầu trang: báo cáo đang mở, người dùng, bài viết, tin đang hiển thị, tin nhắn 7 ngày, tài khoản bị khoá. Nếu mô hình ảnh chưa tải, trên cùng có thêm cảnh báo "Bộ nhận diện ảnh không chạy…" (cũng là một điểm đáng nói: hệ thống tự báo khi một lớp an toàn hỏng).
2. Tab **Báo cáo**: hai mục, báo cáo **Lừa đảo** (hội thoại) đứng trước báo cáo **Spam** (bài viết) vì xếp theo mức độ nghiêm trọng, rồi theo số người báo cáo. Mỗi mục có nhãn mức ("Nghiêm trọng", "Trung bình", "Thấp").
3. Mục hội thoại **không hiện tin nhắn và danh tính**. Bấm **"Xem tin nhắn và danh tính"**: trang bắt nhập lý do (ít nhất 3 ký tự). Nhập "Kiểm tra báo cáo lừa đảo", xác nhận: hiện bản chụp tin nhắn và người bị báo cáo.
4. Tab **Nhật ký**: dòng mới nhất là thao tác xem danh tính, ghi ai xem, lúc nào, lý do gì.
5. Quay lại tab **Báo cáo**, mục bài viết Spam: bấm **"Gỡ nội dung"**, xác nhận. Mục chuyển sang tab **Đã xử lý**; tab **Nhật ký** có thêm một dòng.
6. Tab **Người dùng**: tìm `gaptest_a`, chỉ ra các nút **Khoá tài khoản**, **Tước quyền ẩn danh**, và nhãn "Khoá vì dưới 18 tuổi" cho tài khoản khai dưới 18. Nói: khóa có hiệu lực ngay với mọi token đang dùng.

Kết: "An toàn được làm ở cả bốn chỗ: máy chủ chặn trước khi lưu, ứng dụng cảnh báo khi hiển thị, người dùng tự báo cáo và chặn, quản trị viên xử lý có nhật ký."

## 3. Nếu có thêm thời gian

- **Đăng nhập hai lớp thật**: cần SMTP thật trong `apps/api/.env`. Đăng nhập `gaptest_a` trên app (bỏ `EXPO_PUBLIC_USE_MOCK`), bật 2FA ở Cài đặt, đăng xuất, đăng nhập lại: app chuyển sang màn nhập mã, mã tới hộp thư. Lưu ý `gaptest_*` không có hộp thư thật (`@example.invalid`); phải đăng ký một tài khoản bằng email thật.
- **Khóa đăng nhập**: nhập sai mật khẩu 5 lần liên tiếp cho một tài khoản thử; lần thứ 5 báo "Bạn đã nhập sai mật khẩu quá nhiều lần. Vui lòng thử lại sau 15 phút." Giới hạn 10 lần / phút / IP có thể chặn trước (báo "thao tác quá nhanh").
- **Ẩn danh trên API thật** không trình diễn được với tài khoản vừa tạo: điều kiện là tài khoản từ 7 ngày tuổi. Bộ `safety-smoke.cjs` kiểm phần này ở mức API.

## 4. Những gì không trình diễn được ở chế độ mẫu

- Story: dữ liệu mẫu không có story nào.
- "Nhắn ẩn danh" trên trang cá nhân người khác: hồ sơ mẫu không bật nhận tin ẩn danh, nên nút không hiện.
- Màn nhập mã 2FA lúc đăng nhập: ở chế độ mẫu, đăng nhập không có nhánh mẫu (gọi API thật).
- Thông báo đẩy: chưa từng chạy trên thiết bị (cần development build và cấu hình EAS).
