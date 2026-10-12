import {
    Injectable,
    NotFoundException,
    ForbiddenException,
} from '@nestjs/common';
import { Prisma } from '../../generated/prisma/client';
import { PrismaService } from '../../prisma/prisma.service';
import { CreateCommentDto } from './dto/create-comment.dto';
import { CommentsQueryDto } from './dto/comments-query.dto';
import { NotificationsService } from '../notifications/notifications.service';
import {
    authorSelect,
    blockedUserIds,
    pageMeta,
    visiblePostWhere,
} from '../posts/post-view';

function commentSelect(viewerId: string) {
    return {
        id: true,
        content: true,
        createdAt: true,
        updatedAt: true,
        editedAt: true,
        parentId: true,
        user: { select: authorSelect },
        _count: { select: { replies: true, likes: true } },
        likes: { where: { userId: viewerId }, select: { userId: true } },
    } satisfies Prisma.CommentSelect;
}

type CommentRow = Prisma.CommentGetPayload<{
    select: ReturnType<typeof commentSelect>;
}>;

function toCommentDto(comment: CommentRow) {
    return {
        id: comment.id,
        content: comment.content,
        createdAt: comment.createdAt,
        updatedAt: comment.updatedAt,
        editedAt: comment.editedAt,
        parentId: comment.parentId,
        author: comment.user,
        repliesCount: comment._count.replies,
        likesCount: comment._count.likes,
        isLiked: comment.likes.length > 0,
    };
}

@Injectable()
export class CommentsService {
    constructor(
        private readonly prisma: PrismaService,
        private readonly notificationsService: NotificationsService,
    ) { }

    // Bình luận đi theo quyền xem của bài viết chứa nó.
    private async visiblePost(viewerId: string, postId: string) {
        const blocked = await blockedUserIds(this.prisma, viewerId);
        const post = await this.prisma.post.findFirst({
            where: { id: postId, ...visiblePostWhere(viewerId, blocked) },
            select: { id: true, authorId: true },
        });

        if (!post) {
            throw new NotFoundException('Post not found');
        }

        return { post, blocked };
    }

    private async countForPost(postId: string) {
        return this.prisma.comment.count({ where: { postId } });
    }

    async create(
        userId: string,
        postId: string,
        dto: CreateCommentDto,
    ) {
        if (dto.parentId) {
            return this.reply(userId, dto.parentId, dto);
        }

        const { post } = await this.visiblePost(userId, postId);

        const comment = await this.prisma.comment.create({
            data: {
                content: dto.content.trim(),
                postId,
                userId,
            },
            select: commentSelect(userId),
        });

        await this.notificationsService.notify({
            type: 'COMMENT',
            actorId: userId,
            recipientId: post.authorId,
            postId,
            commentId: comment.id,
        });
        await this.notificationsService.notifyMentions(
            userId,
            comment.content,
            postId,
            comment.id,
        );

        return {
            data: toCommentDto(comment),
        };
    }

    private async list(
        viewerId: string,
        where: Prisma.CommentWhereInput,
        order: 'asc' | 'desc',
        query: CommentsQueryDto,
    ) {
        const { page, limit } = query;

        const [comments, total] = await Promise.all([
            this.prisma.comment.findMany({
                where,
                orderBy: { createdAt: order },
                skip: (page - 1) * limit,
                take: limit,
                select: commentSelect(viewerId),
            }),
            this.prisma.comment.count({ where }),
        ]);

        return {
            data: comments.map(toCommentDto),
            meta: pageMeta(page, limit, total),
        };
    }

    async findByPost(
        viewerId: string,
        postId: string,
        query: CommentsQueryDto,
    ) {
        const { blocked } = await this.visiblePost(viewerId, postId);

        return this.list(
            viewerId,
            { postId, parentId: null, userId: { notIn: blocked } },
            'desc',
            query,
        );
    }

    async findReplies(
        viewerId: string,
        commentId: string,
        query: CommentsQueryDto,
    ) {
        const parent = await this.prisma.comment.findUnique({
            where: { id: commentId },
            select: { postId: true },
        });

        if (!parent) {
            throw new NotFoundException('Comment not found');
        }

        const { blocked } = await this.visiblePost(viewerId, parent.postId);

        return this.list(
            viewerId,
            { parentId: commentId, userId: { notIn: blocked } },
            'asc',
            query,
        );
    }

    async update(userId: string, commentId: string, content: string) {
        const result = await this.prisma.comment.updateMany({
            where: { id: commentId, userId },
            data: { content: content.trim(), editedAt: new Date() },
        });

        if (result.count !== 1) {
            const exists = await this.prisma.comment.findUnique({
                where: { id: commentId },
                select: { id: true },
            });

            if (!exists) {
                throw new NotFoundException('Comment not found');
            }

            throw new ForbiddenException('You can only edit your own comment');
        }

        const comment = await this.prisma.comment.findUniqueOrThrow({
            where: { id: commentId },
            select: commentSelect(userId),
        });

        return { data: toCommentDto(comment) };
    }

    async remove(userId: string, commentId: string) {
        const comment = await this.prisma.comment.findUnique({
            where: {
                id: commentId,
            },
            select: {
                id: true,
                userId: true,
                postId: true,
                post: { select: { authorId: true } },
            },
        });

        if (!comment) {
            throw new NotFoundException('Comment not found');
        }

        // Chủ bình luận hoặc chủ bài viết đều được xóa.
        if (comment.userId !== userId && comment.post.authorId !== userId) {
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
                // Trả lời con bị xóa theo nên client không tự tính được.
                commentsCount: await this.countForPost(comment.postId),
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
                parentId: true,
            },
        });

        if (!parent) {
            throw new NotFoundException('Parent comment not found');
        }

        await this.visiblePost(userId, parent.postId);

        const comment = await this.prisma.comment.create({
            data: {
                content: dto.content.trim(),
                postId: parent.postId,
                userId,
                // Chỉ hai cấp: trả lời một câu trả lời thì gắn vào bình luận gốc.
                parentId: parent.parentId ?? parent.id,
            },
            select: commentSelect(userId),
        });

        await this.notificationsService.notify({
            type: 'REPLY',
            actorId: userId,
            recipientId: parent.userId,
            postId: parent.postId,
            commentId: comment.id,
        });
        await this.notificationsService.notifyMentions(
            userId,
            comment.content,
            parent.postId,
            comment.id,
        );

        return {
            data: toCommentDto(comment),
        };
    }

    async setLike(userId: string, commentId: string, liked: boolean) {
        const comment = await this.prisma.comment.findUnique({
            where: { id: commentId },
            select: { postId: true },
        });

        if (!comment) {
            throw new NotFoundException('Comment not found');
        }

        await this.visiblePost(userId, comment.postId);

        if (liked) {
            await this.prisma.commentLike.createMany({
                data: [{ userId, commentId }],
                skipDuplicates: true,
            });
        } else {
            await this.prisma.commentLike.deleteMany({
                where: { userId, commentId },
            });
        }

        return {
            data: {
                isLiked: liked,
                likesCount: await this.prisma.commentLike.count({
                    where: { commentId },
                }),
            },
        };
    }
}
