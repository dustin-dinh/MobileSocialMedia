import {
    BadRequestException,
    ForbiddenException,
    HttpException,
    HttpStatus,
    Injectable,
    NotFoundException,
    ConflictException,
} from '@nestjs/common';

import { PrismaService } from '../../prisma/prisma.service';
import { CreatePostDto } from './dto/create-post.dto';
import { StorageService } from '../storage/storage.service';
import { FeedQueryDto } from './dto/feed-query.dto';
import { v4 as uuidv4 } from 'uuid';
import { UpdatePostDto } from './dto/update-post.dto';
import { NotificationsService } from '../notifications/notifications.service';
import {
    blockedUserIds,
    pageMeta,
    postSelect,
    repostSelect,
    toPostDto,
    toRepostDto,
    visiblePostWhere,
} from './post-view';

@Injectable()
export class PostsService {
    constructor(private readonly prisma: PrismaService,
        private readonly storageService: StorageService,
        private readonly notificationsService: NotificationsService,
    ) { }

    async create(
        userId: string,
        dto: CreatePostDto,
        files: Express.Multer.File[],
    ) {
        this.validateImages(files);

        const content = dto.content?.trim();

        if (!content && files.length === 0) {
            throw new BadRequestException(
                'Post must contain text or at least one image',
            );
        }

        const uploadedFiles: {
            storagePath: string;
            url: string;
            type: string;
            order: number;
        }[] = [];

        try {
            for (let index = 0; index < files.length; index++) {
                const file = files[index];

                const extension =
                    file.originalname.split('.').pop()?.toLowerCase() ||
                    'jpg';

                const storagePath =
                    `posts/${userId}/${uuidv4()}.${extension}`;

                const url =
                    await this.storageService.upload(
                        file,
                        storagePath,
                    );

                uploadedFiles.push({
                    storagePath,
                    url,
                    type: 'image',
                    order: index,
                });
            }

            const post = await this.prisma.post.create({
                data: {
                    authorId: userId,
                    content: content || null,
                    privacy: dto.privacy ?? 'PUBLIC',

                    media: {
                        create: uploadedFiles.map((file) => ({
                            url: file.url,
                            type: file.type,
                            order: file.order,
                        })),
                    },
                },

                select: postSelect(userId),
            });

            // Bài PRIVATE không báo cho người được nhắc tên vì họ không mở được.
            if (post.privacy !== 'PRIVATE') {
                await this.notificationsService.notifyMentions(
                    userId,
                    post.content,
                    post.id,
                );
            }

            return {
                data: toPostDto(post),
            };
        } catch (error) {
            for (const file of uploadedFiles) {
                await this.storageService
                    .remove(file.storagePath)
                    .catch(() => undefined);
            }

            throw error;
        }
    }

    async findOne(postId: string, userId: string) {
        const post = await this.prisma.post.findFirst({
            where: {
                id: postId,
                ...visiblePostWhere(
                    userId,
                    await blockedUserIds(this.prisma, userId),
                ),
            },
            select: postSelect(userId),
        });

        if (!post) {
            throw new HttpException(
                {
                    error: {
                        code: 'POST_NOT_FOUND',
                        message: 'Post not found',
                    },
                },
                HttpStatus.NOT_FOUND,
            );
        }

        return toPostDto(post);
    }

    private validateImages(
        files: Express.Multer.File[],
    ) {
        if (files.length > 4) {
            throw new BadRequestException(
                'Maximum 4 images per post',
            );
        }

        const allowedTypes = [
            'image/jpeg',
            'image/png',
            'image/webp',
        ];

        for (const file of files) {
            if (!allowedTypes.includes(file.mimetype)) {
                throw new BadRequestException(
                    `Unsupported image type: ${file.mimetype}`,
                );
            }

            if (file.size > 5 * 1024 * 1024) {
                throw new BadRequestException(
                    'Each image must be <= 5MB',
                );
            }
        }
    }


    async getFeed(userId: string, query: FeedQueryDto) {
        const page = query.page;
        const limit = query.limit;
        const skip = (page - 1) * limit;
        // shortcut: trộn hai nguồn nên phải lấy skip+limit mỗi nguồn; trang càng sâu càng chậm,
        // chuyển sang phân trang theo con trỏ thời gian khi feed vượt vài nghìn bài.
        const fetchCount = skip + limit;
        const blocked = await blockedUserIds(this.prisma, userId);

        const postWhere = {
            ...visiblePostWhere(userId, blocked),
            hiddenBy: { none: { userId } },
        };

        // Hiển thị repost của chính mình và người mình đang follow.
        // User A follow B => Follow có followerId=A, followingId=B.
        const repostWhere = {
            userId: { notIn: blocked },
            post: { hiddenBy: { none: { userId } } },
            OR: [
                { userId },
                {
                    user: {
                        followers: {
                            some: { followerId: userId },
                        },
                    },
                },
            ],
        };

        const orderBy = [
            { createdAt: 'desc' as const },
            { id: 'desc' as const },
        ];

        const [posts, totalPosts, reposts, totalReposts] =
            await Promise.all([
                this.prisma.post.findMany({
                    where: postWhere,
                    orderBy,
                    take: fetchCount,
                    select: postSelect(userId),
                }),

                this.prisma.post.count({
                    where: postWhere,
                }),

                this.prisma.repost.findMany({
                    where: repostWhere,
                    orderBy,
                    take: fetchCount,
                    select: repostSelect(userId),
                }),

                this.prisma.repost.count({
                    where: repostWhere,
                }),
            ]);

        // Bài gốc đã xóa hoặc không còn quyền xem vẫn hiện thẻ "không khả dụng".
        const visibleOriginals = reposts.length
            ? await this.prisma.post.findMany({
                where: {
                    id: { in: reposts.map((repost) => repost.postId) },
                    ...visiblePostWhere(userId, blocked),
                },
                select: { id: true },
            })
            : [];

        const visibleOriginalIds = new Set(
            visibleOriginals.map((post) => post.id),
        );

        const allItems = [
            ...posts.map((post) => ({
                type: 'POST' as const,
                ...toPostDto(post),
            })),
            ...reposts.map((repost) =>
                toRepostDto(repost, visibleOriginalIds.has(repost.postId)),
            ),
        ].sort(
            // Ghép hai loại item và dùng ID làm tiêu chí phụ khi trùng thời gian.
            (a, b) =>
                new Date(b.createdAt).getTime() -
                new Date(a.createdAt).getTime() ||
                b.id.localeCompare(a.id),
        );

        return {
            data: allItems.slice(skip, skip + limit),
            meta: pageMeta(page, limit, totalPosts + totalReposts),
        };
    }

    async update(
        postId: string,
        userId: string,
        dto: UpdatePostDto,
        files: Express.Multer.File[],
    ) {
        this.validateImages(files);

        const existingPost = await this.prisma.post.findUnique({
            where: { id: postId },
            include: { media: true },
        });

        if (!existingPost || existingPost.deletedAt) {
            throw new NotFoundException('Post not found');
        }

        if (existingPost.authorId !== userId) {
            throw new ForbiddenException(
                'You can only edit your own posts',
            );
        }

        let keepMediaIds: string[];

        if (dto.keepMediaIds === undefined) {
            keepMediaIds = existingPost.media.map((media) => media.id);
        } else {
            try {
                const parsed: unknown = JSON.parse(dto.keepMediaIds);

                if (
                    !Array.isArray(parsed) ||
                    !parsed.every((id) => typeof id === 'string')
                ) {
                    throw new Error('Invalid media ID list');
                }

                keepMediaIds = parsed;
            } catch {
                throw new BadRequestException(
                    'keepMediaIds must be a JSON array of media IDs',
                );
            }
        }

        // Không chấp nhận ID ảnh không thuộc bài viết này.
        const existingMediaIds = new Set(
            existingPost.media.map((media) => media.id),
        );

        if (keepMediaIds.some((id) => !existingMediaIds.has(id))) {
            throw new BadRequestException(
                'One or more media IDs do not belong to this post',
            );
        }

        // Tránh ID trùng làm sai phép tính.
        keepMediaIds = [...new Set(keepMediaIds)];

        if (keepMediaIds.length + files.length > 4) {
            throw new BadRequestException(
                'Maximum 4 images per post',
            );
        }

        const content =
            dto.content === undefined
                ? existingPost.content
                : dto.content.trim() || null;

        if (!content && keepMediaIds.length + files.length === 0) {
            throw new BadRequestException(
                'Post must contain text or at least one image',
            );
        }

        const uploadedFiles: {
            storagePath: string;
            url: string;
            type: string;
            order: number;
        }[] = [];

        try {
            // Tải ảnh mới trước khi thay đổi dữ liệu trong database.
            for (const file of files) {
                const extension =
                    file.originalname.split('.').pop()?.toLowerCase() ||
                    'jpg';

                const storagePath =
                    `posts/${userId}/${uuidv4()}.${extension}`;

                const url = await this.storageService.upload(
                    file,
                    storagePath,
                );

                uploadedFiles.push({
                    storagePath,
                    url,
                    type: 'image',
                    order: 0,
                });
            }
        } catch (error) {
            await Promise.allSettled(
                uploadedFiles.map((file) =>
                    this.storageService.remove(file.storagePath),
                ),
            );

            throw error;
        }

        const removedMedia = existingPost.media.filter(
            (media) => !keepMediaIds.includes(media.id),
        );

        try {
            await this.prisma.$transaction(async (tx) => {
                // Kiểm tra lại quyền và trạng thái để tránh cập nhật
                // bài viết đã bị xóa trong lúc tải ảnh.
                const result = await tx.post.updateMany({
                    where: {
                        id: postId,
                        authorId: userId,
                        deletedAt: null,
                    },
                    data: {
                        content,
                        ...(dto.privacy !== undefined
                            ? { privacy: dto.privacy }
                            : {}),
                    },
                });

                if (result.count !== 1) {
                    throw new NotFoundException('Post not found');
                }

                await tx.postMedia.deleteMany({
                    where: {
                        postId,
                        ...(keepMediaIds.length > 0
                            ? { id: { notIn: keepMediaIds } }
                            : {}),
                    },
                });

                if (uploadedFiles.length > 0) {
                    const maxExistingOrder = existingPost.media
                        .filter((media) => keepMediaIds.includes(media.id))
                        .reduce(
                            (max, media) => Math.max(max, media.order),
                            -1,
                        );

                    await tx.postMedia.createMany({
                        data: uploadedFiles.map((file, index) => ({
                            postId,
                            url: file.url,
                            type: file.type,
                            order: maxExistingOrder + index + 1,
                        })),
                    });
                }
            });
        } catch (error) {
            await Promise.allSettled(
                uploadedFiles.map((file) =>
                    this.storageService.remove(file.storagePath),
                ),
            );

            throw error;
        }

        // Database đã cập nhật thành công. Dọn các ảnh cũ không còn
        // được tham chiếu. Nếu Storage lỗi, không rollback database.
        await this.storageService.removeByUrls(
            removedMedia.map((media) => media.url),
        );

        return {
            data: await this.findOne(postId, userId),
        };
    }


    async remove(postId: string, userId: string) {
        const result = await this.prisma.post.updateMany({
            where: {
                id: postId,
                authorId: userId,
                deletedAt: null,
            },
            data: {
                deletedAt: new Date(),
            },
        });

        if (result.count !== 1) {
            const post = await this.prisma.post.findUnique({
                where: { id: postId },
                select: {
                    id: true,
                    authorId: true,
                    deletedAt: true,
                },
            });

            if (!post || post.deletedAt) {
                throw new NotFoundException('Post not found');
            }

            throw new ForbiddenException(
                'You can only delete your own posts',
            );
        }

        return {
            data: {
                id: postId,
                deletedAt: new Date(),
            },
        };
    }

    // Bài viết phải tồn tại và viewer phải được xem thì mới tương tác được.
    private async requireVisible(postId: string, userId: string) {
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

        return post;
    }

    async repost(postId: string, userId: string) {
        const post = await this.requireVisible(postId, userId);

        if (post.authorId === userId) {
            throw new ConflictException(
                'You cannot repost your own post',
            );
        }

        const created = await this.prisma.repost.createMany({
            data: [{ userId, postId }],
            skipDuplicates: true,
        });

        if (created.count > 0) {
            await this.notificationsService.notify({
                type: 'REPOST',
                actorId: userId,
                recipientId: post.authorId,
                postId,
            });
        }

        return {
            reposted: true,
            data: await this.prisma.repost.findUnique({
                where: { userId_postId: { userId, postId } },
            }),
        };
    }

    async undoRepost(postId: string, userId: string) {
        const result = await this.prisma.repost.deleteMany({
            where: {
                userId,
                postId,
            },
        });

        return {
            reposted: false,
            removed: result.count > 0,
        };
    }

    async setSaved(postId: string, userId: string, saved: boolean) {
        if (saved) {
            await this.requireVisible(postId, userId);
            await this.prisma.save.createMany({
                data: [{ userId, postId }],
                skipDuplicates: true,
            });
        } else {
            await this.prisma.save.deleteMany({ where: { userId, postId } });
        }

        return { data: { isSaved: saved } };
    }

    async setHidden(postId: string, userId: string, hidden: boolean) {
        if (hidden) {
            await this.requireVisible(postId, userId);
            await this.prisma.hiddenPost.createMany({
                data: [{ userId, postId }],
                skipDuplicates: true,
            });
        } else {
            await this.prisma.hiddenPost.deleteMany({
                where: { userId, postId },
            });
        }

        return { data: { isHidden: hidden } };
    }

    async findSaved(userId: string, query: FeedQueryDto) {
        const { page, limit } = query;
        const where = {
            userId,
            post: visiblePostWhere(
                userId,
                await blockedUserIds(this.prisma, userId),
            ),
        };

        const [saves, total] = await Promise.all([
            this.prisma.save.findMany({
                where,
                orderBy: { createdAt: 'desc' },
                skip: (page - 1) * limit,
                take: limit,
                select: { post: { select: postSelect(userId) } },
            }),
            this.prisma.save.count({ where }),
        ]);

        return {
            data: saves.map((save) => toPostDto(save.post)),
            meta: pageMeta(page, limit, total),
        };
    }

    // Tìm theo nội dung; hashtag cũng đi qua đây (q = "#tag").
    // shortcut: ILIKE quét toàn bảng, thêm chỉ mục pg_trgm khi số bài vượt vài chục nghìn.
    async search(userId: string, q: string, query: FeedQueryDto) {
        const { page, limit } = query;
        const where = {
            ...visiblePostWhere(
                userId,
                await blockedUserIds(this.prisma, userId),
            ),
            content: { contains: q.trim(), mode: 'insensitive' as const },
        };

        const [posts, total] = await Promise.all([
            this.prisma.post.findMany({
                where,
                orderBy: { createdAt: 'desc' },
                skip: (page - 1) * limit,
                take: limit,
                select: postSelect(userId),
            }),
            this.prisma.post.count({ where }),
        ]);

        return {
            data: posts.map(toPostDto),
            meta: pageMeta(page, limit, total),
        };
    }
}
