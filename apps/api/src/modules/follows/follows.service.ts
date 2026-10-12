import {
    BadRequestException,
    ForbiddenException,
    Injectable,
    NotFoundException,
} from '@nestjs/common';

import { NotificationsService } from '../notifications/notifications.service';
import { PrismaService } from '../../prisma/prisma.service';
import { authorSelect, blockedUserIds, pageMeta } from '../posts/post-view';

@Injectable()
export class FollowsService {
    constructor(
        private readonly prisma: PrismaService,
        private readonly notificationsService: NotificationsService,
    ) { }

    // Tài khoản công khai: theo dõi ngay. Tài khoản riêng tư: tạo yêu cầu chờ duyệt.
    async follow(currentUserId: string, targetUserId: string) {
        if (currentUserId === targetUserId) {
            throw new BadRequestException('Cannot follow yourself');
        }

        const blocked = await blockedUserIds(this.prisma, currentUserId);

        const targetUser = blocked.includes(targetUserId)
            ? null
            : await this.prisma.user.findUnique({
                where: { id: targetUserId },
                select: {
                    id: true,
                    isPrivate: true,
                    followers: {
                        where: { followerId: currentUserId },
                        select: { followerId: true },
                    },
                },
            });

        if (!targetUser) {
            throw new NotFoundException('User not found');
        }

        if (targetUser.isPrivate && targetUser.followers.length === 0) {
            const requested = await this.prisma.followRequest.createMany({
                data: [{ requesterId: currentUserId, targetId: targetUserId }],
                skipDuplicates: true,
            });

            if (requested.count > 0) {
                await this.notificationsService.notify({
                    type: 'FOLLOW_REQUEST',
                    actorId: currentUserId,
                    recipientId: targetUserId,
                });
            }

            return { data: { following: false, requested: true } };
        }

        const created = await this.prisma.follow.createMany({
            data: [{
                followerId: currentUserId,
                followingId: targetUserId,
            }],
            skipDuplicates: true,
        });

        if (created.count > 0) {
            await this.notificationsService.notify({
                type: 'FOLLOW',
                actorId: currentUserId,
                recipientId: targetUserId,
            });
        }

        return { data: { following: true, requested: false } };
    }

    // Bỏ theo dõi cũng rút lại yêu cầu đang chờ.
    async unfollow(currentUserId: string, targetUserId: string) {
        await this.prisma.$transaction([
            this.prisma.follow.deleteMany({
                where: {
                    followerId: currentUserId,
                    followingId: targetUserId,
                },
            }),
            this.prisma.followRequest.deleteMany({
                where: { requesterId: currentUserId, targetId: targetUserId },
            }),
        ]);

        return { data: { following: false, requested: false } };
    }

    async findRequests(userId: string) {
        const requests = await this.prisma.followRequest.findMany({
            where: { targetId: userId },
            orderBy: { createdAt: 'desc' },
            take: 100,
            select: { createdAt: true, requester: { select: authorSelect } },
        });

        return {
            data: requests.map((request) => ({
                ...request.requester,
                requestedAt: request.createdAt,
            })),
        };
    }

    // accept = false: từ chối (xóa yêu cầu, không báo cho người gửi).
    async answerRequest(userId: string, requesterId: string, accept: boolean) {
        const removed = await this.prisma.followRequest.deleteMany({
            where: { requesterId, targetId: userId },
        });

        if (removed.count === 0) {
            throw new NotFoundException('Follow request not found');
        }

        if (accept) {
            await this.prisma.follow.createMany({
                data: [{ followerId: requesterId, followingId: userId }],
                skipDuplicates: true,
            });
            await this.notificationsService.notify({
                type: 'FOLLOW_ACCEPT',
                actorId: userId,
                recipientId: requesterId,
            });
        }

        return { data: { accepted: accept } };
    }

    // side = cột chứa người cần liệt kê; cột còn lại là userId đang xem danh sách.
    private async list(
        viewerId: string,
        userId: string,
        side: 'follower' | 'following',
        page: number,
        limit: number,
    ) {
        const blocked = await blockedUserIds(this.prisma, viewerId);

        // Danh sách của tài khoản riêng tư chỉ dành cho chính chủ và người theo dõi.
        if (viewerId !== userId) {
            const target = await this.prisma.user.findUnique({
                where: { id: userId },
                select: {
                    isPrivate: true,
                    followers: {
                        where: { followerId: viewerId },
                        select: { followerId: true },
                    },
                },
            });

            if (target?.isPrivate && target.followers.length === 0) {
                throw new ForbiddenException('This account is private');
            }
        }

        const where =
            side === 'follower'
                ? { followingId: userId, followerId: { notIn: blocked } }
                : { followerId: userId, followingId: { notIn: blocked } };

        const [rows, total] = await Promise.all([
            this.prisma.follow.findMany({
                where,
                orderBy: { createdAt: 'desc' },
                skip: (page - 1) * limit,
                take: limit,
                select: { [side]: { select: authorSelect } },
            }),
            this.prisma.follow.count({ where }),
        ]);

        const users = rows.map(
            (row) =>
                (row as unknown as Record<string, { id: string }>)[side],
        );

        const followed = await this.prisma.follow.findMany({
            where: {
                followerId: viewerId,
                followingId: { in: users.map((user) => user.id) },
            },
            select: { followingId: true },
        });
        const followedIds = new Set(followed.map((row) => row.followingId));

        return {
            data: users.map((user) => ({
                ...user,
                isFollowing: followedIds.has(user.id),
            })),
            meta: pageMeta(page, limit, total),
        };
    }

    getFollowers(viewerId: string, userId: string, page: number, limit: number) {
        return this.list(viewerId, userId, 'follower', page, limit);
    }

    getFollowing(viewerId: string, userId: string, page: number, limit: number) {
        return this.list(viewerId, userId, 'following', page, limit);
    }
}
