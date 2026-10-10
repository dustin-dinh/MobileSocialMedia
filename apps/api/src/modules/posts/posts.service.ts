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
import Multer from 'multer';
import { UpdatePostDto } from './dto/update-post.dto';
@Injectable()
export class PostsService {
    constructor(private readonly prisma: PrismaService,
        private readonly storageService: StorageService,
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

                select: {
                    id: true,
                    content: true,
                    createdAt: true,
                    updatedAt: true,

                    author: {
                        select: {
                            id: true,
                            username: true,
                            displayName: true,
                            avatarUrl: true,
                        },
                    },

                    media: {
                        orderBy: {
                            order: 'asc',
                        },

                        select: {
                            id: true,
                            url: true,
                            type: true,
                            order: true,
                        },
                    },
                },
            });

            return {
                data: post,
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
                deletedAt: null,
                OR: [
                    // Công khai: người dùng đăng nhập đều xem được.
                    {
                        privacy: 'PUBLIC',
                    },

                    // Tác giả luôn xem được bài của chính mình.
                    {
                        authorId: userId,
                    },

                    // FRIENDS: phải follow tác giả và tác giả cũng follow lại.
                    {
                        privacy: 'FRIENDS',
                        author: {
                            followers: {
                                some: {
                                    followerId: userId,
                                },
                            },
                            following: {
                                some: {
                                    followingId: userId,
                                },
                            },
                        },
                    },
                ],
            },
            select: {
                id: true,
                content: true,
                createdAt: true,
                updatedAt: true,

                author: {
                    select: {
                        id: true,
                        username: true,
                        displayName: true,
                        avatarUrl: true,
                    },
                },

                media: {
                    orderBy: {
                        order: 'asc',
                    },
                    select: {
                        id: true,
                        url: true,
                        type: true,
                        order: true,
                    },
                },

                _count: {
                    select: {
                        likes: true,
                        comments: true,
                    },
                },
            },
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

        // Kiểm tra user hiện tại đã like bài viết chưa
        const like = await this.prisma.like.findUnique({
            where: {
                userId_postId: {
                    userId,
                    postId,
                },
            },
            select: {
                userId: true,
            },
        });

        return {
            id: post.id,
            content: post.content,
            createdAt: post.createdAt,
            updatedAt: post.updatedAt,
            author: post.author,
            media: post.media,
            likeCount: post._count.likes,
            commentsCount: post._count.comments,
            isLiked: !!like,
        };
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
        const fetchCount = skip + limit;

        // Quyền xem bài viết thông thường.
        const postAccessWhere = {
            deletedAt: null,
            OR: [
                { privacy: 'PUBLIC' as const },
                { authorId: userId },
                {
                    privacy: 'FRIENDS' as const,
                    author: {
                        followers: {
                            some: { followerId: userId },
                        },
                        following: {
                            some: { followingId: userId },
                        },
                    },
                },
            ],
        };

        // Hiển thị repost của chính mình và người mình đang follow.
        // User A follow B => Follow có followerId=A, followingId=B.
        const repostWhere = {
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

        const [posts, totalPosts, reposts, totalReposts] =
            await Promise.all([
                this.prisma.post.findMany({
                    where: postAccessWhere,
                    orderBy: [
                        { createdAt: 'desc' },
                        { id: 'desc' },
                    ],
                    take: fetchCount,
                    select: {
                        id: true,
                        content: true,
                        createdAt: true,
                        updatedAt: true,
                        author: {
                            select: {
                                id: true,
                                username: true,
                                displayName: true,
                                avatarUrl: true,
                            },
                        },
                        media: {
                            orderBy: { order: 'asc' },
                            select: {
                                id: true,
                                url: true,
                                type: true,
                                order: true,
                            },
                        },
                        _count: {
                            select: {
                                likes: true,
                                comments: true,
                            },
                        },
                    },
                }),

                this.prisma.post.count({
                    where: postAccessWhere,
                }),

                this.prisma.repost.findMany({
                    where: repostWhere,
                    orderBy: [
                        { createdAt: 'desc' },
                        { id: 'desc' },
                    ],
                    take: fetchCount,
                    select: {
                        id: true,
                        userId: true,
                        postId: true,
                        createdAt: true,
                        user: {
                            select: {
                                id: true,
                                username: true,
                                displayName: true,
                                avatarUrl: true,
                            },
                        },
                        post: {
                            select: {
                                id: true,
                                authorId: true,
                                content: true,
                                createdAt: true,
                                updatedAt: true,
                                deletedAt: true,
                                privacy: true,
                                author: {
                                    select: {
                                        id: true,
                                        username: true,
                                        displayName: true,
                                        avatarUrl: true,
                                    },
                                },
                                media: {
                                    orderBy: { order: 'asc' },
                                    select: {
                                        id: true,
                                        url: true,
                                        type: true,
                                        order: true,
                                    },
                                },
                                _count: {
                                    select: {
                                        likes: true,
                                        comments: true,
                                    },
                                },
                            },
                        },
                    },
                }),

                this.prisma.repost.count({
                    where: repostWhere,
                }),
            ]);

        // Chỉ kiểm tra quyền cho các bài gốc FRIENDS chưa bị xóa.
        const friendsAuthorIds = [
            ...new Set(
                reposts
                    .filter(
                        (repost) =>
                            !repost.post.deletedAt &&
                            repost.post.privacy === 'FRIENDS' &&
                            repost.post.authorId !== userId,
                    )
                    .map((repost) => repost.post.authorId),
            ),
        ];

        // Lấy các quan hệ follow giữa viewer và những tác giả này.
        // Không cần truy vấn riêng cho từng repost.
        const followRelations = friendsAuthorIds.length
            ? await this.prisma.follow.findMany({
                where: {
                    OR: [
                        {
                            followerId: userId,
                            followingId: { in: friendsAuthorIds },
                        },
                        {
                            followerId: { in: friendsAuthorIds },
                            followingId: userId,
                        },
                    ],
                },
                select: {
                    followerId: true,
                    followingId: true,
                },
            })
            : [];

        const viewerFollows = new Set<string>();
        const authorsFollowViewer = new Set<string>();

        for (const relation of followRelations) {
            if (relation.followerId === userId) {
                viewerFollows.add(relation.followingId);
            }

            if (relation.followingId === userId) {
                authorsFollowViewer.add(relation.followerId);
            }
        }

        const mutualFollowAuthorIds = new Set(
            friendsAuthorIds.filter(
                (authorId) =>
                    viewerFollows.has(authorId) &&
                    authorsFollowViewer.has(authorId),
            ),
        );

        // Tập ID các bài gốc mà viewer thực sự được xem.
        const visibleOriginalIds = new Set<string>();

        for (const repost of reposts) {
            const original = repost.post;

            if (original.deletedAt) {
                continue;
            }

            if (
                original.privacy === 'PUBLIC' ||
                original.authorId === userId
            ) {
                visibleOriginalIds.add(original.id);
                continue;
            }

            if (
                original.privacy === 'FRIENDS' &&
                mutualFollowAuthorIds.has(original.authorId)
            ) {
                visibleOriginalIds.add(original.id);
            }

            // PRIVATE của người khác không được hiển thị.
        }

        const visiblePostIds = [
            ...posts.map((post) => post.id),
            ...reposts
                .filter((repost) =>
                    visibleOriginalIds.has(repost.post.id),
                )
                .map((repost) => repost.post.id),
        ];

        const likedPosts = visiblePostIds.length
            ? await this.prisma.like.findMany({
                where: {
                    userId,
                    postId: {
                        in: [...new Set(visiblePostIds)],
                    },
                },
                select: { postId: true },
            })
            : [];

        const likedPostIds = new Set(
            likedPosts.map((like) => like.postId),
        );

        const postItems = posts.map((post) => ({
            type: 'POST' as const,
            id: post.id,
            createdAt: post.createdAt,
            content: post.content,
            updatedAt: post.updatedAt,
            author: post.author,
            media: post.media,
            likeCount: post._count.likes,
            isLiked: likedPostIds.has(post.id),
            commentsCount: post._count.comments,
        }));

        const repostItems = reposts.map((repost) => {
            const original = repost.post;
            const available = visibleOriginalIds.has(original.id);

            return {
                type: 'REPOST' as const,
                id: repost.id,
                createdAt: repost.createdAt,
                repostedBy: repost.user,
                originalPost: available
                    ? {
                        id: original.id,
                        available: true,
                        content: original.content,
                        createdAt: original.createdAt,
                        updatedAt: original.updatedAt,
                        author: original.author,
                        media: original.media,
                        likeCount: original._count.likes,
                        isLiked: likedPostIds.has(original.id),
                        commentsCount: original._count.comments,
                    }
                    : {
                        id: null,
                        available: false,
                        content: null,
                        author: null,
                        media: [],
                        likeCount: null,
                        isLiked: false,
                        commentsCount: null,
                    },
            };
        });

        // Ghép hai loại item và dùng ID làm tiêu chí phụ khi trùng thời gian.
        const allItems = [...postItems, ...repostItems].sort(
            (a, b) =>
                new Date(b.createdAt).getTime() -
                new Date(a.createdAt).getTime() ||
                b.id.localeCompare(a.id),
        );

        const data = allItems.slice(skip, skip + limit);
        const total = totalPosts + totalReposts;

        return {
            data,
            meta: {
                page,
                limit,
                total,
                totalPages: Math.ceil(total / limit),
            },
        };
    }

    private storagePathFromPublicUrl(url: string): string | null {
        try {
            const parsedUrl = new URL(url);
            const marker = '/storage/v1/object/public/';

            const markerIndex = parsedUrl.pathname.indexOf(marker);

            if (markerIndex === -1) {
                return null;
            }

            const objectPath = parsedUrl.pathname.slice(
                markerIndex + marker.length,
            );

            const slashIndex = objectPath.indexOf('/');

            if (slashIndex === -1) {
                return null;
            }

            // Phần trước dấu / đầu tiên là bucket.
            // Phần còn lại là storage path.
            const path = decodeURIComponent(
                objectPath.slice(slashIndex + 1),
            );

            return path || null;
        } catch {
            return null;
        }
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

        let updated = false;

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

            updated = true;
        } catch (error) {
            await Promise.allSettled(
                uploadedFiles.map((file) =>
                    this.storageService.remove(file.storagePath),
                ),
            );

            throw error;
        }

        // Database đã cập nhật thành công. Dọn các ảnh cũ không còn
        // được tham chiếu. Nếu Storage lỗi, không rollback database;
        // các object lỗi cần được ghi log và dọn lại sau.
        if (updated) {
            const paths = removedMedia
                .map((media) => this.storagePathFromPublicUrl(media.url))
                .filter((path): path is string => path !== null);

            await Promise.allSettled(
                paths.map((path) => this.storageService.remove(path)),
            );
        }

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

    async repost(postId: string, userId: string) {
        const post = await this.prisma.post.findFirst({
            where: {
                id: postId,
                deletedAt: null,
                OR: [
                    { privacy: 'PUBLIC' },
                    { authorId: userId },
                    {
                        privacy: 'FRIENDS',
                        author: {
                            followers: {
                                some: { followerId: userId },
                            },
                            following: {
                                some: { followingId: userId },
                            },
                        },
                    },
                ],
            },
            select: {
                id: true,
                authorId: true,
            },
        });

        if (!post) {
            throw new NotFoundException('Post not found');
        }

        if (post.authorId === userId) {
            throw new ConflictException(
                'You cannot repost your own post',
            );
        }

        // Dùng upsert để tránh tạo repost trùng khi
        // người dùng gửi yêu cầu nhiều lần.
        const repost = await this.prisma.repost.upsert({
            where: {
                userId_postId: {
                    userId,
                    postId,
                },
            },
            create: {
                userId,
                postId,
            },
            update: {},
        });

        return {
            reposted: true,
            data: repost,
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

}
