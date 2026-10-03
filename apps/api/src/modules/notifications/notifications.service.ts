import {
    Injectable,
    NotFoundException,
} from '@nestjs/common';

import { PrismaService } from '../../prisma/prisma.service';
import { NotificationsQueryDto } from './dto/notifications-query.dto';
import { NotificationsGateway } from "./notifications.gateway";
@Injectable()
export class NotificationsService {
    constructor(
        private readonly prisma: PrismaService,
        private readonly notificationsGateway: NotificationsGateway,
    ) { }

    async createLikeNotification(
        actorId: string,
        postId: string,
        recipientId: string,
    ) {
        if (actorId === recipientId) {
            return;
        }

        const notification =
            await this.prisma.notification.create({
                data: {
                    type: 'LIKE',
                    actorId,
                    recipientId,
                    postId,
                },
            });

        this.notificationsGateway.emitToUser(
            recipientId,
            notification,
        );

        return notification;
    }

    async createCommentNotification(
        actorId: string,
        postId: string,
        commentId: string,
        recipientId: string,
    ) {
        if (actorId === recipientId) {
            return;
        }

        const notification =
            await this.prisma.notification.create({
                data: {
                    type: 'COMMENT',
                    actorId,
                    recipientId,
                    postId,
                    commentId,
                },
            });

        this.notificationsGateway.emitToUser(
            recipientId,
            notification,
        );

        return notification;
    }

    async createFollowNotification(
        actorId: string,
        recipientId: string,
    ) {
        if (actorId === recipientId) {
            return;
        }

        const notification =
            await this.prisma.notification.create({
                data: {
                    type: 'FOLLOW',
                    actorId,
                    recipientId,
                },
            });

        this.notificationsGateway.emitToUser(
            recipientId,
            notification,
        );

        return notification;
    }

    async findMyNotifications(
        userId: string,
        query: NotificationsQueryDto,
    ) {
        const { page, limit } = query;
        const skip = (page - 1) * limit;

        const [notifications, total, unreadCount] =
            await Promise.all([
                this.prisma.notification.findMany({
                    where: {
                        recipientId: userId,
                    },
                    orderBy: {
                        createdAt: 'desc',
                    },
                    skip,
                    take: limit,
                    select: {
                        id: true,
                        type: true,
                        createdAt: true,
                        readAt: true,

                        actor: {
                            select: {
                                id: true,
                                username: true,
                                displayName: true,
                                avatarUrl: true,
                            },
                        },

                        post: {
                            select: {
                                id: true,
                            },
                        },

                        comment: {
                            select: {
                                id: true,
                            },
                        },
                    },
                }),

                this.prisma.notification.count({
                    where: {
                        recipientId: userId,
                    },
                }),

                this.prisma.notification.count({
                    where: {
                        recipientId: userId,
                        readAt: null,
                    },
                }),
            ]);

        return {
            data: notifications,
            meta: {
                page,
                limit,
                total,
                unreadCount,
                totalPages: Math.ceil(total / limit),
            },
        };
    }

    async markAsRead(
        userId: string,
        notificationId: string,
    ) {
        const notification =
            await this.prisma.notification.findFirst({
                where: {
                    id: notificationId,
                    recipientId: userId,
                },
                select: {
                    id: true,
                },
            });

        if (!notification) {
            throw new NotFoundException(
                'Notification not found',
            );
        }

        const updated = await this.prisma.notification.update({
            where: {
                id: notificationId,
            },
            data: {
                readAt: new Date(),
            },
            select: {
                id: true,
                readAt: true,
            },
        });

        return {
            data: updated,
        };
    }

    async markAllAsRead(userId: string) {
        const result = await this.prisma.notification.updateMany({
            where: {
                recipientId: userId,
                readAt: null,
            },
            data: {
                readAt: new Date(),
            },
        });

        return {
            data: {
                updatedCount: result.count,
            },
        };
    }
}