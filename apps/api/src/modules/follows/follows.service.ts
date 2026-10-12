import {
    BadRequestException,
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

    async follow(currentUserId: string, targetUserId: string) {
        if (currentUserId === targetUserId) {
            throw new BadRequestException('Cannot follow yourself');
        }

        const blocked = await blockedUserIds(this.prisma, currentUserId);
        const targetUser = blocked.includes(targetUserId)
            ? null
            : await this.prisma.user.findUnique({
                where: { id: targetUserId },
                select: { id: true },
            });

        if (!targetUser) {
            throw new NotFoundException('User not found');
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

        return { data: { following: true } };
    }

    async unfollow(currentUserId: string, targetUserId: string) {
        await this.prisma.follow.deleteMany({
            where: {
                followerId: currentUserId,
                followingId: targetUserId,
            },
        });

        return { data: { following: false } };
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
