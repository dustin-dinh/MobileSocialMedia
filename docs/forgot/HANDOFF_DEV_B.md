# Handoff Dev B - Forgot Password API Requirements

**Dự án:** MobileSocialMedia  
**Tính năng:** Luồng Quên Mật Khẩu (Password Reset Flow)  
**Phía Mobile (Dev A):** Đã xây dựng hoàn thiện UI F1 (ForgotPassword), F2 (VerifyCode), điều hướng và Mock Service.  
**Phía Backend (Dev B):** Cần triển khai 2 endpoint REST API bên dưới vào `apps/api`.

---

## 1. Yêu Cầu Chi Tiết 2 Endpoints

### 1.1 Yêu cầu gửi mã xác thực (Request Reset Code)
- **Method:** `POST`
- **Route:** `/api/auth/forgot-password`
- **Headers:** `Content-Type: application/json`
- **Request Body:**
  ```json
  {
    "email": "user@example.com"
  }
  ```
- **Business Logic:**
  - Kiểm tra định dạng email hợp lệ.
  - Tạo mã OTP ngẫu nhiên 6 chữ số (ví dụ: `123456`), có thời hạn hiệu lực 10 phút.
  - Gửi mã OTP qua email của người dùng (sử dụng dịch vụ gửi mail như SendGrid/Resend/Nodemailer).
  - Giới hạn tần suất gửi (Rate limiting): Tối đa 1 lần gửi mỗi 60 giây cho cùng một email hoặc IP.
  - **Bảo mật:** Luôn trả về HTTP `200 OK` bất kể email có tồn tại trong hệ thống hay không (để chống tấn công rà quét tài khoản - User Enumeration Attack).
- **Response mong đợi (Success):** `200 OK`
  ```json
  {
    "success": true,
    "message": "If this email is registered, a 6-digit verification code has been sent."
  }
  ```
- **Response mong đợi (Error):**
  - `400 Bad Request`: Email rỗng hoặc sai định dạng.
  - `429 Too Many Requests`: Gửi yêu cầu quá nhanh (vượt rate limit).

---

### 1.2 Xác thực mã OTP (Verify Reset Code)
- **Method:** `POST`
- **Route:** `/api/auth/verify-reset-code`
- **Headers:** `Content-Type: application/json`
- **Request Body:**
  ```json
  {
    "email": "user@example.com",
    "code": "123456"
  }
  ```
- **Business Logic:**
  - Kiểm tra mã OTP 6 chữ số khớp với mã trong bộ nhớ đệm (Redis/DB) và chưa quá hạn 10 phút.
  - Giới hạn số lần thử (Rate limit brute-force): Tối đa 5 lần thử sai trước khi hủy mã OTP đó.
  - Sau khi xác thực mã đúng, đánh dấu mã đã sử dụng (hoặc cấp resetToken nếu có màn đổi mật khẩu sau này).
- **Response mong đợi (Success):** `200 OK`
  ```json
  {
    "success": true,
    "message": "Verification code confirmed successfully."
  }
  ```
- **Response mong đợi (Error):**
  - `400 Bad Request`: Mã không đúng định dạng (thiếu số, chứa ký tự lạ) hoặc mã không khớp / đã hết hạn.
  - `429 Too Many Requests`: Thử sai quá 5 lần.

---

## 2. Mock Contract Phía Mobile
- Trong quá trình phát triển độc lập, phía Mobile sử dụng `passwordResetService.ts` với cờ `USE_MOCK = true`:
  - Mã OTP mock cố định: `123456`.
  - Độ trễ giả lập: 300ms.
  - Mọi mã khác hoặc định dạng không đủ 6 chữ số sẽ trả lỗi `Invalid or expired verification code.`
- Khi Dev B triển khai xong 2 endpoint trên, chỉ cần đổi `USE_MOCK = false` trong `passwordResetService.ts` để kết nối Live API.
