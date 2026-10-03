import {
    BadRequestException,
    Injectable,
    NotFoundException,
} from '@nestjs/common';

import { NotificationsService } from '../notifications/notifications.service';
import { PrismaService } from '../../prisma/prisma.service';

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

        const targetUser = await this.prisma.user.findUnique({
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
            await this.notificationsService.createFollowNotification(
                currentUserId,
                targetUserId,
            );
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

    async getFollowers(userId: string, page: number, limit: number) {
        const skip = (page - 1) * limit;
        const [followers, total] = await Promise.all([
            this.prisma.follow.findMany({
                where: { followingId: userId },
                orderBy: { followerId: 'asc' },
                skip,
                take: limit,
                select: {
                    follower: {
                        select: {
                            id: true,
                            username: true,
                            displayName: true,
                            avatarUrl: true,
                        },
                    },
                },
            }),
            this.prisma.follow.count({ where: { followingId: userId } }),
        ]);

        return {
            data: followers.map((item) => item.follower),
            meta: { page, limit, total, totalPages: Math.ceil(total / limit) },
        };
    }

    async getFollowing(userId: string, page: number, limit: number) {
        const skip = (page - 1) * limit;
        const [following, total] = await Promise.all([
            this.prisma.follow.findMany({
                where: { followerId: userId },
                orderBy: { followingId: 'asc' },
                skip,
                take: limit,
                select: {
                    following: {
                        select: {
                            id: true,
                            username: true,
                            displayName: true,
                            avatarUrl: true,
                        },
                    },
                },
            }),
            this.prisma.follow.count({ where: { followerId: userId } }),
        ]);

        return {
            data: following.map((item) => item.following),
            meta: { page, limit, total, totalPages: Math.ceil(total / limit) },
        };
    }
}
