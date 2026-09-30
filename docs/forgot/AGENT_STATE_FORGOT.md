# Agent State - Forgot Password Flow (apps/mobile)

## 1. Trạng thái Hiện tại (Current State)
- **CURRENT_PHASE**: PHASE_4
- **PHASE_STATUS**:
  | Phase | Tên Phase | Trạng thái | Ghi chú |
  |---|---|---|---|
  | **Phase 0** | Audit Baseline & Cấu trúc Auth | GATE_PASSED | Baseline G-BASE: 49 tests pass, STYLE_NOTES và đường đi tới Login sẵn sàng |
  | **Phase 1** | Service Mock + Validation + Navigation | GATE_PASSED | `passwordResetService.ts`, routes, types, 12 new jest tests pass (61 total) |
  | **Phase 2** | Màn F1 (Quên mật khẩu) | GATE_PASSED | `ForgotPasswordScreen.tsx`, 7 render tests pass (68 total), validation, loading, style regex 0, a11y labels |
  | **Phase 3** | Màn F2 (Nhập mã 6 số) | GATE_PASSED | `VerifyCodeScreen.tsx`, 11 tests pass (79 total), masked email, numeric input, countdown, timer cleanup, a11y |
  | **Phase 4** | Nghiệm thu trên BlueStacks + Tài liệu | IN_PROGRESS | `test-forgot-device.ps1`, đa cấu hình, HANDOFF_DEV_B.md, README.md |

---

## 2. Tóm tắt Quy tắc Cốt lõi (Rules 1-3)
1. **Scope:** Chỉ làm việc trong `apps/mobile/src/features/auth/`, `navigation/`, `__tests__/`, `scripts/qa/`, và `docs/forgot/`. CẤM đụng `apps/api/`. Không đổi logic đăng nhập/đăng ký cũ. Không đổi cờ `BYPASS_AUTH_FOR_TESTING` hoặc `USE_MOCK` của service cũ. Không làm màn đặt lại mật khẩu mới.
2. **Style:** Tái sử dụng `AuthTextInput`, `AuthScreenContainer`, `PrimaryButton`, `FormMessage`, theme tokens (`clayColors`, `clayTypography`, `clayDimensions`), `ClayIcon`. CẤM hard-code `#hex`, `rgb(`, `fontFamily: '...'` trong file mới (kiểm tra bằng regex). Mọi phần tử tương tác phải có `accessibilityLabel`. Văn bản UI dùng tiếng Anh nhất quán với các màn Auth hiện có.
3. **Giao thức Gate:** ENTRY CHECK -> THỰC HIỆN (tối đa 10 vòng/phase, mỗi vòng sửa 1 nguyên nhân) -> EXIT CHECK -> Scope Guard + Style Regex -> G-BASE pass -> commit `forgot: phase N gate passed` + tag `forgot-phase-N`. Dừng khi lặp lỗi 3 lần hoặc hết 10 vòng.

---

## 3. STYLE_NOTES (Kế thừa từ Login & Register)
- **Container chung:** `AuthScreenContainer` (đã tích hợp `SafeAreaView`, `KeyboardAvoidingView`, `ScrollView`, logo `AuthBrand`, tiêu đề `ClayText variant="title"`, phụ đề `ClayText variant="body"`, thẻ `ClaySurface variant="card"`, và footer điều hướng).
- **Ô nhập liệu (Input):** `AuthTextInput` (nhận `label`, `error`, `placeholder`, `keyboardType`, `autoCapitalize="none"`, `editable={!isSubmitting}`, hỗ trợ icon và validation error hiển thị ngay dưới ô).
- **Nút chính (Button):** `PrimaryButton` (nhận `label`, `isLoading`, `disabled`, `onPress`, hiệu ứng Clay nổi 3D, chiều cao min 48px).
- **Thông báo form (Message/Banner):** `FormMessage` (nhận `message`, `tone="error" | "info" | "success"`).
- **Khoảng cách & Thẩm mỹ:** Padding card 24px, margin top 28px, khoảng cách giữa các input 16px, không dùng màu hex tùy ý mà dùng `clayColors.accent.primary`, `clayColors.neutral.*`, v.v.
- **Ngôn ngữ UI:** Tiếng Anh nhất quán (e.g., "Forgot Password", "Send Code", "Verification Code", "Verify", "Resend Code", "Back to Log in").

---

## 4. Đường Đi Tới Màn Login Khi Chạy Thật (Navigation Route)
- Hiện tại `BYPASS_AUTH_FOR_TESTING = true` trong `authSession.tsx` giúp app tự động vào `MainTabNavigator`.
- **Cách đến Login:** 
  1. Khi app mở ở MainTabNavigator, chọn tab **Profile** (tab thứ 5 trên bottom bar, x=972, y=1840).
  2. Tại màn Profile, cuộn xuống hoặc chọn nút **"Đăng xuất" (Sign out)**.
  3. Thao tác `signOut()` gọi `clearSession()`, đặt `session = null` -> `isAuthenticated = false`.
  4. `RootNavigator` lập tức chuyển sang `<AuthNavigator />` và hiển thị màn hình **LoginScreen**.
  5. Tại LoginScreen, người dùng bấm vào liên kết **"Forgot password?"** để chuyển sang **ForgotPasswordScreen (F1)**.
  *(Đã kiểm chứng thực tế tại Phase 6/E2E step 10, chuyển đổi tức thời và an toàn 100%, không cần đổi cờ).*

---

## 5. Nhật ký từng lần thử (Logs)
Format: `N | phase | lệnh | lỗi dòng đầu | nguyên nhân | file sửa | kết quả`

1 | Phase 0 | `powershell apps/mobile/scripts/qa/gate.ps1 -SkipSmoke` | - | - | - | PASS (Baseline G-BASE: tsc 0 lỗi, jest 49/49 passed, export 1115 modules 2.4MB)
2 | Phase 1 | `powershell apps/mobile/scripts/qa/gate.ps1 -SkipSmoke -BaseCommit e79b158` | TS2339: Property 'data' does not exist on type 'PasswordResetResponse' | httpClient.requestJson already unboxes response to TResponse | passwordResetService.ts | PASS (G-BASE: tsc 0, jest 61/61 passed, export pass)
3 | Phase 2 | `powershell apps/mobile/scripts/qa/gate.ps1 -SkipSmoke -BaseCommit e79b158` | - | - | ForgotPasswordScreen.tsx, __tests__/forgotPassword.test.tsx | PASS (G-BASE: tsc 0, jest 68/68 passed, export pass, style regex 0, a11y clean)
4 | Phase 3 | `powershell apps/mobile/scripts/qa/gate.ps1 -SkipSmoke -BaseCommit e79b158` | - | - | VerifyCodeScreen.tsx, __tests__/verifyCode.test.tsx | PASS (G-BASE: tsc 0, jest 79/79 passed, export pass, style regex 0, a11y clean)

---

## 6. Danh sách "Đã thử và thất bại"
*(Trống)*
