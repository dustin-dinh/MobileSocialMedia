# Agent State & Execution Tracking

## 1. Mục tiêu và Quy tắc tóm tắt
- **Mục tiêu**: Chạy app `apps/mobile` (Expo SDK 57, RN 0.86.3, pnpm 12.4.1 qua Corepack) trên Expo Go trong BlueStacks (Windows/PowerShell) không lỗi màn hình đỏ.
- **Quy tắc 0 (Chống quên)**:
  - Đọc `docs/AGENT_STATE.md` trước MỖI lần chạy lệnh hoặc sửa file.
  - Cập nhật `docs/AGENT_STATE.md` sau MỖI lần chạy lệnh hoặc sửa file.
  - Sau mỗi 5 lần thử, nhắc lại quy tắc ở đầu file trong nhật ký.
  - Trước khi sửa bất kỳ file nào: `git status`, commit checkpoint `checkpoint: <mô tả>` trên nhánh `fix/run-on-expo-go`. Không đụng vào `main`.
- **Quy tắc 1 (Không đổi logic)**:
  - CẤM: sửa logic nghiệp vụ, navigation, state, UI behavior, mock data, không đổi `USE_MOCK`, `BYPASS_AUTH_FOR_TESTING`, không đụng `apps/api`, không tắt lint/type-check, không xóa test/component, không nâng/hạ major expo/react/react-native.
  - ĐƯỢC PHÉP SỬA (tối thiểu): config (`.npmrc`, `pnpm-workspace.yaml`, `metro.config.js`, `babel.config.js`, `app.json`/`app.config.*`, `tsconfig.json`), gói phụ theo `expo install --check`, import/icon nếu bundle crash (giữ API ClayIcon), font load nếu thiếu, lỗi cú pháp/type thuần túy.
  - Mọi thứ khác: DỪNG, ghi vào "Cần người dùng quyết định" và hỏi.
- **Quy tắc 2 (Môi trường Windows)**:
  - PowerShell, `corepack pnpm ...`.
  - CWD: `apps/mobile`. Chỉ cài dependency ở đây.
  - Xóa node_modules: `Get-Process node -ErrorAction SilentlyContinue | Stop-Process -Force` rồi `cmd /c "rmdir /s /q node_modules"`. Kiểm tra `Test-Path node_modules` là False.
  - Lệnh chạy lâu (`expo start`): chạy ở terminal nền, không chặn.
  - Kiểm tra OneDrive: nếu nằm trong OneDrive thì cảnh báo và đề nghị chuyển sang `C:\dev\...`.
- **Quy tắc 3 (BlueStacks + Expo Go)**:
  - ADB: `adb connect 127.0.0.1:<port>`. Xác nhận `adb devices` thấy `device`.
  - Thử theo thứ tự: (a) `corepack pnpm exec expo start --android --clear`, (b) `adb reverse tcp:8081 tcp:8081` + `exp://127.0.0.1:8081`, (c) `--lan` hoặc `--tunnel`.
  - Không tự hạ SDK nếu Expo Go quá cũ.

---

## 2. Checklist các giai đoạn
- [x] **Giai đoạn 1: Chuẩn bị**
  - [x] Tạo nhánh `fix/run-on-expo-go`
  - [x] Tạo `docs/AGENT_STATE.md`
  - [x] Kiểm tra Node (v24.19.0), Corepack (0.35.0), pnpm (12.4.1)
  - [x] Kiểm tra đường dẫn OneDrive (Không nằm trong OneDrive: C:\Users\nhatluan\Documents\MobileProject)
- [x] **Giai đoạn 2: Sạch môi trường**
  - [x] Dừng node processes
  - [x] Xóa `node_modules` và `.expo` tại `apps/mobile` đúng cách
  - [x] Xác nhận `Test-Path node_modules` là False
- [x] **Giai đoạn 3: Cấu hình pnpm**
  - [x] Tạo `apps/mobile/.npmrc` với `node-linker=hoisted`
  - [x] Sửa `apps/mobile/pnpm-workspace.yaml` (bỏ `set this to true or false`, cấu hình `@parcel/watcher` và `unrs-resolver` thành `true`)
- [x] **Giai đoạn 4: Cài đặt**
  - [x] Chạy `corepack pnpm install` trong `apps/mobile`
  - [x] Xác nhận `node_modules\.pnpm` không còn là liên kết chính
  - [x] Xác nhận `Test-Path node_modules\expo-font` là True, LinkType không phải Junction
- [x] **Giai đoạn 5: Kiểm tra**
  - [x] `corepack pnpm exec expo install --check` (cảnh báo: expo@57.0.22 -> ~57.0.26, @types/jest@30.0.0 -> 29.5.14, jest@30.5.2 -> ~29.7.0)
  - [x] `corepack pnpm exec tsc --noEmit` (Thành công, 0 lỗi type)
  - [x] `corepack pnpm exec jest` (Thành công: 2 suites passed, 14 tests passed)
- [x] **Giai đoạn 6: Chạy Metro + BlueStacks**
  - [x] Kiểm tra ADB & kết nối BlueStacks (`127.0.0.1:5555`, Expo Go v57.0.9)
  - [x] Chạy Metro nền theo thứ tự Quy tắc 3 (`corepack pnpm exec expo start --android --clear`)
- [x] **Giai đoạn 7: Xác nhận runtime & gỡ lỗi**
  - [x] App mở màn hình đầu tiên không đỏ (Hiển thị đầy đủ feed Mobile Social, avatar, post cards, icons)
  - [x] Terminal không lỗi (Android Bundled 35597ms index.ts - 4242 modules)
- [x] **Giai đoạn 8: Báo cáo cuối**
  - [x] Tổng kết chat & cập nhật AGENT_STATE.md

---

## 3. Nhật ký thử nghiệm (Logs)
Format: `Lần N | lệnh | lỗi nguyên văn dòng đầu | nguyên nhân | file đã sửa | kết quả`

Lần 1 | `adb connect 127.0.0.1:5555` | `cannot connect to 127.0.0.1:5555: No connection could be made because the target machine actively refused it. (10061)` | Tiến trình BlueStacks chưa chạy và `bst.enable_adb_access="0"` trong cấu hình BlueStacks | Không sửa file code | Dừng để yêu cầu người dùng bật BlueStacks và Android Debugging
Lần 2 | `adb connect 127.0.0.1:5555; corepack pnpm exec expo start --android --clear` | Không có lỗi (0 lỗi) | Metro bundle thành công 4242 modules | Không cần sửa code | Thành công tuyệt đối: App khởi động và hiển thị Feed màn hình đầu tiên trên BlueStacks Expo Go không màn hình đỏ

---

## 4. Danh sách "Đã thử và thất bại"
- `adb connect 127.0.0.1:5555` khi BlueStacks chưa bật ADB trong Settings (đã được người dùng bật và kết nối thành công ở lần 2).

---

## 5. Danh sách "Cần người dùng quyết định"
- Đã giải quyết: Người dùng đã mở BlueStacks và bật Android Debugging cổng 5555.

---

## 6. Báo cáo cuối (Final Report)
### 1. Kết quả
- **Thành công**: App `apps/mobile` đã chạy hoàn hảo trên Expo Go (SDK 57, RN 0.86.3) bên trong BlueStacks, hiển thị đầy đủ màn hình đầu tiên (Feed bài viết với hình ảnh, tương tác, bottom tab navigation) mà **không có màn hình đỏ hay bất kỳ lỗi runtime nào**.

### 2. Danh sách file đã thay đổi và diff
1. **`apps/mobile/.npmrc`** (Tạo mới):
   ```ini
   node-linker=hoisted
   ```
   *Lý do:* Cấu hình pnpm sang chế độ hoisted để tránh lỗi symlink/junction trên môi trường Windows với React Native & Metro.
   *Xác nhận:* Hoàn toàn là file cấu hình package manager, không đổi bất kỳ dòng code logic nào.

2. **`apps/mobile/pnpm-workspace.yaml`**:
   ```diff
   +nodeLinker: hoisted
    allowBuilds:
   -  '@parcel/watcher': set this to true or false
   -  unrs-resolver: set this to true or false
   +  '@parcel/watcher': true
   +  unrs-resolver: true
   ```
   *Lý do:* Cho phép build native binary cần thiết cho pnpm 12.4.1 và metro hoisted.
   *Xác nhận:* File cấu hình pnpm workspace, không đổi bất kỳ dòng code logic nào.

3. **`docs/AGENT_STATE.md`** (Tạo mới):
   Theo dõi toàn bộ quá trình thực thi, checklist các giai đoạn, log và kết quả theo Quy tắc 0.

### 3. Những việc người dùng cần lưu ý làm thêm sau này
- Commit các file cấu hình `apps/mobile/.npmrc`, `apps/mobile/pnpm-workspace.yaml`, và `docs/AGENT_STATE.md` vào Git khi hoàn tất merge.
- Sửa file `pnpm-workspace.yaml` ở thư mục gốc (`c:\Users\nhatluan\Documents\MobileProject\pnpm-workspace.yaml`) trước khi cài đặt `apps/api` (thay các giá trị `set this to true or false` thành `true` cho `@prisma/engines`, `prisma`, `bcrypt`,...).
- Đặt lại cờ `BYPASS_AUTH_FOR_TESTING = false` khi tiến hành tích hợp và test luồng xác thực API backend thật.

### 4. Lỗi nhỏ đã biết nhưng chưa sửa (được ghi nhận theo yêu cầu)
- Một số font phụ (`Nunito_500Medium`, `Nunito_600SemiBold_Italic`, `Nunito_900Black`) chưa được nạp trong danh sách load font ban đầu (hiện fallback mượt mà sang hệ thống hoặc Nunito đã nạp).
- Warning LogBox màu vàng: `Require cycle: src/theme/index.ts -> src/theme/clay.ts -> src/theme/index.ts` (đây là cảnh báo cycle tham chiếu thông thường của React Native, không gây lỗi crash).

---

## 7. Hướng dẫn chạy Dev Client & Google Sign-In (Mobile + Backend)

### 7.1 Biến môi trường cần thiết
- **Backend (`apps/api/.env`)**:
  ```env
  GOOGLE_WEB_CLIENT_ID=your-google-web-client-id.apps.googleusercontent.com
  ```
- **Mobile (`apps/mobile/.env.local` hoặc `apps/mobile/.env`)**:
  ```env
  EXPO_PUBLIC_GOOGLE_WEB_CLIENT_ID=your-google-web-client-id.apps.googleusercontent.com
  # Để bật kết nối live API và Google Sign-In:
  EXPO_PUBLIC_USE_MOCK=false
  ```

### 7.2 Lệnh chạy Development Client (thay cho Expo Go do có native module)
Do `@react-native-google-signin/google-signin` chứa native code, ứng dụng cần chạy qua Expo Development Client (`expo-dev-client`) thay vì Expo Go tiêu chuẩn:

1. **Build & cài đặt Dev Client lên Android (BlueStacks / máy thật)**:
   ```powershell
   cd apps/mobile
   corepack pnpm exec expo run:android
   ```
   *(Yêu cầu đã cài Android SDK và adb đã kết nối thiết bị/BlueStacks. BlueStacks phải có Google Play Services và đã đăng nhập tài khoản Google).*

2. **Chạy Metro bundler sau khi đã cài dev client**:
   ```powershell
   cd apps/mobile
   corepack pnpm exec expo start --dev-client
   ```

