# Đăng nhập bằng Google — Kế hoạch triển khai

> Ngày lập: 06/10/2026 · Người làm: 1 người (cả mobile + backend) · Hướng đã chốt: **Dev build + `@react-native-google-signin/google-signin`**, backend **verify `idToken`**.
> Ước lượng: **~4–5 ngày làm việc**. Mọi API/bảng ở đây do chính bạn duyệt (RULE.md điều 8, 9 — vì bạn giữ cả hai phía, ghi vào `docs/decisions.md` là đủ).

---

## 1. Hiện trạng đã kiểm tra

**Backend**
- `AuthService` chỉ có `register` / `login` (email + password, bcrypt). JWT `signAsync({ sub: user.id })`, hết hạn `1d` ([auth.module.ts](file:///c:/Users/nhatluan/Documents/MobileProject/apps/api/src/modules/auth/auth.module.ts)).
- `User.passwordHash String` **bắt buộc** → user Google không có mật khẩu sẽ không tạo được. `passwordHash` chỉ được dùng ở 2 chỗ: `register` (ghi) và `login` (`bcrypt.compare`) → sửa rủi ro thấp.
- `RegisterDto`: username `^[a-zA-Z0-9._]+$`, 3–30 ký tự, unique. Email lưu lowercase. **Không có xác minh email** khi đăng ký.
- `ValidationPipe` bật `whitelist + forbidNonWhitelisted` → DTO mới phải khai báo đủ field.
- Chưa có `google-auth-library`, chưa có biến môi trường Google. `apps/api` chưa có test runner.

**Mobile**
- `LoginScreen`/`RegisterScreen` dùng `AuthScreenContainer`, `AuthTextInput`, `PrimaryButton`, `FormMessage`, `useAuthSubmission`.
- `authSession.signIn` → `authService.login` → `authTokenStorage.save` (SecureStore) → `getCurrentUser` → `setSession`. **Đây là luồng tái dùng**; Google chỉ khác ở bước lấy `accessToken`.
- Mock mode (`USE_MOCK_API`) bỏ qua màn Login hoàn toàn → Jest/QA không bị ảnh hưởng nếu nút Google chỉ xuất hiện ở live mode.
- `app.json` **chưa có** `android.package`, `scheme`, plugin nào ngoài `expo-font`. Dự án đang chạy bằng **Expo Go** (BlueStacks).

> **Điểm then chốt:** `@react-native-google-signin` là native module → **không chạy trong Expo Go**. Bạn phải chuyển sang **development build** (`expo-dev-client`). Việc này ảnh hưởng toàn bộ cách chạy app, kể cả kế hoạch Reels (xem mục 8).

---

## 2. Thiết kế

```
[App] GoogleSignin.signIn() ──► idToken (aud = WEB client id)
[App] POST /api/auth/google { idToken } ──► [API] verifyIdToken (google-auth-library)
        ▲                                         │ sub, email, email_verified, name, picture
        │                                         ▼
        └── { data:{ accessToken, user } } ◄── tìm theo googleId → hoặc liên kết theo email → hoặc tạo mới
```
- Response **giống hệt** `POST /auth/login` ⇒ `authService.login` và `authSession` gần như dùng lại nguyên.
- App **không bao giờ** gửi email/tên do client tự khai; chỉ tin dữ liệu trong `idToken` đã verify.

### 2.1 Quyết định cần chốt (mặc định in đậm)
| # | Vấn đề | Quyết định |
|---|---|---|
| D1 | Lưu định danh Google | **`User.googleId String? @unique`** (đơn giản). Nâng lên bảng `AuthIdentity` chỉ khi sau này thêm Apple/Facebook |
| D2 | Email Google trùng tài khoản mật khẩu đã có | **Liên kết** (chỉ khi `email_verified = true`) **và xoá `passwordHash`** của tài khoản đó. Lý do: đăng ký không xác minh email → kẻ xấu có thể đăng ký trước bằng email của nạn nhân rồi chờ nạn nhân đăng nhập Google (pre-hijack). Người dùng thật vẫn vào bằng Google, hoặc đặt lại mật khẩu qua Forgot Password. *Phương án phụ: trả 409 và bắt đăng nhập bằng mật khẩu — an toàn nhưng UX tệ* |
| D3 | Username cho user mới | Sinh từ phần trước `@` của email: bỏ ký tự ngoài `[a-zA-Z0-9._]`, cắt ≤ 24, thêm hậu tố 4 số ngẫu nhiên nếu trùng/ngắn; thử lại tối đa 5 lần khi gặp `P2002` |
| D4 | Hồ sơ | `displayName` ← `name`, `avatarUrl` ← `picture` **chỉ khi tạo mới**; không ghi đè lần đăng nhập sau |
| D5 | Audience khi verify | **Một** `GOOGLE_WEB_CLIENT_ID` (idToken do thư viện sinh ra có `aud` = web client id đã truyền vào `configure`) |
| D6 | Đăng nhập mật khẩu với tài khoản chỉ có Google | Trả đúng thông báo chung `Invalid email or password` (không lộ việc tài khoản tồn tại) |

---

## 3. Workflow triển khai

> Quy ước: đọc `RULE.md` → làm → `tsc --noEmit` (cả 2 app) + `jest` xanh → append `docs/change.md` → ghi ADR vào `docs/decisions.md`. Migration chỉ bằng `prisma migrate`, **không** `db push`. Mock mode phải chạy như cũ.

### Phase 0 — Cấu hình Google & Dev build (0.5–1 ngày) · *loại rủi ro lớn nhất*
1. **Google Cloud Console:** tạo project → *OAuth consent screen* (External, trạng thái *Testing*, thêm email của bạn vào *Test users*) → tạo 2 OAuth client:
   - **Web application** → lấy `WEB_CLIENT_ID` (dùng cho `configure` ở app **và** `audience` ở backend).
   - **Android** → `package name` (ví dụ `com.mobilesocial.app`) + **SHA-1 của debug keystore** dùng khi build dev.
   - (iOS bỏ qua nếu chỉ demo Android.)
2. **Chọn package name** và thêm vào `app.json`: `android.package`, `scheme`. Cài `expo-dev-client` và `@react-native-google-signin/google-signin` (đúng version tương thích Expo SDK 57 / RN 0.86 — kiểm tra README/changelog của thư viện, không đoán).
3. **Build dev client** cho Android: `expo prebuild` + `expo run:android` (cần JDK + Android SDK) *hoặc* EAS Build (cần tài khoản Expo). Ghi lại lệnh nào chạy được vào `docs/decisions.md`. Lấy SHA-1: `./gradlew signingReport` hoặc `keytool` từ debug keystore → dán vào Android OAuth client.
4. **Môi trường chạy:** BlueStacks **phải có Google Play Services và đã đăng nhập một tài khoản Google**; nếu không, dùng 1 điện thoại Android thật.
5. **Spike:** màn hình thử gọi `GoogleSignin.signIn()`, in `idToken`; dán lên jwt.io kiểm tra `aud`, `email`, `email_verified`.

**Gate:** lấy được `idToken` có `aud = WEB_CLIENT_ID` trên thiết bị chạy dev build. **Nếu BlueStacks không có Play Services và không có máy thật → dừng, quay lại bàn phương án trình duyệt (OAuth code flow qua backend, chạy được Expo Go nhưng cần URL HTTPS công khai).**

### Phase 1 — Backend (1 ngày)
1. `pnpm add google-auth-library` trong `apps/api`. Thêm vào `.env.example`: `GOOGLE_WEB_CLIENT_ID=`.
2. **Migration mới** (`prisma migrate dev --name add_google_login`):
   ```prisma
   model User {
     passwordHash String?        // was: String
     googleId     String? @unique
   }
   ```
   Chạy `prisma generate`. Dữ liệu cũ không đổi (các cột mới nullable).
3. [users.service.ts](file:///c:/Users/nhatluan/Documents/MobileProject/apps/api/src/modules/users/users.service.ts): `CreateUserData.passwordHash?: string | null`, thêm `googleId?`; thêm `findByGoogleId`, `update` (liên kết).
4. DTO `dto/google-login.dto.ts`: `{ idToken: string }` — `@IsString @IsNotEmpty @MaxLength(4096)`.
5. `auth/google-verifier.service.ts` (tách riêng để mock khi test): bọc `OAuth2Client.verifyIdToken({ idToken, audience: GOOGLE_WEB_CLIENT_ID })`; trả `{ sub, email, emailVerified, name, picture }` hoặc ném `UnauthorizedException('Invalid Google token')`. Đọc client id bằng `ConfigService.getOrThrow` (giống `StorageService`).
6. `AuthService.loginWithGoogle(dto)`:
   - verify → nếu `!email || !emailVerified` ⇒ 401.
   - `findByGoogleId(sub)` ⇒ có thì dùng.
   - else `findByEmail(email.toLowerCase())` ⇒ có thì **liên kết** `googleId` + `passwordHash = null` (D2).
   - else tạo user mới (D3, D4) trong try/retry `P2002`.
   - ký JWT `{ sub: user.id }`, trả đúng shape `login` (`{ data:{ accessToken, user:{id,username,email,displayName,bio,avatarUrl} } }`).
7. `AuthService.login`: nếu `!user || !user.passwordHash` ⇒ `UnauthorizedException("Invalid email or password")` **trước** `bcrypt.compare` (tránh crash khi `null`).
8. `AuthController`: `@Post('google') @HttpCode(200)` → `loginWithGoogle`. Đăng ký provider mới trong `AuthModule`.
9. Kiểm tra `forgot-password` (xem `docs/forgot/HANDOFF_DEV_B.md`): user Google-only đặt lại mật khẩu thì **được phép** (coi như thêm mật khẩu); xác nhận luồng không phụ thuộc `passwordHash` cũ.

**Kiểm thử backend (chưa có runner → làm tay + script):**
| Trường hợp | Kỳ vọng |
|---|---|
| idToken hợp lệ, email mới | 200, tạo user, `passwordHash = null`, username hợp lệ |
| Lần 2 cùng tài khoản Google | 200, **cùng** `user.id` |
| Email trùng tài khoản mật khẩu | 200, liên kết, `passwordHash = null`, sau đó login mật khẩu ⇒ 401 |
| `email_verified = false` | 401 |
| Token sai/hết hạn/`aud` khác | 401 |
| Body thiếu/ thừa field | 400 |
| `POST /auth/login` với user Google-only | 401 `Invalid email or password` (không 500) |
| Username trùng | Tự thêm hậu tố, không 500 |
Dùng `curl` với idToken thật từ Phase 0 cho các case thật; case `email_verified=false`/trùng email dùng stub `GoogleVerifierService` (có thể thêm `jest` + `@nestjs/testing` vào `apps/api` nếu muốn — đã có sẵn `@nestjs/testing`).

**Gate:** `curl POST /api/auth/google` với idToken thật trả JWT; JWT đó gọi được `GET /api/users/me` và `GET /api/posts/feed`.

### Phase 2 — Mobile: service & session (0.5 ngày)
1. Env: `EXPO_PUBLIC_GOOGLE_WEB_CLIENT_ID` (cạnh `EXPO_PUBLIC_API_BASE_URL`). Thêm vào `config/` một getter có thông báo lỗi rõ ràng khi thiếu (giống `getApiBaseUrl`).
2. `features/auth/services/googleSignIn.ts` — **bọc toàn bộ thư viện** (để Jest mock và để đổi sang flow trình duyệt sau này mà không đụng UI):
   - `configure()` gọi một lần (webClientId, `offlineAccess: false`).
   - `signIn(): Promise<{ idToken: string }>`: kiểm tra Play Services, trả `idToken`; chuẩn hoá lỗi thành các loại: `cancelled` (im lặng), `play_services_unavailable`, `in_progress`, `unknown`.
   - `signOut()`: best-effort `GoogleSignin.signOut()` để lần sau hiện bảng chọn tài khoản.
3. `authService.loginWithGoogle(idToken)` → `POST auth/google`, **dùng lại** phần kiểm tra token của `login`.
4. `authSession`: thêm `signInWithGoogle(): Promise<void>` = `googleSignIn.signIn()` → `authService.loginWithGoogle` → `authTokenStorage.save` → `getCurrentUser` → `setSession` (cùng khối try/clear như `signIn`; **trích hàm dùng chung** thay vì copy). `signOut` gọi thêm `googleSignIn.signOut()` (nuốt lỗi).
5. `useAuthSubmission`: thêm xử lý lỗi "cancelled" = không hiện lỗi; thêm thông điệp cho Play Services.

**Gate:** `tsc` sạch; unit test cho `authService.loginWithGoogle` (map response/thiếu token) và `authSession.signInWithGoogle` (thành công, 401, user huỷ).

### Phase 3 — Mobile: giao diện (1 ngày)
1. `features/auth/components/GoogleButton.tsx`: nút outline theo Clay theme (`authColors`), logo "G" 4 màu bằng `react-native-svg` (đã có) theo [Google branding guidelines](https://developers.google.com/identity/branding-guidelines), nhãn **"Continue with Google"**, trạng thái `isLoading`/`disabled`, `accessibilityLabel`, vùng chạm ≥ `clayDimensions.minTouchTarget`.
2. `components/AuthDivider.tsx`: đường kẻ + chữ "or".
3. Chèn vào `LoginScreen` (dưới nút *Log in*) và `RegisterScreen` (dưới nút tạo tài khoản) — cùng `useAuthSubmission` để khoá cả form khi đang đăng nhập; lỗi hiện bằng `FormMessage` sẵn có.
4. **Ẩn nút khi `USE_MOCK_API`** hoặc khi thiếu `EXPO_PUBLIC_GOOGLE_WEB_CLIENT_ID` (màn Login hiện tại không bị vỡ).
5. Trải nghiệm: sau thành công **không cần điều hướng** — `RootNavigator` tự chuyển sang `MainTabNavigator` khi `isAuthenticated`. Huỷ giữa chừng: không báo lỗi. Mất mạng: dùng thông báo network sẵn có.
6. Đăng xuất → quay về Login, nút Google lại hiện bảng chọn tài khoản.

**Gate:** chụp màn hình Login/Register trên BlueStacks; đăng nhập Google từ app thành công đến Home trên dữ liệu thật.

### Phase 4 — Test, QA, tài liệu (0.5–1 ngày)
1. **Jest:** mock `googleSignIn` (và `@react-native-google-signin/google-signin` trong `jest.config`/setup); test `GoogleButton` (render, disabled, loading), `LoginScreen` (nhấn nút gọi `signInWithGoogle`, huỷ không hiện lỗi, lỗi server hiện lỗi). `jest` đang ép mock mode ⇒ cần test riêng với mock `USE_MOCK_API=false` cho phần này hoặc test component độc lập.
2. **Chạy lại** `tsc`, `jest`, `verify-ui.mjs` (lưu ý Rule H đang fail sẵn theo DEC-017, không phải do Google).
3. **Thủ công trên thiết bị:** (a) tài khoản Google mới → tạo user; (b) đăng nhập lại → cùng user; (c) email trùng tài khoản đã đăng ký bằng mật khẩu → liên kết; (d) huỷ; (e) tắt mạng; (f) đăng xuất rồi đăng nhập tài khoản Google khác; (g) token hết hạn 1 ngày → quay về Login.
4. **QA script:** các script `scripts/qa/*.ps1` chạy mock mode (không qua Login) nên không đổi; tuy nhiên kiểm tra chúng có mở app qua Expo Go không — nếu có, cần cập nhật sang dev client (xem mục 8).
5. **Tài liệu:** `docs/change.md` (append), `docs/decisions.md` (ADR: dev build, `googleId`, chính sách liên kết D2), `docs/api-contract.md` (thêm `POST /auth/google`), hướng dẫn chạy dev build + biến môi trường vào README/`AGENT_STATE`.

**Gate cuối:** toàn bộ bảng kiểm thử mục 1 Phase 1 + 7 kịch bản thủ công đạt; mock mode & Jest không hồi quy.

---

## 4. API contract (thêm vào `docs/api-contract.md`)

`POST /api/auth/google` — không cần JWT
```jsonc
// request
{ "idToken": "<Google ID token>" }
// 200
{ "data": { "accessToken": "<jwt>", "user": { "id", "username", "email", "displayName", "bio", "avatarUrl" } } }
// 400 body sai · 401 { "message": "Invalid Google token" }
```

## 5. Danh sách file dự kiến

| Khu vực | File |
|---|---|
| API (mới) | `auth/dto/google-login.dto.ts`, `auth/google-verifier.service.ts`, migration `add_google_login` |
| API (sửa) | `prisma/schema.prisma`, `auth/auth.service.ts`, `auth/auth.controller.ts`, `auth/auth.module.ts`, `users/users.service.ts`, `.env.example`, `package.json` |
| Mobile (mới) | `auth/services/googleSignIn.ts`, `auth/components/GoogleButton.tsx`, `auth/components/AuthDivider.tsx`, test mới trong `__tests__/` |
| Mobile (sửa) | `auth/services/authService.ts`, `auth/authSession.tsx`, `auth/hooks/useAuthSubmission.ts`, `auth/screens/LoginScreen.tsx`, `auth/screens/RegisterScreen.tsx`, `app.json`, `package.json`, `jest.config.js` |
| Docs | `docs/change.md`, `docs/decisions.md`, `docs/api-contract.md` |

## 6. Rủi ro & giảm thiểu

| Rủi ro | Giảm thiểu |
|---|---|
| Không chạy được trong Expo Go | Chấp nhận dev build; Phase 0 xác nhận sớm |
| BlueStacks thiếu Google Play Services | Đăng nhập tài khoản Google trong BlueStacks, hoặc dùng máy Android thật; không được thì chuyển OAuth qua trình duyệt |
| `DEVELOPER_ERROR` / lỗi 10 từ Google | SHA-1 sai hoặc package name không khớp OAuth client Android; dùng đúng keystore của bản build đang chạy |
| Tài khoản bị chiếm trước (pre-hijack) | Quyết định D2: liên kết + xoá mật khẩu; chỉ tin `email_verified` |
| Consent screen ở *Testing* chỉ cho test user | Thêm email demo vào *Test users*; (tối đa 100) |
| Thư viện chưa hỗ trợ SDK 57 / RN 0.86 | Kiểm tra ở Phase 0 trước khi viết code |
| `passwordHash` nullable gây crash chỗ khác | Chỉ 2 chỗ dùng (đã kiểm tra); thêm test case login Google-only |
| Rò client id | `WEB_CLIENT_ID` là public; **không** đưa client secret vào app (không cần với luồng idToken) |

## 7. Chưa nằm trong phạm vi
Đăng nhập iOS, Apple/Facebook, refresh token, xác minh email, hợp nhất 2 tài khoản đã tồn tại độc lập, rate limiting.

## 8. Ảnh hưởng tới kế hoạch Reels
- Sau Phase 0, bạn chạy app bằng **dev client**, không phải Expo Go. Spike `expo-video` của Reels (Phase 0 trong `REEL_FINAL_SPEC_AND_PLAN.md`) nên chạy trên chính dev client này.
- Nên làm **Google login trước** (độc lập với Reels, chỉ ~4–5 ngày) để có sẵn dev build dùng chung.
