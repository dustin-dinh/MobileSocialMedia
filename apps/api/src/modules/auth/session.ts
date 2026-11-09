import { UnauthorizedException } from "@nestjs/common";

import { PrismaService } from "../../prisma/prisma.service";

export const SESSION_REVOKED_ERROR = {
    statusCode: 401,
    code: "SESSION_REVOKED",
    message: "Phiên đăng nhập đã hết hạn. Vui lòng đăng nhập lại.",
};

// Token còn hiệu lực khi tài khoản chưa xóa và số phiên (`ver`) khớp tokenVersion.
// Đăng xuất, đổi hoặc đặt lại mật khẩu tăng tokenVersion nên mọi token cũ bị từ chối.
// Token cấp trước khi có `ver` được coi là 0 để người dùng hiện tại không bị đăng xuất.
export async function assertSessionValid(
    prisma: PrismaService,
    payload: { sub?: string; ver?: number },
): Promise<void> {
    const user = payload.sub
        ? await prisma.user.findUnique({
            where: { id: payload.sub },
            select: { tokenVersion: true, deletedAt: true },
        })
        : null;

    if (!user || user.deletedAt || user.tokenVersion !== (payload.ver ?? 0)) {
        throw new UnauthorizedException(SESSION_REVOKED_ERROR);
    }
}
