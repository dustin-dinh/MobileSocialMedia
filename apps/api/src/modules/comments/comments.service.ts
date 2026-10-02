import {
    Injectable,
    NotFoundException,
    ForbiddenException,
} from '@nestjs/common';
import { PrismaService } from '../../prisma/prisma.service';
import { CreateCommentDto } from './dto/create-comment.dto';
import { CommentsQueryDto } from './dto/comments-query.dto';
import { NotificationsService } from '../notifications/notifications.service';

@Injectable()
export class CommentsService {
    constructor(
        private readonly prisma: PrismaService,
        private readonly notificationsService: NotificationsService,
    ) { }

    async create(
        userId: string,
        postId: string,
        dto: CreateCommentDto,
    ) {
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

        if (dto.parentId) {
            const parent = await this.prisma.comment.findFirst({
                where: {
                    id: dto.parentId,
                    postId,
                },
                select: {
                    id: true,
                },
            });

            if (!parent) {
                throw new NotFoundException('Parent comment not found');
            }
        }

        const comment = await this.prisma.comment.create({
            data: {
                content: dto.content.trim(),
                postId,
                userId,
                parentId: dto.parentId ?? null,
            },
            select: {
                id: true,
                content: true,
                createdAt: true,
                updatedAt: true,
                user: {
                    select: {
                        id: true,
                        username: true,
                        displayName: true,
                        avatarUrl: true,
                    },
                },
            },
        });

        await this.notificationsService.createCommentNotification(
            userId,
            postId,
            comment.id,
            post.authorId,
        );

        return {
            data: comment,
        };
    }

    async findByPost(
        postId: string,
        query: CommentsQueryDto,
    ) {
        const page = query.page;
        const limit = query.limit;
        const skip = (page - 1) * limit;

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

        const [comments, total] = await Promise.all([
            this.prisma.comment.findMany({
                where: {
                    postId,
                    parentId: null,
                },
                orderBy: {
                    createdAt: 'desc',
                },
                skip,
                take: limit,
                select: {
                    id: true,
                    content: true,
                    createdAt: true,
                    updatedAt: true,
                    user: {
                        select: {
                            id: true,
                            username: true,
                            displayName: true,
                            avatarUrl: true,
                        },
                    },
                    _count: {
                        select: {
                            replies: true,
                        },
                    },
                },
            }),

            this.prisma.comment.count({
                where: {
                    postId,
                    parentId: null,
                },
            }),
        ]);

        return {
            data: comments.map((comment) => ({
                id: comment.id,
                content: comment.content,
                createdAt: comment.createdAt,
                updatedAt: comment.updatedAt,
                author: comment.user,
                repliesCount: comment._count.replies,
            })),
            meta: {
                page,
                limit,
                total,
                totalPages: Math.ceil(total / limit),
            },
        };
    }

    async findReplies(
        commentId: string,
        query: CommentsQueryDto,
    ) {
        const page = query.page;
        const limit = query.limit;
        const skip = (page - 1) * limit;

        const parent = await this.prisma.comment.findUnique({
            where: {
                id: commentId,
            },
            select: {
                id: true,
            },
        });

        if (!parent) {
            throw new NotFoundException('Comment not found');
        }

        const [replies, total] = await Promise.all([
            this.prisma.comment.findMany({
                where: {
                    parentId: commentId,
                },
                orderBy: {
                    createdAt: 'asc',
                },
                skip,
                take: limit,
                select: {
                    id: true,
                    content: true,
                    createdAt: true,
                    updatedAt: true,
                    user: {
                        select: {
                            id: true,
                            username: true,
                            displayName: true,
                            avatarUrl: true,
                        },
                    },
                },
            }),

            this.prisma.comment.count({
                where: {
                    parentId: commentId,
                },
            }),
        ]);

        return {
            data: replies.map((reply) => ({
                id: reply.id,
                content: reply.content,
                createdAt: reply.createdAt,
                updatedAt: reply.updatedAt,
                author: reply.user,
            })),
            meta: {
                page,
                limit,
                total,
                totalPages: Math.ceil(total / limit),
            },
        };
    }

    async remove(userId: string, commentId: string) {
        const comment = await this.prisma.comment.findUnique({
            where: {
                id: commentId,
            },
            select: {
                id: true,
                userId: true,
            },
        });

        if (!comment) {
            throw new NotFoundException('Comment not found');
        }

        if (comment.userId !== userId) {
            throw new ForbiddenException(
                'You can only delete your own comment',
            );
        }

        await this.prisma.comment.delete({
            where: {
                id: commentId,
            },
        });

        return {
            data: {
                deleted: true,
            },
        };
    }
    async reply(
        userId: string,
        parentCommentId: string,
        dto: CreateCommentDto,
    ) {
        const parent = await this.prisma.comment.findUnique({
            where: {
                id: parentCommentId,
            },
            select: {
                id: true,
                postId: true,
                userId: true,
            },
        });

        if (!parent) {
            throw new NotFoundException('Parent comment not found');
        }

        const comment = await this.prisma.comment.create({
            data: {
                content: dto.content.trim(),
                postId: parent.postId,
                userId,
                parentId: parent.id,
            },
            select: {
                id: true,
                content: true,
                createdAt: true,
                updatedAt: true,
                user: {
                    select: {
                        id: true,
                        username: true,
                        displayName: true,
                        avatarUrl: true,
                    },
                },
            },
        });

        await this.notificationsService.createCommentNotification(
            userId,
            parent.postId,
            comment.id,
            parent.userId,
        );

        return {
            data: {
                id: comment.id,
                content: comment.content,
                createdAt: comment.createdAt,
                updatedAt: comment.updatedAt,
                author: comment.user,
            },
        };
    }
}
