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
- [ ] **Giai đoạn 6: Chạy Metro + BlueStacks**
  - [ ] Kiểm tra ADB & kết nối BlueStacks
  - [ ] Chạy Metro nền theo thứ tự Quy tắc 3
- [ ] **Giai đoạn 7: Xác nhận runtime & gỡ lỗi**
  - [ ] App mở màn hình đầu tiên không đỏ
  - [ ] Terminal không lỗi
- [ ] **Giai đoạn 8: Báo cáo cuối**
  - [ ] Tổng kết chat & cập nhật AGENT_STATE.md

---

## 3. Nhật ký thử nghiệm (Logs)
Format: `Lần N | lệnh | lỗi nguyên văn dòng đầu | nguyên nhân | file đã sửa | kết quả`

Lần 1 | `adb connect 127.0.0.1:5555` | `cannot connect to 127.0.0.1:5555: No connection could be made because the target machine actively refused it. (10061)` | Tiến trình BlueStacks chưa chạy và `bst.enable_adb_access="0"` trong cấu hình BlueStacks | Không sửa file code | Dừng để yêu cầu người dùng bật BlueStacks và Android Debugging

---

## 4. Danh sách "Đã thử và thất bại"
- `adb connect 127.0.0.1:5555` khi BlueStacks chưa chạy / chưa bật ADB trong Settings.

---

## 5. Danh sách "Cần người dùng quyết định"
- Yêu cầu người dùng bật BlueStacks và kích hoạt Android Debugging:
  1. Mở BlueStacks.
  2. Vào **Settings > Advanced > bật Android Debugging (Android Debug Bridge)**.
  3. Kiểm tra cổng ADB hiển thị (mặc định là 5555 hoặc ghi lại số cổng nếu khác).
  4. Đảm bảo đã cài app **Expo Go** trên BlueStacks hỗ trợ Expo SDK 57.
  5. Báo lại cho agent sau khi đã mở để tiến hành kết nối adb và khởi động Metro (`expo start --android`).
