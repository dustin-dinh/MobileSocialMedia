import {
    BadRequestException,
    ForbiddenException,
    Injectable,
    NotFoundException,
} from '@nestjs/common';
import { v4 as uuidv4 } from 'uuid';

import { PrismaService } from '../../prisma/prisma.service';
import { NotificationsGateway } from '../notifications/notifications.gateway';
import { NotificationsService } from '../notifications/notifications.service';
import { authorSelect, blockedUserIds } from '../posts/post-view';
import { StorageService } from '../storage/storage.service';

const MAX_MESSAGE_LENGTH = 2000;
const MAX_IMAGE_BYTES = 5 * 1024 * 1024;
const IMAGE_TYPES = ['image/jpeg', 'image/png', 'image/webp'];

const messageSelect = {
    id: true,
    conversationId: true,
    senderId: true,
    content: true,
    imageUrl: true,
    createdAt: true,
} as const;

// Nhắn tin 1:1. Mỗi cặp người dùng có đúng một hội thoại (userAId < userBId).
@Injectable()
export class MessagesService {
    constructor(
        private readonly prisma: PrismaService,
        private readonly storageService: StorageService,
        private readonly gateway: NotificationsGateway,
        private readonly notificationsService: NotificationsService,
    ) { }

    private async requireMember(conversationId: string, userId: string) {
        const conversation = await this.prisma.conversation.findUnique({
            where: { id: conversationId },
        });

        if (
            !conversation ||
            (conversation.userAId !== userId && conversation.userBId !== userId)
        ) {
            throw new NotFoundException('Conversation not found');
        }

        const isA = conversation.userAId === userId;

        return {
            conversation,
            peerId: isA ? conversation.userBId : conversation.userAId,
            // Cột lưu thời điểm đọc của mình và của người kia.
            myReadField: (isA ? 'userAReadAt' : 'userBReadAt') as
                | 'userAReadAt'
                | 'userBReadAt',
            peerReadAt: isA ? conversation.userBReadAt : conversation.userAReadAt,
        };
    }

    // Số tin chưa đọc theo từng hội thoại của một người dùng (chỉ các hội thoại có tin chưa đọc).
    private async unreadByConversation(userId: string) {
        const rows = await this.prisma.$queryRaw<{ id: string; unread: number }[]>`
            SELECT m."conversationId" AS id, COUNT(*)::int AS unread
            FROM "Message" m
            JOIN "Conversation" c ON c.id = m."conversationId"
            WHERE (c."userAId" = ${userId} OR c."userBId" = ${userId})
              AND m."senderId" <> ${userId}
              AND m."createdAt" > COALESCE(
                    CASE WHEN c."userAId" = ${userId} THEN c."userAReadAt" ELSE c."userBReadAt" END,
                    'epoch'::timestamp)
            GROUP BY m."conversationId"`;

        return new Map(rows.map((row) => [row.id, row.unread]));
    }

    // Mở hội thoại với một người (tạo nếu chưa có).
    async open(userId: string, peerId: string) {
        if (userId === peerId) {
            throw new BadRequestException('Cannot message yourself');
        }

        const blocked = await blockedUserIds(this.prisma, userId);
        const peer = blocked.includes(peerId)
            ? null
            : await this.prisma.user.findUnique({
                where: { id: peerId },
                select: authorSelect,
            });

        if (!peer) {
            throw new NotFoundException('User not found');
        }

        const [userAId, userBId] = userId < peerId ? [userId, peerId] : [peerId, userId];
        const conversation = await this.prisma.conversation.upsert({
            where: { userAId_userBId: { userAId, userBId } },
            create: { userAId, userBId },
            update: {},
        });

        return {
            data: {
                id: conversation.id,
                peer,
                lastMessage: null,
                lastMessageAt: conversation.lastMessageAt,
                unreadCount: 0,
            },
        };
    }

    // Danh sách hội thoại đã có tin nhắn, mới nhất trước.
    async list(userId: string) {
        const blocked = await blockedUserIds(this.prisma, userId);

        const [conversations, unread] = await Promise.all([
            this.prisma.conversation.findMany({
                where: {
                    OR: [{ userAId: userId }, { userBId: userId }],
                    messages: { some: {} },
                    ...(blocked.length
                        ? {
                            userAId: { notIn: blocked },
                            userBId: { notIn: blocked },
                        }
                        : {}),
                },
                orderBy: { lastMessageAt: 'desc' },
                take: 100,
                select: {
                    id: true,
                    userAId: true,
                    lastMessageAt: true,
                    userA: { select: authorSelect },
                    userB: { select: authorSelect },
                    messages: {
                        orderBy: { createdAt: 'desc' },
                        take: 1,
                        select: messageSelect,
                    },
                },
            }),
            this.unreadByConversation(userId),
        ]);

        return {
            data: conversations.map((conversation) => ({
                id: conversation.id,
                peer:
                    conversation.userAId === userId
                        ? conversation.userB
                        : conversation.userA,
                lastMessage: conversation.messages[0] ?? null,
                lastMessageAt: conversation.lastMessageAt,
                unreadCount: unread.get(conversation.id) ?? 0,
            })),
        };
    }

    // Số hội thoại có tin chưa đọc (huy hiệu trên tab Tin nhắn).
    async unreadCount(userId: string) {
        return { data: { count: (await this.unreadByConversation(userId)).size } };
    }

    // Phân trang ngược thời gian: `before` là createdAt của tin cũ nhất đang có ở client.
    async findMessages(
        userId: string,
        conversationId: string,
        before: string | undefined,
        limit: number,
    ) {
        const { peerReadAt } = await this.requireMember(conversationId, userId);

        const rows = await this.prisma.message.findMany({
            where: {
                conversationId,
                ...(before ? { createdAt: { lt: new Date(before) } } : {}),
            },
            orderBy: { createdAt: 'desc' },
            take: limit + 1,
            select: messageSelect,
        });

        return {
            data: rows.slice(0, limit),
            meta: { hasMore: rows.length > limit, peerReadAt },
        };
    }

    async send(
        userId: string,
        conversationId: string,
        dto: { clientId?: string; content?: string },
        file?: Express.Multer.File,
    ) {
        const { peerId, myReadField } = await this.requireMember(
            conversationId,
            userId,
        );

        if ((await blockedUserIds(this.prisma, userId)).includes(peerId)) {
            throw new ForbiddenException('You cannot message this user');
        }

        const content = dto.content?.trim() || null;

        if (!content && !file) {
            throw new BadRequestException('Message must contain text or an image');
        }

        if (content && content.length > MAX_MESSAGE_LENGTH) {
            throw new BadRequestException('Message is too long');
        }

        const id = dto.clientId || uuidv4();

        // Thiết bị gửi lại sau khi mất mạng: cùng clientId thì trả về tin đã lưu.
        const existing = await this.prisma.message.findUnique({
            where: { id },
            select: messageSelect,
        });

        if (existing) {
            if (existing.senderId !== userId || existing.conversationId !== conversationId) {
                throw new BadRequestException('Invalid clientId');
            }

            return { data: existing };
        }

        let imageUrl: string | null = null;

        if (file) {
            if (!IMAGE_TYPES.includes(file.mimetype)) {
                throw new BadRequestException(`Unsupported image type: ${file.mimetype}`);
            }

            if (file.size > MAX_IMAGE_BYTES) {
                throw new BadRequestException('Image must be <= 5MB');
            }

            const extension = file.originalname.split('.').pop()?.toLowerCase() || 'jpg';

            imageUrl = await this.storageService.upload(
                file,
                `messages/${conversationId}/${uuidv4()}.${extension}`,
            );
        }

        const created = await this.prisma.message.create({
            data: { id, conversationId, senderId: userId, content, imageUrl },
            select: {
                ...messageSelect,
                sender: { select: { displayName: true, username: true } },
            },
        });
        const { sender, ...message } = created;

        // Người gửi coi như đã đọc tới tin của chính mình.
        await this.prisma.conversation.update({
            where: { id: conversationId },
            data: {
                lastMessageAt: message.createdAt,
                [myReadField]: message.createdAt,
            },
        });

        // Người nhận, và các thiết bị khác của người gửi.
        for (const target of [peerId, userId]) {
            void this.gateway
                .emitToUser(target, { conversationId, message }, 'message:new')
                .catch(() => undefined);
        }

        void this.notificationsService.pushToUser(
            peerId,
            sender.displayName ?? sender.username,
            content ?? 'Đã gửi một ảnh',
            { type: 'MESSAGE', conversationId },
        );

        return { data: message };
    }

    async markRead(userId: string, conversationId: string) {
        const { peerId, myReadField } = await this.requireMember(
            conversationId,
            userId,
        );
        const readAt = new Date();

        await this.prisma.conversation.update({
            where: { id: conversationId },
            data: { [myReadField]: readAt },
        });

        void this.gateway
            .emitToUser(peerId, { conversationId, readAt }, 'message:read')
            .catch(() => undefined);

        return { data: { readAt } };
    }
}
