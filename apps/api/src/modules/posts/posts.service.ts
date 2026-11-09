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
import { CreateMediaPostDto } from './dto/create-media-post.dto';
import { storedPrivateUrl } from '../storage/media-url';
import { ImageModerationService } from '../moderation/image-moderation.service';
import { StorageService } from '../storage/storage.service';
import { FeedQueryDto } from './dto/feed-query.dto';
import { v4 as uuidv4 } from 'uuid';
import { UpdatePostDto } from './dto/update-post.dto';
import { NotificationsService } from '../notifications/notifications.service';
import {
    activeUserWhere,
    authorSelect,
    blockedUserIds,
    mutedUserIds,
    pageMeta,
    postSelect,
    repostSelect,
    toPostDto,
    toRepostDto,
    visiblePostWhere,
} from './post-view';

const MAX_VIDEO_BYTES = 30 * 1024 * 1024;
const MAX_THUMBNAIL_BYTES = 2 * 1024 * 1024;
// 60 giây, cộng 1 giây dung sai vì trình chọn video cắt không chính xác tới mili giây.
const MAX_VIDEO_MS = 61_000;

@Injectable()
export class PostsService {
    constructor(private readonly prisma: PrismaService,
        private readonly storageService: StorageService,
        private readonly notificationsService: NotificationsService,
        private readonly imageModeration: ImageModerationService,
    ) { }

    // Ảnh bài viết: chấm nhạy cảm (cùng mô hình, ngưỡng và chính sách thiếu mô hình như ảnh tin nhắn) rồi lưu
    // vào bucket riêng tư, để ảnh bài "Bạn bè"/"Chỉ mình tôi" không mở được bằng đường link trần.
    private async uploadImage(userId: string, file: Express.Multer.File) {
        const { sensitive } = await this.imageModeration.classify(file.buffer);
        const extension = file.originalname.split('.').pop()?.toLowerCase() || 'jpg';
        const url = await this.storageService.upload(
            file,
            `posts/${userId}/${uuidv4()}.${extension}`,
            { private: true },
        );

        return { url, sensitive, type: 'image' };
    }

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

        const uploadedFiles: { url: string; type: string; sensitive: boolean }[] = [];

        try {
            for (const file of files) {
                uploadedFiles.push(await this.uploadImage(userId, file));
            }

            const post = await this.prisma.post.create({
                data: {
                    authorId: userId,
                    content: content || null,
                    privacy: dto.privacy ?? 'PUBLIC',

                    media: {
                        create: uploadedFiles.map((file, order) => ({
                            ...file,
                            order,
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
            await this.storageService.removeByUrls(
                uploadedFiles.map((file) => file.url),
            );

            throw error;
        }
    }

    // Tạo bài từ video đã nằm trong kho. Máy chủ không tin số liệu client gửi về tệp:
    // tự kiểm tra tệp có thật, đúng loại và đúng dung lượng.
    async createWithMedia(userId: string, dto: CreateMediaPostDto) {
        const [item] = dto.media;
        const ownFolder = `posts/${userId}/`;
        const keys = [item.storageKey, item.thumbnailKey].filter(
            (key): key is string => Boolean(key),
        );

        if (keys.some((key) => !key.startsWith(ownFolder) || key.includes('..'))) {
            throw new BadRequestException('Invalid storage key');
        }

        const reject = async (message: string): Promise<never> => {
            await this.storageService.removeByUrls(keys.map(storedPrivateUrl));
            throw new BadRequestException(message);
        };

        const video = await this.storageService.head(item.storageKey);

        if (!video) {
            throw new BadRequestException('Uploaded video not found');
        }

        if (!video.contentType.startsWith('video/')) {
            await reject('Uploaded file is not a video');
        }

        if (video.size > MAX_VIDEO_BYTES) {
            await reject('Video is too large');
        }

        // shortcut: thời lượng do client báo (máy chủ không giải mã video); dùng ffprobe nếu cần chặn gian lận.
        if (item.durationMs > MAX_VIDEO_MS) {
            await reject('Video is too long');
        }

        if (item.thumbnailKey) {
            const thumbnail = await this.storageService.head(item.thumbnailKey);

            if (
                !thumbnail ||
                !thumbnail.contentType.startsWith('image/') ||
                thumbnail.size > MAX_THUMBNAIL_BYTES
            ) {
                await reject('Invalid thumbnail');
            }
        }

        const content = dto.content?.trim();
        const isVertical =
            !item.width || !item.height || item.height >= item.width;

        const post = await this.prisma.post.create({
            data: {
                authorId: userId,
                content: content || null,
                privacy: dto.privacy ?? 'PUBLIC',
                reelEligible: isVertical,
                media: {
                    create: [
                        {
                            type: 'video',
                            order: 0,
                            url: storedPrivateUrl(item.storageKey),
                            // shortcut: ảnh bìa video tải thẳng lên kho nên không qua mô hình nhạy cảm;
                            // muốn chấm thì đọc lại tệp (<= 2 MB) từ kho trước khi lưu.
                            thumbnailUrl: item.thumbnailKey
                                ? storedPrivateUrl(item.thumbnailKey)
                                : null,
                            width: item.width || null,
                            height: item.height || null,
                            durationMs: item.durationMs,
                            sizeBytes: video.size,
                        },
                    ],
                },
            },
            select: postSelect(userId),
        });

        if (post.privacy !== 'PRIVATE') {
            await this.notificationsService.notifyMentions(
                userId,
                post.content,
                post.id,
            );
        }

        return { data: toPostDto(post) };
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
        const [blocked, muted] = await Promise.all([
            blockedUserIds(this.prisma, userId),
            mutedUserIds(this.prisma, userId),
        ]);

        // Bảng tin: bài của chính mình và của người mình đang theo dõi, trừ người mình đã tắt tiếng.
        const postWhere = {
            AND: [
                visiblePostWhere(userId, blocked),
                { hiddenBy: { none: { userId } } },
                { authorId: { notIn: muted } },
                {
                    OR: [
                        { authorId: userId },
                        { author: { followers: { some: { followerId: userId } } } },
                    ],
                },
            ],
        };

        // Hiển thị repost của chính mình và người mình đang follow.
        // User A follow B => Follow có followerId=A, followingId=B.
        const repostWhere = {
            userId: { notIn: [...blocked, ...muted] },
            user: activeUserWhere,
            post: { hiddenBy: { none: { userId } }, authorId: { notIn: muted } },
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

        const uploadedFiles: { url: string; type: string; sensitive: boolean }[] = [];

        try {
            // Tải ảnh mới trước khi thay đổi dữ liệu trong database.
            for (const file of files) {
                uploadedFiles.push(await this.uploadImage(userId, file));
            }
        } catch (error) {
            await this.storageService.removeByUrls(
                uploadedFiles.map((file) => file.url),
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
                            ...file,
                            postId,
                            order: maxExistingOrder + index + 1,
                        })),
                    });
                }
            });
        } catch (error) {
            await this.storageService.removeByUrls(
                uploadedFiles.map((file) => file.url),
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

    // Tắt tiếng: lặng lẽ, người bị tắt tiếng không nhận thông báo nào.
    async setMuted(userId: string, targetUserId: string, muted: boolean) {
        if (!muted) {
            await this.prisma.mute.deleteMany({
                where: { muterId: userId, mutedId: targetUserId },
            });

            return { data: { isMuted: false } };
        }

        if (userId === targetUserId) {
            throw new BadRequestException('Bạn không thể tắt tiếng chính mình');
        }

        const target = await this.prisma.user.findFirst({
            where: { id: targetUserId, ...activeUserWhere },
            select: { id: true },
        });

        if (!target) {
            throw new NotFoundException('Không tìm thấy người dùng');
        }

        await this.prisma.mute.createMany({
            data: [{ muterId: userId, mutedId: targetUserId }],
            skipDuplicates: true,
        });

        return { data: { isMuted: true } };
    }

    async findMuted(userId: string) {
        const mutes = await this.prisma.mute.findMany({
            where: { muterId: userId },
            orderBy: { createdAt: 'desc' },
            select: { muted: { select: authorSelect } },
        });

        return { data: mutes.map((mute) => mute.muted) };
    }
}
