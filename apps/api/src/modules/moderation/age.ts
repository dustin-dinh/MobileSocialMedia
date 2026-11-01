import { BadRequestException } from '@nestjs/common';

export const MINIMUM_AGE = 18;
const VIETNAM_OFFSET_MS = 7 * 60 * 60 * 1000;

// Hôm nay theo giờ Việt Nam, dạng YYYY-MM-DD.
function todayInVietnam(): string {
    return new Date(Date.now() + VIETNAM_OFFSET_MS).toISOString().slice(0, 10);
}

// Ngày sinh "YYYY-MM-DD" -> Date (UTC nửa đêm, cột @db.Date). Từ chối ngày không có thật / tương lai.
export function parseBirthDate(value: string): Date {
    const match = /^(\d{4})-(\d{2})-(\d{2})$/.exec(value);
    const date = match ? new Date(`${value}T00:00:00.000Z`) : null;

    if (
        !match ||
        !date ||
        Number.isNaN(date.getTime()) ||
        date.toISOString().slice(0, 10) !== value ||
        Number(match[1]) < 1900 ||
        value > todayInVietnam()
    ) {
        throw new BadRequestException('Invalid birth date');
    }

    return date;
}

// Tuổi tròn tính đến hôm nay (giờ Việt Nam).
export function ageOn(birthDate: Date): number {
    const [year, month, day] = todayInVietnam().split('-').map(Number);
    const born = birthDate.toISOString().slice(0, 10).split('-').map(Number);
    const hadBirthday = month > born[1] || (month === born[1] && day >= born[2]);

    return year - born[0] - (hadBirthday ? 0 : 1);
}

export function formatBirthDate(birthDate: Date | null): string | null {
    return birthDate ? birthDate.toISOString().slice(0, 10) : null;
}

// Cùng một lỗi cho đăng ký, đăng nhập và mọi request của tài khoản bị khóa vì tuổi.
// Không ghi statusCode: cùng thân lỗi đi với 403 (đăng ký) và 401 (đăng nhập, token đang có).
export const AGE_RESTRICTED_ERROR = {
    code: 'AGE_RESTRICTED',
    message: 'You must be at least 18 years old to use this app',
};
