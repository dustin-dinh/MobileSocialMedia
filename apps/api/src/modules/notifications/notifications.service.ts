import {
    Injectable,
    NotFoundException,
} from '@nestjs/common';

import { PrismaService } from '../../prisma/prisma.service';
import { NotificationsQueryDto } from './dto/notifications-query.dto';
import { NotificationsGateway } from "./notifications.gateway";
import { authorSelect } from '../posts/post-view';

const PUSH_VERBS: Record<string, string> = {
    LIKE: 'đã thích bài viết của bạn',
    COMMENT: 'đã bình luận bài viết của bạn',
    REPLY: 'đã trả lời bình luận của bạn',
    FOLLOW: 'đã theo dõi bạn',
    REPOST: 'đã đăng lại bài viết của bạn',
    MENTION: 'đã nhắc đến bạn',
};

@Injectable()
export class NotificationsService {
    constructor(
        private readonly prisma: PrismaService,
        private readonly notificationsGateway: NotificationsGateway,
    ) { }

    // Mọi loại thông báo đi qua đây: lưu, đẩy realtime qua socket, rồi gửi push.
    async notify(input: {
        type: 'LIKE' | 'COMMENT' | 'REPLY' | 'FOLLOW' | 'REPOST' | 'MENTION';
        actorId: string;
        recipientId: string;
        postId?: string;
        commentId?: string;
    }) {
        const { actorId, recipientId } = input;

        if (actorId === recipientId) {
            return;
        }

        const blocked = await this.prisma.block.count({
            where: {
                OR: [
                    { blockerId: recipientId, blockedId: actorId },
                    { blockerId: actorId, blockedId: recipientId },
                ],
            },
        });

        if (blocked > 0) {
            return;
        }

        const notification = await this.prisma.notification.create({
            data: input,
            include: { actor: { select: authorSelect } },
        });

        // Gửi realtime là phụ: lỗi socket không được làm hỏng thao tác chính.
        void this.notificationsGateway
            .emitToUser(recipientId, notification)
            .catch(() => undefined);
        void this.push(notification);

        return notification;
    }

    async notifyMentions(
        actorId: string,
        content: string | null | undefined,
        postId: string,
        commentId?: string,
    ) {
        const usernames = [
            ...new Set(
                [...(content ?? '').matchAll(/@([a-zA-Z0-9._]{3,30})/g)].map(
                    (match) => match[1],
                ),
            ),
        ];

        if (usernames.length === 0) {
            return;
        }

        const users = await this.prisma.user.findMany({
            where: { username: { in: usernames } },
            select: { id: true },
        });

        for (const user of users) {
            await this.notify({
                type: 'MENTION',
                actorId,
                recipientId: user.id,
                postId,
                commentId,
            });
        }
    }

    // shortcut: không dọn token mà Expo báo DeviceNotRegistered, nâng cấp khi lượng push đáng kể.
    private async push(notification: {
        type: string;
        recipientId: string;
        postId: string | null;
        commentId: string | null;
        actor: { id: string; username: string; displayName: string | null };
    }) {
        try {
            const devices = await this.prisma.deviceToken.findMany({
                where: { userId: notification.recipientId },
                select: { token: true },
            });

            if (devices.length === 0) {
                return;
            }

            const name =
                notification.actor.displayName ?? notification.actor.username;

            await fetch('https://exp.host/--/api/v2/push/send', {
                method: 'POST',
                headers: { 'Content-Type': 'application/json' },
                body: JSON.stringify(
                    devices.map((device) => ({
                        to: device.token,
                        title: 'MobileSocialMedia',
                        body: `${name} ${PUSH_VERBS[notification.type] ?? ''}`.trim(),
                        data: {
                            type: notification.type,
                            postId: notification.postId,
                            commentId: notification.commentId,
                            actorId: notification.actor.id,
                        },
                    })),
                ),
            });
        } catch {
            // Push là phụ: lỗi mạng tới Expo không được làm hỏng hành động gốc.
        }
    }

    async registerDevice(userId: string, token: string, platform: string) {
        await this.prisma.deviceToken.upsert({
            where: { token },
            create: { token, userId, platform },
            update: { userId, platform },
        });

        return { data: { registered: true } };
    }

    async unregisterDevice(userId: string, token: string) {
        await this.prisma.deviceToken.deleteMany({ where: { token, userId } });

        return { data: { registered: false } };
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
                            select: authorSelect,
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
