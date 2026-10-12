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

@Injectable()
export class LikesService {
    constructor(
        private readonly prisma: PrismaService,
        private readonly notificationsService: NotificationsService,
    ) { }

    async like(userId: string, postId: string) {
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
            data: [{ userId, postId }],
            skipDuplicates: true,
        });

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
        const [likes, total] = await Promise.all([
            this.prisma.like.findMany({
                where,
                orderBy: { createdAt: 'desc' },
                skip: (page - 1) * limit,
                take: limit,
                select: { user: { select: authorSelect } },
            }),
            this.prisma.like.count({ where }),
        ]);

        return {
            data: likes.map((like) => like.user),
            meta: pageMeta(page, limit, total),
        };
    }
}
