// Luật chống lừa đảo cho tin nhắn ẩn danh và tin nhắn chờ (docs/moderation/MODERATION_PLAN.md, mục 5).
// Sửa danh sách ở đây; không cần đổi code nơi khác.

// Bỏ dấu tiếng Việt, chữ thường: "Chuyển KHOẢN" -> "chuyen khoan".
export function normalizeVietnamese(text: string): string {
    return text
        .normalize('NFD')
        .replace(/\p{M}/gu, '')
        .replace(/đ/g, 'd')
        .replace(/Đ/g, 'D')
        .toLowerCase();
}

// Tên miền hay gặp trong tin lừa đảo, kể cả khi viết "abc chấm com" / "abc . com".
const DOMAIN_SUFFIXES = 'com|vn|net|org|io|me|xyz|top|info|link|ly|co|app|site|online|shop|club|cc|tk|biz|live|vip';
const LINK_PATTERNS = [
    /https?:\/\//,
    /\bwww\s*\./,
    new RegExp(`\\b[a-z0-9-]{2,}\\s*(\\.|\\(\\.\\)|\\[\\.\\]|\\s(cham|dot)\\s)\\s*(${DOMAIN_SUFFIXES})\\b`),
    /\b(t\.me|bit\.ly|zalo\.me|tinyurl|shorturl|wa\.me)\b/,
];

// Số liền nhau sau khi bỏ khoảng trắng, chấm, gạch: "09 12.345-678" -> "0912345678".
function digitRuns(text: string): string[] {
    return text.match(/\+?\d[\d\s.\-]{6,}\d/g)?.map((run) => run.replace(/[\s.\-]/g, '')) ?? [];
}

const PHONE = /^(\+?84|0)(3|5|7|8|9)\d{8}$/;
// Số tài khoản ngân hàng ở Việt Nam thường dài 8-19 chữ số.
const BANK_ACCOUNT = /^\d{8,19}$/;

export type BlockedContact = 'LINK' | 'PHONE' | 'BANK_ACCOUNT';

// Thông tin liên lạc / thanh toán bị cấm gửi trong tin ẩn danh và tin nhắn chờ.
export function findBlockedContact(text: string): BlockedContact | null {
    const normalized = normalizeVietnamese(text);

    if (LINK_PATTERNS.some((pattern) => pattern.test(normalized))) {
        return 'LINK';
    }

    for (const run of digitRuns(normalized)) {
        if (PHONE.test(run)) {
            return 'PHONE';
        }

        if (BANK_ACCOUNT.test(run.replace(/^\+/, ''))) {
            return 'BANK_ACCOUNT';
        }
    }

    return null;
}

// Cụm từ hay gặp trong lừa đảo. Không chặn tin, chỉ hiện cảnh báo cho người nhận.
const SCAM_PHRASES = [
    'chuyen khoan',
    'ck truoc',
    'ma otp',
    'otp',
    'ma xac nhan',
    'mat khau',
    'nap tien',
    'nap the',
    'so tai khoan',
    'stk',
    'viec nhe luong cao',
    'kiem tien online',
    'cong tac vien',
    'hoa hong',
    'dau tu',
    'loi nhuan',
    'lai suat',
    'trung thuong',
    'nhan qua',
    'phi nhan',
    'vay tien',
    'giai ngan',
    'tien ao',
    'crypto',
    'usdt',
    'chot don',
    'zalo',
    'telegram',
];
const SCAM_PATTERN = new RegExp(`\\b(${SCAM_PHRASES.join('|')})\\b`);

export function hasScamWarning(text: string | null | undefined): boolean {
    return Boolean(text) && SCAM_PATTERN.test(normalizeVietnamese(text ?? ''));
}
