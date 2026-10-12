import {
    Injectable,
    NotFoundException,
} from '@nestjs/common';
import { PrismaService } from '../../prisma/prisma.service';
import { NotificationsService } from '../notifications/notifications.service';
import {
    authorSelect,
    blockedUserIds,
    pageMeta,
    visiblePostWhere,
} from '../posts/post-view';

export const REACTION_TYPES = ['LIKE', 'LOVE', 'HAHA', 'WOW', 'SAD', 'ANGRY'] as const;
export type ReactionType = (typeof REACTION_TYPES)[number];

@Injectable()
export class LikesService {
    constructor(
        private readonly prisma: PrismaService,
        private readonly notificationsService: NotificationsService,
    ) { }

    // Thả hoặc đổi cảm xúc. Chỉ lần thả đầu tiên mới báo cho tác giả.
    async like(userId: string, postId: string, type: ReactionType = 'LIKE') {
        const post = await this.prisma.post.findFirst({
            where: {
                id: postId,
                ...visiblePostWhere(
                    userId,
                    await blockedUserIds(this.prisma, userId),
                ),
            },
            select: {
                id: true,
                authorId: true,
            },
        });

        if (!post) {
            throw new NotFoundException('Post not found');
        }

        const created = await this.prisma.like.createMany({
            data: [{ userId, postId, type }],
            skipDuplicates: true,
        });

        if (created.count === 0) {
            await this.prisma.like.updateMany({
                where: { userId, postId },
                data: { type },
            });
        }

        if (created.count > 0) {
            await this.notificationsService.notify({
                type: 'LIKE',
                actorId: userId,
                recipientId: post.authorId,
                postId,
            });
        }

        return {
            data: {
                isLiked: true,
                myReaction: type,
            },
        };
    }

    async unlike(userId: string, postId: string) {
        const post = await this.prisma.post.findFirst({
            where: {
                id: postId,
                deletedAt: null,
            },
            select: {
                id: true,
            },
        });

        if (!post) {
            throw new NotFoundException('Post not found');
        }

        await this.prisma.like.deleteMany({
            where: {
                userId,
                postId,
            },
        });

        return {
            data: {
                isLiked: false,
                myReaction: null,
            },
        };
    }

    async findLikers(
        viewerId: string,
        postId: string,
        page: number,
        limit: number,
    ) {
        const blocked = await blockedUserIds(this.prisma, viewerId);
        const post = await this.prisma.post.findFirst({
            where: { id: postId, ...visiblePostWhere(viewerId, blocked) },
            select: { id: true },
        });

        if (!post) {
            throw new NotFoundException('Post not found');
        }

        const where = { postId, userId: { notIn: blocked } };
        const [likes, total, byType] = await Promise.all([
            this.prisma.like.findMany({
                where,
                orderBy: { createdAt: 'desc' },
                skip: (page - 1) * limit,
                take: limit,
                select: { type: true, user: { select: authorSelect } },
            }),
            this.prisma.like.count({ where }),
            this.prisma.like.groupBy({
                by: ['type'],
                where,
                _count: { _all: true },
            }),
        ]);

        return {
            data: likes.map((like) => ({ ...like.user, reaction: like.type })),
            meta: {
                ...pageMeta(page, limit, total),
                // Số lượt theo từng loại cảm xúc, ví dụ { LIKE: 3, LOVE: 1 }.
                reactions: Object.fromEntries(
                    byType.map((row) => [row.type, row._count._all]),
                ),
            },
        };
    }
}
