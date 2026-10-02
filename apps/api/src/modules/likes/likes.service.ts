import {
    Injectable,
    NotFoundException,
} from '@nestjs/common';
import { PrismaService } from '../../prisma/prisma.service';
import { NotificationsService } from '../notifications/notifications.service';

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
                deletedAt: null,
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
            await this.notificationsService.createLikeNotification(
                userId,
                postId,
                post.authorId,
            );
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
}
