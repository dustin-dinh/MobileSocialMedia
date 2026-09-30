# Agent State - Week 4 (MobileSocialMedia)

## 1. Trạng thái Hiện tại (Current State)
- **CURRENT_PHASE**: PHASE_0
- **MODE**: **MOCK** (Xác định: `BYPASS_AUTH_FOR_TESTING = true` trong `authSession.tsx`; `USE_MOCK = true` trong `searchService.ts`, `profileService.ts`, `postService.ts`, `notificationService.ts`, `feedService.ts`, `commentService.ts`)

### Bảng Trạng thái 8 Phase
| Phase | Tên Phase | Trạng thái | Ghi chú |
|---|---|---|---|
| **Phase 0** | Khởi động & Audit Baseline | GATE_PASSED | Đã hoàn thành audit baseline, MODE=MOCK, Scope Matrix & Test Plan đầy đủ |
| **Phase 1** | Hạ tầng QA tự động | IN_PROGRESS | Bắt đầu xây dựng script QA (`gate.ps1`, `adb-helpers.ps1`, `smoke.ps1`) |
| **Phase 2** | Test Tuần 3 + Triage + Sửa P0/P1 (S1) | NOT_STARTED | 13 test cases T3-01..T3-13 |
| **Phase 3** | Full Regression MVP (S2) | NOT_STARTED | Bộ test R-01..R-16 với >= 2 tài khoản |
| **Phase 4** | Đa cấu hình, UI/UX & Hiệu năng (S3, S4, S5) | NOT_STARTED | 3 cấu hình màn hình, font Nunito, Phosphor icon |
| **Phase 5** | Tính năng nhỏ (S6) | NOT_STARTED | S6a (xóa/sửa), S6b (bookmark), S6c (cài đặt) |
| **Phase 6** | Release Candidate + E2E đầy đủ (S7) | NOT_STARTED | Kịch bản 10 bước E2E trên tag `w4-rc1` |
| **Phase 7** | Demo & Tài liệu bàn giao (S8) | NOT_STARTED | User guide, video demo, slide/report, handoff |

---

## 2. Tóm tắt 10 dòng Quy tắc cốt lõi (Rules 1-4)
1. **Scope:** Chỉ làm việc trong `apps/mobile/` và tài liệu `docs/w4/`, tuyệt đối cấm đụng vào `apps/api/` hoặc backend files.
2. **Logic Freeze:** Không sửa đổi logic nghiệp vụ, luồng điều hướng, mock data; không đổi `USE_MOCK` hoặc `BYPASS_AUTH_FOR_TESTING` khi chưa có quyết định.
3. **No Short-cuts:** Không tắt test, không xóa test, không tắt typecheck/lint để "cho qua". Không tự ý nâng/hạ major version.
4. **Environment:** PowerShell + Windows, gọi pnpm qua `corepack pnpm`, không xóa node_modules / không pnpm install trừ khi package.json đổi.
5. **Evidence First:** Mọi kết quả PASS đều phải có evidence rõ ràng (ảnh chụp adb screencap, logcat, jest output, dump UI tree).
6. **Bug Triage:** Phân loại P0 (crash/mất dữ liệu) > P1 (hỏng luồng core) > P2 (có workaround) > P3 (polish/warning). Sửa P0/P1 trước tiên.
7. **Loop Limit:** Tối đa 12 vòng lặp cho mỗi phase, mỗi vòng chỉ sửa một nguyên nhân duy nhất; lỗi lặp 3 lần phải dừng và hỏi.
8. **Stop Conditions:** Dừng và ghi vào `DECISIONS_NEEDED.md` khi hết vòng, lỗi lặp 3 lần, cần đổi cờ hoặc thay đổi vượt scope.
9. **Gate Protocol:** Mọi phase phải kiểm tra ENTRY CHECK -> EXECUTE -> EXIT CHECK -> SCOPE GUARD -> commit checkpoint và tag.
10. **G-BASE:** Gate chuẩn gồm `tsc --noEmit` exit 0, `jest` pass (không giảm test count), `expo install --check`, `expo export --platform android` thành công và smoke BlueStacks không đỏ.

---

## 3. Nhật ký từng lần thử (Logs)
Format: `N | phase | lệnh | lỗi dòng đầu nguyên văn | nguyên nhân | file sửa | kết quả`

1 | Phase 0 | `adb devices; adb connect 127.0.0.1:5555` | - | - | - | Kết nối thành công tới BlueStacks (127.0.0.1:5555 device)
2 | Phase 0 | `corepack pnpm exec tsc --noEmit` | - | - | - | PASS (0 lỗi typecheck)
3 | Phase 0 | `corepack pnpm exec jest __tests__` | - | - | - | PASS (2 suites passed, 14 tests passed, thời gian 34.075s)
4 | Phase 0 | `corepack pnpm exec expo export --platform android` | - | - | - | PASS (Android Bundled 48745ms, 4099 modules, 8.6MB bytecode)
5 | Phase 0 | `corepack pnpm exec expo start --android --clear` | - | - | - | PASS (App mở màn hình Feed Mobile Social trên BlueStacks không đỏ, 4242 modules)

---

## 4. Danh sách "Đã thử và thất bại"
*(Trống)*

---

## 5. Kết quả Baseline Audit (G-BASE Baseline)
- **TypeScript:** `corepack pnpm exec tsc --noEmit` -> PASS (0 lỗi)
- **Unit Tests:** `corepack pnpm exec jest __tests__` -> PASS (2 test suites: `perf.test.tsx`, `smoke.test.tsx`, 14 tests passed, 0 failed, thời gian 34.075s)
- **Package Compatibility:** `corepack pnpm exec expo install --check` -> Cảnh báo phiên bản: `expo@57.0.22` (expected: `~57.0.26`), `@types/jest@30.0.0` (expected: `29.5.14`), `jest@30.5.2` (expected: `~29.7.0`)
- **Android Export:** `corepack pnpm exec expo export --platform android` -> PASS (4099 modules, thời gian bundle 48.7s, output `dist/_expo/static/js/android/index-c37cf7263acca5d214f0bec09d854ae4.hbc`)
- **Runtime BlueStacks Smoke:** PASS (App chạy trên BlueStacks Expo Go SDK 57.0.9, hiển thị đầy đủ Feed cards và Clay bottom navigation, 0 crash, screenshot lưu tại `docs/w4/evidence/baseline-screen.png`)
- **Metro Bundler Metrics:** 4242 modules, 35597ms bundle time

---

## 6. Danh sách "Cần người dùng quyết định"
*(Không có)*
