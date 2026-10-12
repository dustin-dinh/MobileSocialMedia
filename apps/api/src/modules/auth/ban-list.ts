// Tài khoản đang bị khóa. AdminService nạp từ database lúc khởi động và cập nhật khi khóa/mở khóa.
// shortcut: nằm trong bộ nhớ của một tiến trình API; khi chạy nhiều bản API thì chuyển sang Redis
// hoặc kiểm tra database trong JwtStrategy.
export const bannedUserIds = new Set<string>();
