import {
    BadRequestException,
    Injectable,
    NotFoundException,
    OnModuleInit,
} from '@nestjs/common';

import { PrismaService } from '../../prisma/prisma.service';
import { ageLockedUserIds, bannedUserIds } from '../auth/ban-list';
import { ImageModerationService } from '../moderation/image-moderation.service';
import { authorSelect, pageMeta } from '../posts/post-view';

export type ReportAction = 'DISMISS' | 'REMOVE_CONTENT' | 'BAN_USER';

const WEEK_MS = 7 * 24 * 60 * 60 * 1000;
// Bị từ chừng này người khác nhau báo cáo hội thoại ẩn danh trong 30 ngày: bỏ qua một báo cáo
// không trả lại quyền gửi ẩn danh; admin phải trả lại bằng tay.
const ANONYMOUS_REPORT_LIMIT = 3;
const MONTH_MS = 30 * 24 * 60 * 60 * 1000;

// Thứ tự xử lý trong hàng đợi, nặng nhất trước (lý do lấy từ CreateReportDto).
const SEVERITY = ['CHILD_SAFETY', 'SCAM', 'HARASSMENT', 'SENSITIVE', 'MISINFORMATION', 'SPAM', 'OTHER'];

function severityOf(reason: string): number {
    const index = SEVERITY.indexOf(reason);

    return index === -1 ? SEVERITY.length : index + 1;
}

type ConversationSnapshot = {
    conversationId: string;
    kind: string;
    reportedUserId: string;
    anonymous: boolean;
    messages: unknown[];
};

@Injectable()
export class AdminService implements OnModuleInit {
    constructor(
        private readonly prisma: PrismaService,
        private readonly imageModeration: ImageModerationService,
    ) { }

    // Nạp danh sách tài khoản bị khóa (admin khóa, khóa vì tuổi) để JwtStrategy chặn mà không phải
    // hỏi database mỗi request.
    async onModuleInit(): Promise<void> {
        const [banned, ageLocked] = await Promise.all([
            this.prisma.user.findMany({
                where: { bannedAt: { not: null } },
                select: { id: true },
            }),
            this.prisma.user.findMany({
                where: { ageLockedAt: { not: null } },
                select: { id: true },
            }),
        ]);

        banned.forEach((user) => bannedUserIds.add(user.id));
        ageLocked.forEach((user) => ageLockedUserIds.add(user.id));
    }

    async stats() {
        const since = new Date(Date.now() - WEEK_MS);
        const [users, newUsers, posts, newPosts, openReports, bannedUsers, activeStories, newMessages] =
            await Promise.all([
                this.prisma.user.count({ where: { deletedAt: null } }),
                this.prisma.user.count({ where: { deletedAt: null, createdAt: { gte: since } } }),
                this.prisma.post.count({ where: { deletedAt: null } }),
                this.prisma.post.count({
                    where: { deletedAt: null, createdAt: { gte: since } },
                }),
                this.prisma.report.count({ where: { status: 'OPEN' } }),
                this.prisma.user.count({ where: { bannedAt: { not: null } } }),
                this.prisma.story.count({ where: { expiresAt: { gt: new Date() } } }),
                this.prisma.message.count({ where: { createdAt: { gte: since } } }),
            ]);

        return {
            data: {
                users,
                newUsers,
                posts,
                newPosts,
                openReports,
                bannedUsers,
                activeStories,
                newMessages,
                // 'unavailable': ảnh trong tin nhắn đang không được làm mờ.
                imageModeration: this.imageModeration.status(),
            },
        };
    }

    // Ghi một dòng nhật ký cho mọi thao tác của quản trị viên.
    private audit(actorId: string, action: string, targetType: string, targetId: string, reason?: string | null) {
        return this.prisma.auditLog.create({
            data: { actorId, action, targetType, targetId, reason: reason || null },
        });
    }

    async findAudit(page: number, limit: number) {
        const [rows, total] = await Promise.all([
            this.prisma.auditLog.findMany({
                orderBy: { createdAt: 'desc' },
                skip: (page - 1) * limit,
                take: limit,
                include: { actor: { select: authorSelect } },
            }),
            this.prisma.auditLog.count(),
        ]);

        return { data: rows, meta: pageMeta(page, limit, total) };
    }

    // Hàng đợi: mỗi mục là một đối tượng bị báo cáo, gộp mọi báo cáo về nó. Đang mở: lý do nặng nhất
    // trước, rồi nhiều người báo cáo hơn, rồi cũ hơn. CLOSED: đã xử lý hoặc đã bỏ qua, mới xử lý trước.
    async findReports(status: string, page: number, limit: number) {
        const where = status === 'CLOSED' ? { status: { in: ['RESOLVED', 'DISMISSED'] } } : { status };
        // shortcut: gộp nhóm trong bộ nhớ trên toàn bộ báo cáo đang mở, chuyển sang groupBy trong SQL khi hàng đợi lên hàng nghìn.
        const all = await this.prisma.report.findMany({
            where,
            orderBy: status === 'OPEN' ? { createdAt: 'asc' } : { resolvedAt: 'desc' },
            include: { reporter: { select: authorSelect } },
        });

        const groups = new Map<string, typeof all>();
        for (const report of all) {
            // Báo cáo đã đóng: mỗi lần xử lý là một mục (cùng resolvedAt).
            const key = `${report.targetType}:${report.targetId}` +
                (status === 'OPEN' ? '' : `:${report.resolvedAt?.toISOString()}`);
            groups.set(key, [...(groups.get(key) ?? []), report]);
        }

        const items = [...groups.values()].map((group) => {
            const reason = group
                .map((report) => report.reason)
                .sort((a, b) => severityOf(a) - severityOf(b))[0];

            return { group, reason, severity: severityOf(reason) };
        });

        if (status === 'OPEN') {
            items.sort((a, b) =>
                a.severity - b.severity ||
                b.group.length - a.group.length ||
                a.group[0].createdAt.getTime() - b.group[0].createdAt.getTime());
        }

        const pageItems = items.slice((page - 1) * limit, page * limit);
        const reports = pageItems.map((item) => item.group[0]);

        const idsOf = (type: string) =>
            reports.filter((report) => report.targetType === type).map((report) => report.targetId);

        const [posts, comments, users] = await Promise.all([
            this.prisma.post.findMany({
                where: { id: { in: idsOf('POST') } },
                select: {
                    id: true,
                    content: true,
                    deletedAt: true,
                    author: { select: { ...authorSelect, bannedAt: true } },
                    media: {
                        orderBy: { order: 'asc' },
                        take: 1,
                        select: { type: true, url: true, thumbnailUrl: true },
                    },
                },
            }),
            this.prisma.comment.findMany({
                where: { id: { in: idsOf('COMMENT') } },
                select: {
                    id: true,
                    content: true,
                    postId: true,
                    removedAt: true,
                    user: { select: { ...authorSelect, bannedAt: true } },
                },
            }),
            this.prisma.user.findMany({
                where: { id: { in: idsOf('USER') } },
                select: { ...authorSelect, bannedAt: true },
            }),
        ]);

        const targets = new Map<string, unknown>([
            ...posts.map((post) => [`POST:${post.id}`, post] as const),
            ...comments.map(
                ({ user, ...comment }) =>
                    [`COMMENT:${comment.id}`, { ...comment, author: user }] as const,
            ),
            ...users.map((user) => [`USER:${user.id}`, user] as const),
        ]);

        // Hội thoại: không trả danh tính thật hay bản chụp tin ở đây; admin phải nêu lý do (viewIdentity).
        const conversationTarget = (report: (typeof all)[number]) => {
            const snapshot = report.snapshot as ConversationSnapshot | null;

            return snapshot && {
                conversationId: snapshot.conversationId,
                kind: snapshot.kind,
                anonymous: snapshot.anonymous,
                messageCount: snapshot.messages.length,
                identityHidden: true,
            };
        };

        return {
            data: pageItems.map(({ group, reason, severity }) => {
                const report = group[0];

                return {
                    id: report.id,
                    targetType: report.targetType,
                    targetId: report.targetId,
                    // Lý do nặng nhất trong nhóm; severity 1 là nặng nhất.
                    reason,
                    severity,
                    note: report.note,
                    status: report.status,
                    createdAt: report.createdAt,
                    resolvedAt: report.resolvedAt,
                    reporter: report.reporter,
                    // Mỗi người chỉ báo cáo một đối tượng một lần, nên số báo cáo = số người báo cáo.
                    reportCount: group.length,
                    reports: group.map(({ id, reason, note, createdAt, reporter }) => ({
                        id, reason, note, createdAt, reporter,
                    })),
                    // null khi nội dung đã bị xóa hẳn.
                    target:
                        report.targetType === 'CONVERSATION'
                            ? conversationTarget(report)
                            : targets.get(`${report.targetType}:${report.targetId}`) ?? null,
                };
            }),
            meta: pageMeta(page, limit, items.length),
        };
    }

    // Xem bản chụp tin nhắn và danh tính thật của người bị báo cáo trong một hội thoại: bắt buộc có lý do, ghi nhật ký.
    async viewIdentity(adminId: string, reportId: string, reason: string) {
        const report = await this.prisma.report.findUnique({ where: { id: reportId } });
        const snapshot = report?.snapshot as ConversationSnapshot | null | undefined;

        if (!report || report.targetType !== 'CONVERSATION' || !snapshot) {
            throw new NotFoundException('Conversation report not found');
        }

        const author = await this.prisma.user.findUnique({
            where: { id: snapshot.reportedUserId },
            select: { ...authorSelect, bannedAt: true, anonymousSuspendedAt: true },
        });

        await this.audit(adminId, 'VIEW_IDENTITY', 'CONVERSATION', report.targetId, reason);

        return { data: { ...snapshot, author } };
    }

    // Khôi phục bình luận đã bị gỡ (kháng nghị đúng).
    async restoreComment(adminId: string, commentId: string, reason?: string) {
        const result = await this.prisma.comment.updateMany({
            where: { id: commentId, removedAt: { not: null } },
            data: { removedAt: null },
        });

        if (result.count === 0) {
            throw new NotFoundException('Removed comment not found');
        }

        await this.audit(adminId, 'COMMENT_RESTORE', 'COMMENT', commentId, reason);

        return { data: { id: commentId, restored: true } };
    }

    // Mọi báo cáo đang mở về cùng một đối tượng được đóng cùng lúc.
    async resolveReport(adminId: string, reportId: string, action: ReportAction, reason?: string) {
        const report = await this.prisma.report.findUnique({ where: { id: reportId } });

        if (!report) {
            throw new NotFoundException('Report not found');
        }

        const { targetType, targetId } = report;
        const snapshot = report.snapshot as ConversationSnapshot | null;

        if (action === 'REMOVE_CONTENT') {
            if (targetType === 'POST') {
                await this.prisma.post.updateMany({
                    where: { id: targetId, deletedAt: null },
                    data: { deletedAt: new Date() },
                });
            } else if (targetType === 'COMMENT') {
                // Ẩn, không xóa: khôi phục được bằng POST /admin/comments/:id/restore.
                await this.prisma.comment.updateMany({
                    where: { id: targetId, removedAt: null },
                    data: { removedAt: new Date() },
                });
            } else {
                throw new BadRequestException('Only posts and comments can be removed; ban the user instead');
            }
        }

        if (action === 'BAN_USER') {
            const userId =
                targetType === 'USER'
                    ? targetId
                    : targetType === 'CONVERSATION'
                        ? snapshot?.reportedUserId
                        : targetType === 'POST'
                        ? (await this.prisma.post.findUnique({
                            where: { id: targetId },
                            select: { authorId: true },
                        }))?.authorId
                        : (await this.prisma.comment.findUnique({
                            where: { id: targetId },
                            select: { userId: true },
                        }))?.userId;

            if (!userId) {
                throw new NotFoundException('The reported content no longer exists');
            }

            await this.setBanned(adminId, userId, true, reason);
        }

        // Bỏ qua báo cáo hội thoại ẩn danh: trả lại quyền gửi ẩn danh, trừ khi người đó đã bị nhiều
        // người khác nhau báo cáo gần đây.
        if (action === 'DISMISS' && snapshot?.anonymous) {
            const reporters = await this.prisma.report.findMany({
                where: {
                    targetType: 'CONVERSATION',
                    status: { not: 'DISMISSED' },
                    id: { not: reportId },
                    createdAt: { gte: new Date(Date.now() - MONTH_MS) },
                    snapshot: { path: ['reportedUserId'], equals: snapshot.reportedUserId },
                },
                select: { reporterId: true },
                distinct: ['reporterId'],
            });

            if (reporters.length < ANONYMOUS_REPORT_LIMIT) {
                await this.setAnonymousAllowed(adminId, snapshot.reportedUserId, true, 'Tự động: bỏ qua báo cáo hội thoại');
            }
        }

        await this.prisma.report.updateMany({
            where: { targetType, targetId, status: 'OPEN' },
            data: {
                status: action === 'DISMISS' ? 'DISMISSED' : 'RESOLVED',
                resolvedAt: new Date(),
                resolvedById: adminId,
            },
        });

        await this.audit(adminId, `REPORT_${action}`, targetType, targetId, reason ?? `Báo cáo: ${report.reason}`);

        return { data: { resolved: true } };
    }

    async findUsers(q: string, page: number, limit: number) {
        const where = q
            ? {
                OR: [
                    { username: { contains: q, mode: 'insensitive' as const } },
                    { displayName: { contains: q, mode: 'insensitive' as const } },
                    { email: { contains: q, mode: 'insensitive' as const } },
                ],
            }
            : {};

        const [users, total] = await Promise.all([
            this.prisma.user.findMany({
                where,
                orderBy: { createdAt: 'desc' },
                skip: (page - 1) * limit,
                take: limit,
                select: {
                    ...authorSelect,
                    email: true,
                    role: true,
                    bannedAt: true,
                    ageLockedAt: true,
                    anonymousSuspendedAt: true,
                    birthDate: true,
                    createdAt: true,
                    deletedAt: true,
                    _count: { select: { posts: true, followers: true } },
                },
            }),
            this.prisma.user.count({ where }),
        ]);

        return { data: users, meta: pageMeta(page, limit, total) };
    }

    // Tài khoản bị khóa không đăng nhập được và mọi token đang có bị từ chối.
    async setBanned(adminId: string, userId: string, banned: boolean, reason?: string) {
        const user = await this.prisma.user.findUnique({
            where: { id: userId },
            select: { id: true, role: true },
        });

        if (!user) {
            throw new NotFoundException('User not found');
        }

        if (banned && (user.id === adminId || user.role === 'ADMIN')) {
            throw new BadRequestException('Administrators cannot be banned');
        }

        await this.prisma.user.update({
            where: { id: userId },
            data: { bannedAt: banned ? new Date() : null },
        });

        if (banned) {
            bannedUserIds.add(userId);
        } else {
            bannedUserIds.delete(userId);
        }

        await this.audit(adminId, banned ? 'BAN' : 'UNBAN', 'USER', userId, reason);

        return { data: { id: userId, banned } };
    }

    // Mở khóa tài khoản bị khóa vì tuổi (ví dụ khai nhầm ngày sinh và đã xác minh lại).
    // Ngày sinh được xóa để người dùng khai lại.
    async unlockAge(adminId: string, userId: string, reason?: string) {
        const user = await this.prisma.user.updateMany({
            where: { id: userId },
            data: { ageLockedAt: null, birthDate: null },
        });

        if (user.count === 0) {
            throw new NotFoundException('User not found');
        }

        ageLockedUserIds.delete(userId);
        await this.audit(adminId, 'AGE_UNLOCK', 'USER', userId, reason);

        return { data: { id: userId, ageLocked: false } };
    }

    async setAnonymousAllowed(adminId: string, userId: string, allowed: boolean, reason?: string) {
        const user = await this.prisma.user.updateMany({
            where: { id: userId },
            data: { anonymousSuspendedAt: allowed ? null : new Date() },
        });

        if (user.count === 0) {
            throw new NotFoundException('User not found');
        }

        await this.audit(adminId, allowed ? 'ANONYMOUS_RESTORE' : 'ANONYMOUS_SUSPEND', 'USER', userId, reason);

        return { data: { id: userId, anonymousAllowed: allowed } };
    }
}
