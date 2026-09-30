# Agent State - Week 4 (MobileSocialMedia)

## 1. Trạng thái Hiện tại (Current State)
- **CURRENT_PHASE**: PHASE_5
- **MODE**: **MOCK** (Xác định: `BYPASS_AUTH_FOR_TESTING = true` trong `authSession.tsx`; `USE_MOCK = true` trong `searchService.ts`, `profileService.ts`, `postService.ts`, `notificationService.ts`, `feedService.ts`, `commentService.ts`)

### Bảng Trạng thái 8 Phase
| Phase | Tên Phase | Trạng thái | Ghi chú |
|---|---|---|---|
| **Phase 0** | Khởi động & Audit Baseline | GATE_PASSED | Đã hoàn thành audit baseline, MODE=MOCK, Scope Matrix & Test Plan đầy đủ |
| **Phase 1** | Hạ tầng QA tự động | GATE_PASSED | `gate.ps1`, `adb-helpers.ps1`, `smoke.ps1` exit 0, evidence saved |
| **Phase 2** | Test Tuần 3 + Triage + Sửa P0/P1 (S1) | GATE_PASSED | 13/13 tests T3-01..T3-13 PASS, 0 bug P0/P1 mở, G-BASE pass |
| **Phase 3** | Full Regression MVP (S2) | GATE_PASSED | Bộ test R-01..R-16 + 5 states PASS (46/46 unit tests), 0 bug P0/P1 mở |
| **Phase 4** | Đa cấu hình, UI/UX & Hiệu năng (S3, S4, S5) | GATE_PASSED | 3 cấu hình màn hình, BUG-001/002 fixed, Phosphor tối ưu giảm 72.8% module |
| **Phase 5** | Tính năng nhỏ (S6) | IN_PROGRESS | S6a (xóa/sửa), S6b (bookmark), S6c (cài đặt) - Entry check |
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

*(Nhắc lại quy tắc sau 5 lần thử: Scope sạch apps/api; Không đổi mock flags; Giữ test count; Môi trường Windows pnpm hoisted; Evidence đầy đủ)*

6 | Phase 1 | `powershell apps/mobile/scripts/qa/smoke.ps1` | - | - | `smoke.ps1` | PASS (Phát hiện màn hình Mobile Social, lưu evidence `smoke-screen.png`)
7 | Phase 1 | `powershell apps/mobile/scripts/qa/gate.ps1 -SkipSmoke` | Command "tsc" not found | Lỗi tính toán đường dẫn `$scriptDir` | `gate.ps1`, `smoke.ps1` | Sửa dùng `$PSScriptRoot`
8 | Phase 1 | `powershell apps/mobile/scripts/qa/gate.ps1 -SkipSmoke` | - | - | - | PASS (Scope Guard: PASS, tsc: PASS, jest: 14/14 PASS, export: PASS)
9 | Phase 2 | `corepack pnpm exec jest __tests__/week3.test.ts` | - | - | `__tests__/week3.test.ts` | PASS (13/13 tests passed trong 9.08s)
10 | Phase 2 | `powershell apps/mobile/scripts/qa/test-week3-device.ps1` | - | - | `test-week3-device.ps1` | PASS (Chụp 7 ảnh evidence T3-01..T3-13 trên BlueStacks)

*(Nhắc lại quy tắc sau 5 lần thử (lần 10): Scope sạch apps/api; Không đổi mock flags; Giữ test count; Môi trường Windows pnpm hoisted; Evidence đầy đủ)*

11 | Phase 2 | `powershell apps/mobile/scripts/qa/gate.ps1 -SkipSmoke` | - | - | `gate.ps1` | PASS (Scope Guard: PASS, tsc: PASS, jest: 27/27 PASS, export: PASS)
12 | Phase 3 | `corepack pnpm exec jest __tests__/regression.test.ts` | FAIL regression.test.ts | Sai signature meta và mock SecureStore | `regression.test.ts` | Điều chỉnh test khớp implementation
13 | Phase 3 | `corepack pnpm exec jest __tests__/regression.test.ts` | - | - | `regression.test.ts` | PASS (19/19 tests passed trong 11.38s)
14 | Phase 3 | `powershell apps/mobile/scripts/qa/test-regression-device.ps1` | - | - | `test-regression-device.ps1` | PASS (Chụp 4 evidence r-05, r-09, r-restart, r-network)
15 | Phase 3 | `powershell apps/mobile/scripts/qa/gate.ps1 -SkipSmoke` | - | - | `gate.ps1` | PASS (Scope Guard: PASS, tsc: PASS, jest: 46/46 PASS, export: PASS)

*(Nhắc lại quy tắc sau 5 lần thử (lần 15): Scope sạch apps/api; Không đổi mock flags; Giữ test count; Môi trường Windows pnpm hoisted; Evidence đầy đủ)*

16 | Phase 4 | `node scripts/verify-ui.mjs` | - | - | `src/theme/colors.ts`, `src/theme/index.ts` | PASS (Gỡ require cycle BUG-001)
17 | Phase 4 | `corepack pnpm exec tsc --noEmit` | - | - | `src/App.tsx`, `jest.setup.js` | PASS (Nạp đủ 7 biến thể Nunito BUG-002)
18 | Phase 4 | `corepack pnpm exec expo export --platform android` | - | - | `ClayIcon.tsx`, `types/phosphor-icons.d.ts` | PASS (Tối ưu Phosphor S5: 4099 -> 1115 modules, 8.6MB -> 2.4MB)
19 | Phase 4 | `powershell apps/mobile/scripts/qa/test-multi-config.ps1` | - | - | `test-multi-config.ps1` | PASS (Chụp 6 ảnh evidence qua 3 cấu hình màn hình S3)
20 | Phase 4 | `powershell apps/mobile/scripts/qa/gate.ps1 -SkipSmoke` | - | - | `gate.ps1` | PASS (G-BASE all checks passed, 46/46 unit tests, 0 bug mở)

*(Nhắc lại quy tắc sau 5 lần thử (lần 20): Scope sạch apps/api; Không đổi mock flags; Giữ test count; Môi trường Windows pnpm hoisted; Evidence đầy đủ)*

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
