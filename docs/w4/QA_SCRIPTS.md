# QA Automation Scripts Guide - Week 4

Bộ script QA tự động đặt tại `apps/mobile/scripts/qa/`, phục vụ kiểm tra cổng nghiệm thu (G-BASE) và smoke test thiết bị BlueStacks.

## 1. Danh sách các script
1. **`adb-helpers.ps1`**: Thư viện hàm ADB tiện ích: kết nối thiết bị (`Ensure-AdbConnection`), chụp màn hình (`Take-Screenshot`), lấy cây UI (`Get-UiDump`), tìm và click theo text/bounds (`Tap-Element`), nhập liệu (`Input-TextSafe`), khởi động lại app (`Restart-ExpoApp`), đổi kích thước/mật độ màn hình (`Set-Resolution`, `Reset-Resolution`), lấy log lỗi (`Get-LogcatErrors`).
2. **`smoke.ps1`**: Kiểm tra smoke test tự động trên BlueStacks: kết nối adb, mở app, chờ tối đa 90 giây để xuất hiện màn hình đầu tiên (Feed/Auth), kiểm tra logcat không có FATAL/Red screen, chụp ảnh lưu evidence tại `docs/w4/evidence/smoke-screen.png`.
3. **`gate.ps1`**: Kiểm tra G-BASE toàn diện: Scope Guard (đảm bảo không đổi `apps/api/`), TypeScript (`tsc --noEmit`), Unit Tests (`jest __tests__`), Android bundle export (`expo export --platform android`), và BlueStacks smoke test.

## 2. Hướng dẫn chạy các script
```powershell
# Chạy Smoke Test độc lập trên BlueStacks:
powershell -ExecutionPolicy Bypass -File apps/mobile/scripts/qa/smoke.ps1

# Chạy Full G-BASE Gate (bao gồm cả Smoke Test):
powershell -ExecutionPolicy Bypass -File apps/mobile/scripts/qa/gate.ps1

# Chạy G-BASE Gate nhanh (bỏ qua Smoke Test):
powershell -ExecutionPolicy Bypass -File apps/mobile/scripts/qa/gate.ps1 -SkipSmoke
```

## 3. Quy chuẩn xử lý lỗi
- Exit code 0: Toàn bộ kiểm tra đạt yêu cầu (PASS).
- Exit code khác 0: Có ít nhất một hạng mục thất bại (FAIL) hoặc vi phạm Scope Guard, script sẽ in chi tiết nguyên nhân trong bảng tóm tắt.
