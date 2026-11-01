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
                this.prisma.user.count(),
                this.prisma.user.count({ where: { createdAt: { gte: since } } }),
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

    // Báo cáo kèm nội dung bị báo cáo, để người duyệt quyết định ngay trên một dòng.
    async findReports(status: string, page: number, limit: number) {
        const where = { status };
        const [reports, total] = await Promise.all([
            this.prisma.report.findMany({
                where,
                orderBy: { createdAt: 'desc' },
                skip: (page - 1) * limit,
                take: limit,
                include: { reporter: { select: authorSelect } },
            }),
            this.prisma.report.count({ where }),
        ]);

        const idsOf = (type: string) =>
            reports.filter((report) => report.targetType === type).map((report) => report.targetId);

        const conversationReports = reports.filter((report) => report.targetType === 'CONVERSATION');
        const reportedIds = conversationReports.map(
            (report) => (report.snapshot as ConversationSnapshot | null)?.reportedUserId ?? '',
        );

        const [posts, comments, users, reportedUsers] = await Promise.all([
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
                    user: { select: { ...authorSelect, bannedAt: true } },
                },
            }),
            this.prisma.user.findMany({
                where: { id: { in: idsOf('USER') } },
                select: { ...authorSelect, bannedAt: true },
            }),
            this.prisma.user.findMany({
                where: { id: { in: reportedIds } },
                select: { ...authorSelect, bannedAt: true, anonymousSuspendedAt: true },
            }),
        ]);
        const reportedById = new Map(reportedUsers.map((user) => [user.id, user]));

        const targets = new Map<string, unknown>([
            ...posts.map((post) => [`POST:${post.id}`, post] as const),
            ...comments.map(
                ({ user, ...comment }) =>
                    [`COMMENT:${comment.id}`, { ...comment, author: user }] as const,
            ),
            ...users.map((user) => [`USER:${user.id}`, user] as const),
            // Hội thoại: danh tính thật của người bị báo cáo (kể cả khi họ ẩn danh) và bản chụp tin.
            ...conversationReports.map((report) => {
                const snapshot = report.snapshot as ConversationSnapshot | null;

                return [
                    `CONVERSATION:${report.targetId}`,
                    snapshot && {
                        ...snapshot,
                        author: reportedById.get(snapshot.reportedUserId) ?? null,
                    },
                ] as const;
            }),
        ]);

        return {
            data: reports.map((report) => ({
                id: report.id,
                targetType: report.targetType,
                targetId: report.targetId,
                reason: report.reason,
                note: report.note,
                status: report.status,
                createdAt: report.createdAt,
                reporter: report.reporter,
                // null khi nội dung đã bị xóa hẳn.
                target: targets.get(`${report.targetType}:${report.targetId}`) ?? null,
            })),
            meta: pageMeta(page, limit, total),
        };
    }

    // Mọi báo cáo đang mở về cùng một đối tượng được đóng cùng lúc.
    async resolveReport(adminId: string, reportId: string, action: ReportAction) {
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
                await this.prisma.comment.deleteMany({ where: { id: targetId } });
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

            await this.setBanned(adminId, userId, true);
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
                await this.setAnonymousAllowed(snapshot.reportedUserId, true);
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
                    _count: { select: { posts: true, followers: true } },
                },
            }),
            this.prisma.user.count({ where }),
        ]);

        return { data: users, meta: pageMeta(page, limit, total) };
    }

    // Tài khoản bị khóa không đăng nhập được và mọi token đang có bị từ chối.
    async setBanned(adminId: string, userId: string, banned: boolean) {
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

        return { data: { id: userId, banned } };
    }

    // Mở khóa tài khoản bị khóa vì tuổi (ví dụ khai nhầm ngày sinh và đã xác minh lại).
    // Ngày sinh được xóa để người dùng khai lại.
    async unlockAge(userId: string) {
        const user = await this.prisma.user.updateMany({
            where: { id: userId },
            data: { ageLockedAt: null, birthDate: null },
        });

        if (user.count === 0) {
            throw new NotFoundException('User not found');
        }

        ageLockedUserIds.delete(userId);

        return { data: { id: userId, ageLocked: false } };
    }

    async setAnonymousAllowed(userId: string, allowed: boolean) {
        const user = await this.prisma.user.updateMany({
            where: { id: userId },
            data: { anonymousSuspendedAt: allowed ? null : new Date() },
        });

        if (user.count === 0) {
            throw new NotFoundException('User not found');
        }

        return { data: { id: userId, anonymousAllowed: allowed } };
    }
}
