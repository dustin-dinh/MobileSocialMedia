import {
    BadRequestException,
    ForbiddenException,
    HttpException,
    HttpStatus,
    Injectable,
    NotFoundException,
} from '@nestjs/common';
import { v4 as uuidv4 } from 'uuid';

import { PrismaService } from '../../prisma/prisma.service';
import { ImageModerationService } from '../moderation/image-moderation.service';
import { findBlockedContact, hasScamWarning } from '../moderation/text-safety';
import { NotificationsGateway } from '../notifications/notifications.gateway';
import { NotificationsService } from '../notifications/notifications.service';
import { authorSelect, blockedUserIds } from '../posts/post-view';
import { StorageService } from '../storage/storage.service';

const MAX_MESSAGE_LENGTH = 2000;
const MAX_IMAGE_BYTES = 5 * 1024 * 1024;
const IMAGE_TYPES = ['image/jpeg', 'image/png', 'image/webp'];

// Tin nhắn chờ (người lạ, ẩn danh): người mở gửi tối đa chừng này tin cho tới khi được trả lời.
const PENDING_MESSAGE_LIMIT = 3;
// Gửi ẩn danh (docs/moderation/MODERATION_PLAN.md, mục 5).
const ANONYMOUS_DAILY_LIMIT = 10;
const ANONYMOUS_MIN_ACCOUNT_AGE_MS = 7 * 24 * 60 * 60 * 1000;
const DAY_MS = 24 * 60 * 60 * 1000;

// Thay cho người gửi ẩn danh trong mọi dữ liệu trả về cho người nhận (API, socket, push).
export const ANONYMOUS_USER_ID = 'anonymous';
const ANONYMOUS_PEER = {
    id: ANONYMOUS_USER_ID,
    username: 'nguoi_an_danh',
    displayName: 'Người ẩn danh',
    avatarUrl: null,
};

const messageSelect = {
    id: true,
    conversationId: true,
    senderId: true,
    content: true,
    imageUrl: true,
    sensitive: true,
    storyId: true,
    createdAt: true,
} as const;

const conversationSelect = {
    id: true,
    userAId: true,
    userBId: true,
    kind: true,
    status: true,
    requesterId: true,
    revealedAt: true,
    closedAt: true,
    lastMessageAt: true,
    userAReadAt: true,
    userBReadAt: true,
    userA: { select: authorSelect },
    userB: { select: authorSelect },
} as const;

type Author = { id: string; username: string; displayName: string | null; avatarUrl: string | null };

type ConversationRow = {
    id: string;
    userAId: string;
    userBId: string;
    kind: string;
    status: string;
    requesterId: string | null;
    revealedAt: Date | null;
    closedAt: Date | null;
    lastMessageAt: Date;
    userAReadAt: Date | null;
    userBReadAt: Date | null;
    userA: Author;
    userB: Author;
};

type MessageRow = {
    id: string;
    conversationId: string;
    senderId: string;
    content: string | null;
    imageUrl: string | null;
    sensitive: boolean;
    storyId: string | null;
    createdAt: Date;
};

// `code` (và `extra`) để app hiện thông báo tiếng Việt mà không phải so chuỗi.
function messageError(
    status: HttpStatus,
    code: string,
    message: string,
    extra: Record<string, unknown> = {},
): HttpException {
    return new HttpException({ statusCode: status, code, message, ...extra }, status);
}

// Bên ẩn danh của hội thoại (kể cả khi đã tiết lộ); null với hội thoại thường.
function anonymousSideOf(conversation: Pick<ConversationRow, 'kind' | 'userAId' | 'userBId'>): string | null {
    if (conversation.kind === 'ANON_A') {
        return conversation.userAId;
    }

    return conversation.kind === 'ANON_B' ? conversation.userBId : null;
}

// Người cần che danh tính lúc này: bên ẩn danh, cho tới khi họ tự tiết lộ.
function hiddenUserOf(conversation: ConversationRow): string | null {
    return conversation.revealedAt ? null : anonymousSideOf(conversation);
}

// Nhắn tin 1:1. Mỗi cặp: một hội thoại thường, và tối đa một hội thoại ẩn danh mỗi chiều.
@Injectable()
export class MessagesService {
    constructor(
        private readonly prisma: PrismaService,
        private readonly storageService: StorageService,
        private readonly gateway: NotificationsGateway,
        private readonly notificationsService: NotificationsService,
        private readonly imageModeration: ImageModerationService,
    ) { }

    private async requireMember(conversationId: string, userId: string) {
        const conversation = await this.prisma.conversation.findUnique({
            where: { id: conversationId },
            select: conversationSelect,
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

    // ── Cách một người nhìn thấy hội thoại và tin nhắn ─────────────────────────

    private viewMessage(message: MessageRow, conversation: ConversationRow, viewerId: string) {
        const hidden = hiddenUserOf(conversation);
        const fromOther = message.senderId !== viewerId;

        return {
            ...message,
            senderId: hidden && message.senderId === hidden && viewerId !== hidden
                ? ANONYMOUS_USER_ID
                : message.senderId,
            // Cụm từ hay gặp trong lừa đảo, ở tin từ người lạ hoặc ẩn danh: người nhận thấy cảnh báo.
            warning:
                fromOther &&
                (conversation.kind !== 'DIRECT' || conversation.status !== 'ACCEPTED') &&
                hasScamWarning(message.content),
        };
    }

    private viewConversation(
        conversation: ConversationRow,
        viewerId: string,
        lastMessage: MessageRow | null,
        unreadCount: number,
    ) {
        const isA = conversation.userAId === viewerId;
        const peerId = isA ? conversation.userBId : conversation.userAId;
        const hidden = hiddenUserOf(conversation);
        const anonymousSide = anonymousSideOf(conversation);
        const isRequester = conversation.requesterId === viewerId;
        // Người mở không biết mình bị từ chối: với họ DECLINED vẫn là PENDING.
        const status = conversation.status === 'DECLINED' ? 'PENDING' : conversation.status;

        return {
            id: conversation.id,
            peer: hidden === peerId ? ANONYMOUS_PEER : isA ? conversation.userB : conversation.userA,
            lastMessage: lastMessage ? this.viewMessage(lastMessage, conversation, viewerId) : null,
            lastMessageAt: conversation.lastMessageAt,
            unreadCount,
            status,
            // Nằm trong "Tin nhắn chờ" của người xem.
            isRequest: status === 'PENDING' && !isRequester,
            anonymous: anonymousSide
                ? {
                    role: anonymousSide === viewerId ? 'SENDER' : 'RECIPIENT',
                    revealed: conversation.revealedAt !== null,
                }
                : null,
            closed: conversation.closedAt !== null,
            // Ẩn danh: chỉ chữ. Tin nhắn chờ: người mở chỉ gửi chữ cho tới khi được trả lời.
            canSendImages:
                conversation.kind === 'DIRECT' && (status === 'ACCEPTED' || !isRequester),
        };
    }

    // ── Mở hội thoại ───────────────────────────────────────────────────────────

    // Hội thoại thường với một người (tạo nếu chưa có). Người kia chưa theo dõi mình: tin nhắn chờ.
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

        const conversation = await this.findOrCreate(userId, peerId, 'DIRECT', async () => {
            const peerFollowsMe = await this.prisma.follow.findUnique({
                where: { followerId_followingId: { followerId: peerId, followingId: userId } },
                select: { followerId: true },
            });

            return peerFollowsMe ? 'ACCEPTED' : 'PENDING';
        });

        return { data: this.viewConversation(conversation, userId, null, 0) };
    }

    // Hội thoại ẩn danh từ nút "Nhắn ẩn danh" trên trang cá nhân.
    async openAnonymous(userId: string, recipientId: string) {
        const recipient = await this.prisma.user.findUnique({
            where: { id: recipientId },
            select: { allowAnonymousMessages: true },
        });

        if (!recipient) {
            throw new NotFoundException('User not found');
        }

        if (!recipient.allowAnonymousMessages) {
            throw messageError(HttpStatus.FORBIDDEN, 'ANONYMOUS_NOT_ACCEPTED', 'This user does not accept anonymous messages');
        }

        const follows = await this.prisma.follow.findUnique({
            where: { followerId_followingId: { followerId: userId, followingId: recipientId } },
            select: { followerId: true },
        });

        if (!follows) {
            throw messageError(HttpStatus.FORBIDDEN, 'ANONYMOUS_FOLLOW_REQUIRED', 'Follow this user to message them anonymously');
        }

        const conversation = await this.openAnonymousConversation(userId, recipientId);

        return { data: this.viewConversation(conversation, userId, null, 0) };
    }

    // Kiểm tra quyền gửi ẩn danh rồi lấy (hoặc tạo) hội thoại ẩn danh userId -> recipientId.
    // Dùng chung cho trang cá nhân và trả lời story; điều kiện riêng của từng nơi kiểm tra trước khi gọi.
    async openAnonymousConversation(userId: string, recipientId: string) {
        if (userId === recipientId) {
            throw new BadRequestException('Cannot message yourself');
        }

        if ((await blockedUserIds(this.prisma, userId)).includes(recipientId)) {
            throw new NotFoundException('User not found');
        }

        const sender = await this.prisma.user.findUnique({
            where: { id: userId },
            select: {
                createdAt: true,
                emailVerifiedAt: true,
                googleId: true,
                anonymousSuspendedAt: true,
            },
        });

        if (!sender) {
            throw new NotFoundException('User not found');
        }

        if (sender.anonymousSuspendedAt) {
            throw messageError(HttpStatus.FORBIDDEN, 'ANONYMOUS_SUSPENDED', 'You can no longer send anonymous messages');
        }

        if (!sender.emailVerifiedAt && !sender.googleId) {
            throw messageError(HttpStatus.FORBIDDEN, 'ANONYMOUS_NOT_ELIGIBLE', 'Verify your email to send anonymous messages');
        }

        if (Date.now() - sender.createdAt.getTime() < ANONYMOUS_MIN_ACCOUNT_AGE_MS) {
            throw messageError(HttpStatus.FORBIDDEN, 'ANONYMOUS_NOT_ELIGIBLE', 'Your account must be at least 7 days old to send anonymous messages');
        }

        const kind = userId < recipientId ? 'ANON_A' : 'ANON_B';
        const [userAId, userBId] = userId < recipientId ? [userId, recipientId] : [recipientId, userId];
        const existing = await this.prisma.conversation.findUnique({
            where: { userAId_userBId_kind: { userAId, userBId, kind } },
            select: conversationSelect,
        });

        if (existing?.closedAt) {
            throw messageError(HttpStatus.FORBIDDEN, 'CONVERSATION_CLOSED', 'This person no longer accepts your anonymous messages');
        }

        if (!existing) {
            const startedToday = await this.prisma.conversation.count({
                where: {
                    requesterId: userId,
                    kind: { in: ['ANON_A', 'ANON_B'] },
                    createdAt: { gte: new Date(Date.now() - DAY_MS) },
                },
            });

            if (startedToday >= ANONYMOUS_DAILY_LIMIT) {
                throw messageError(HttpStatus.TOO_MANY_REQUESTS, 'ANONYMOUS_DAILY_LIMIT', 'You have started too many anonymous conversations today');
            }
        }

        return existing ?? this.findOrCreate(userId, recipientId, kind, async () => 'PENDING');
    }

    private async findOrCreate(
        userId: string,
        peerId: string,
        kind: string,
        statusOnCreate: () => Promise<string>,
    ): Promise<ConversationRow> {
        const [userAId, userBId] = userId < peerId ? [userId, peerId] : [peerId, userId];
        const where = { userAId_userBId_kind: { userAId, userBId, kind } };
        const existing = await this.prisma.conversation.findUnique({ where, select: conversationSelect });

        if (existing) {
            return existing;
        }

        const status = await statusOnCreate();

        // Hai người mở cùng lúc: upsert để không vỡ ràng buộc duy nhất.
        return this.prisma.conversation.upsert({
            where,
            create: {
                userAId,
                userBId,
                kind,
                status,
                requesterId: status === 'PENDING' ? userId : null,
            },
            update: {},
            select: conversationSelect,
        });
    }

    // ── Danh sách ──────────────────────────────────────────────────────────────

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

    // Hội thoại người xem thấy trong hộp thư: có tin nhắn, không bị đóng, không phải tin chờ mình đã xóa.
    private inboxWhere(userId: string, blocked: string[]) {
        return {
            OR: [{ userAId: userId }, { userBId: userId }],
            messages: { some: {} },
            closedAt: null,
            NOT: { status: 'DECLINED', requesterId: { not: userId } },
            ...(blocked.length
                ? { userAId: { notIn: blocked }, userBId: { notIn: blocked } }
                : {}),
        };
    }

    // Hộp thư và tin nhắn chờ, mới nhất trước; client tách theo `isRequest`.
    async list(userId: string) {
        const blocked = await blockedUserIds(this.prisma, userId);

        const [conversations, unread] = await Promise.all([
            this.prisma.conversation.findMany({
                where: this.inboxWhere(userId, blocked),
                orderBy: { lastMessageAt: 'desc' },
                take: 100,
                select: {
                    ...conversationSelect,
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
            data: conversations.map(({ messages, ...conversation }) =>
                this.viewConversation(
                    conversation,
                    userId,
                    messages[0] ?? null,
                    unread.get(conversation.id) ?? 0,
                ),
            ),
        };
    }

    // `count`: hội thoại có tin chưa đọc trong hộp thư chính (huy hiệu tab).
    // `requests`: tin nhắn chờ đang có, hiện riêng trong hộp thư.
    async unreadCount(userId: string) {
        const blocked = await blockedUserIds(this.prisma, userId);
        const [unread, conversations] = await Promise.all([
            this.unreadByConversation(userId),
            this.prisma.conversation.findMany({
                where: this.inboxWhere(userId, blocked),
                select: { id: true, status: true, requesterId: true },
            }),
        ]);
        const isRequest = (conversation: { status: string; requesterId: string | null }) =>
            conversation.status === 'PENDING' && conversation.requesterId !== userId;

        return {
            data: {
                count: conversations.filter(
                    (conversation) => !isRequest(conversation) && unread.has(conversation.id),
                ).length,
                requests: conversations.filter(isRequest).length,
            },
        };
    }

    // Phân trang ngược thời gian: `before` là createdAt của tin cũ nhất đang có ở client.
    async findMessages(
        userId: string,
        conversationId: string,
        before: string | undefined,
        limit: number,
    ) {
        const { conversation, peerReadAt } = await this.requireMember(conversationId, userId);

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
            data: rows.slice(0, limit).map((row) => this.viewMessage(row, conversation, userId)),
            meta: {
                hasMore: rows.length > limit,
                // Tin nhắn chờ: người mở không biết người kia đã đọc hay chưa.
                peerReadAt:
                    conversation.status !== 'ACCEPTED' && conversation.requesterId === userId
                        ? null
                        : peerReadAt,
                conversation: this.viewConversation(conversation, userId, null, 0),
            },
        };
    }

    // ── Gửi ────────────────────────────────────────────────────────────────────

    async send(
        userId: string,
        conversationId: string,
        dto: { clientId?: string; content?: string },
        file?: Express.Multer.File,
        storyId?: string,
    ) {
        const { conversation, peerId, myReadField } = await this.requireMember(
            conversationId,
            userId,
        );
        const anonymousSide = anonymousSideOf(conversation);
        const isRequester = conversation.requesterId === userId;
        const isPendingRequester = conversation.status !== 'ACCEPTED' && isRequester;

        if (conversation.closedAt) {
            throw messageError(HttpStatus.FORBIDDEN, 'CONVERSATION_CLOSED', 'This conversation has been closed');
        }

        if ((await blockedUserIds(this.prisma, userId)).includes(peerId)) {
            throw new ForbiddenException('You cannot message this user');
        }

        if (anonymousSide === userId) {
            const me = await this.prisma.user.findUnique({
                where: { id: userId },
                select: { anonymousSuspendedAt: true },
            });

            if (me?.anonymousSuspendedAt) {
                throw messageError(HttpStatus.FORBIDDEN, 'ANONYMOUS_SUSPENDED', 'You can no longer send anonymous messages');
            }
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

            return { data: this.viewMessage(existing, conversation, userId) };
        }

        // Ẩn danh: chỉ chữ. Tin nhắn chờ: người mở chỉ gửi chữ cho tới khi được trả lời.
        if (file && (anonymousSide || isPendingRequester)) {
            throw messageError(HttpStatus.BAD_REQUEST, 'IMAGES_NOT_ALLOWED', 'Images are not allowed in this conversation');
        }

        // Người ẩn danh (chưa tiết lộ) và người lạ không được gửi link, số điện thoại, số tài khoản.
        const restricted = (anonymousSide === userId && !conversation.revealedAt) || isPendingRequester;
        const blockedContact = restricted && content ? findBlockedContact(content) : null;

        if (blockedContact) {
            throw messageError(
                HttpStatus.BAD_REQUEST,
                'CONTACT_INFO_BLOCKED',
                'Links, phone numbers and bank account numbers are not allowed in this conversation',
                { contact: blockedContact },
            );
        }

        if (isPendingRequester) {
            const sentSoFar = await this.prisma.message.count({
                where: { conversationId, senderId: userId },
            });

            if (sentSoFar >= PENDING_MESSAGE_LIMIT) {
                throw messageError(HttpStatus.TOO_MANY_REQUESTS, 'REQUEST_LIMIT', 'Wait for a reply before sending more messages');
            }
        }

        let imageUrl: string | null = null;
        let sensitive = false;

        if (file) {
            if (!IMAGE_TYPES.includes(file.mimetype)) {
                throw new BadRequestException(`Unsupported image type: ${file.mimetype}`);
            }

            if (file.size > MAX_IMAGE_BYTES) {
                throw new BadRequestException('Image must be <= 5MB');
            }

            sensitive = (await this.imageModeration.classify(file.buffer)).sensitive;

            const extension = file.originalname.split('.').pop()?.toLowerCase() || 'jpg';

            imageUrl = await this.storageService.upload(
                file,
                `messages/${conversationId}/${uuidv4()}.${extension}`,
                { private: true },
            );
        }

        const message = await this.prisma.message.create({
            data: { id, conversationId, senderId: userId, content, imageUrl, sensitive, storyId },
            select: messageSelect,
        });

        // Người nhận trả lời tin nhắn chờ: coi như chấp nhận.
        const accepts = conversation.status !== 'ACCEPTED' && !isRequester;
        const updated = await this.prisma.conversation.update({
            where: { id: conversationId },
            data: {
                lastMessageAt: message.createdAt,
                // Người gửi coi như đã đọc tới tin của chính mình.
                [myReadField]: message.createdAt,
                ...(accepts ? { status: 'ACCEPTED' } : {}),
            },
            select: conversationSelect,
        });

        // Người nhận, và các thiết bị khác của người gửi; mỗi bên thấy theo góc nhìn của mình.
        for (const target of [peerId, userId]) {
            void this.gateway
                .emitToUser(
                    target,
                    {
                        conversationId,
                        message: this.viewMessage(message, updated, target),
                        conversation: this.viewConversation(updated, target, null, 0),
                    },
                    'message:new',
                )
                .catch(() => undefined);
        }

        const sender = hiddenUserOf(updated) === userId
            ? ANONYMOUS_PEER
            : updated.userAId === userId ? updated.userA : updated.userB;

        void this.notificationsService.pushToUser(
            peerId,
            sender.displayName ?? sender.username,
            // Ảnh không bao giờ hiện trong thông báo; tin chờ ghi rõ để người nhận cảnh giác.
            `${updated.status !== 'ACCEPTED' ? '[Tin nhắn chờ] ' : ''}${content ?? 'Đã gửi một ảnh'}`,
            { type: 'MESSAGE', conversationId },
        );

        return { data: this.viewMessage(message, updated, userId) };
    }

    // ── Trạng thái hội thoại ───────────────────────────────────────────────────

    async markRead(userId: string, conversationId: string) {
        const { conversation, peerId, myReadField } = await this.requireMember(
            conversationId,
            userId,
        );
        const readAt = new Date();

        await this.prisma.conversation.update({
            where: { id: conversationId },
            data: { [myReadField]: readAt },
        });

        // Tin nhắn chờ: người mở không được biết tin đã được đọc.
        if (conversation.status === 'ACCEPTED' || conversation.requesterId !== peerId) {
            void this.gateway
                .emitToUser(peerId, { conversationId, readAt }, 'message:read')
                .catch(() => undefined);
        }

        return { data: { readAt } };
    }

    // Người nhận chấp nhận tin nhắn chờ (không cần trả lời).
    async accept(userId: string, conversationId: string) {
        const { conversation } = await this.requireMember(conversationId, userId);

        if (conversation.status === 'ACCEPTED' || conversation.requesterId === userId) {
            throw new BadRequestException('Nothing to accept');
        }

        const updated = await this.prisma.conversation.update({
            where: { id: conversationId },
            data: { status: 'ACCEPTED' },
            select: conversationSelect,
        });

        return { data: this.viewConversation(updated, userId, null, 0) };
    }

    // Người nhận xóa tin nhắn chờ. Người mở không được báo: với họ hội thoại vẫn đang chờ.
    async decline(userId: string, conversationId: string) {
        const { conversation } = await this.requireMember(conversationId, userId);

        if (conversation.status === 'ACCEPTED' || conversation.requesterId === userId) {
            throw new BadRequestException('Nothing to decline');
        }

        await this.prisma.conversation.update({
            where: { id: conversationId },
            data: { status: 'DECLINED' },
        });

        return { data: { declined: true } };
    }

    // Người nhận chặn người ẩn danh mà không biết họ là ai: hội thoại đóng vĩnh viễn, người đó
    // không mở lại hội thoại ẩn danh với mình được nữa. Hội thoại thường thì dùng chặn người dùng.
    async closeAnonymous(userId: string, conversationId: string) {
        const { conversation } = await this.requireMember(conversationId, userId);
        const anonymousSide = anonymousSideOf(conversation);

        if (!anonymousSide || anonymousSide === userId) {
            throw new BadRequestException('Only the recipient of an anonymous conversation can close it');
        }

        await this.prisma.conversation.update({
            where: { id: conversationId },
            data: { closedAt: conversation.closedAt ?? new Date() },
        });

        return { data: { closed: true } };
    }

    // Người ẩn danh tự tiết lộ danh tính. Không thu hồi được.
    async reveal(userId: string, conversationId: string) {
        const { conversation, peerId } = await this.requireMember(conversationId, userId);

        if (anonymousSideOf(conversation) !== userId) {
            throw new BadRequestException('Only the anonymous sender can reveal their identity');
        }

        const updated = conversation.revealedAt
            ? conversation
            : await this.prisma.conversation.update({
                where: { id: conversationId },
                data: { revealedAt: new Date() },
                select: conversationSelect,
            });

        for (const target of [peerId, userId]) {
            void this.gateway
                .emitToUser(
                    target,
                    { conversationId, conversation: this.viewConversation(updated, target, null, 0) },
                    'conversation:updated',
                )
                .catch(() => undefined);
        }

        return { data: this.viewConversation(updated, userId, null, 0) };
    }
}
