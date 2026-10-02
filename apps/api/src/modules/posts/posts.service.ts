import {
    BadRequestException,
    HttpException,
    HttpStatus,
    Injectable,
} from '@nestjs/common';
import { PrismaService } from '../../prisma/prisma.service';
import { CreatePostDto } from './dto/create-post.dto';
import { StorageService } from '../storage/storage.service';
import { FeedQueryDto } from './dto/feed-query.dto';
import { v4 as uuidv4 } from 'uuid';
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
    async getFeed(
        userId: string,
        query: FeedQueryDto,
    ) {
        const page = query.page;
        const limit = query.limit;
        const skip = (page - 1) * limit;

        const [posts, total] = await Promise.all([
            this.prisma.post.findMany({
                where: {
                    deletedAt: null,

                    OR: [
                        {
                            authorId: userId,
                        },
                        {
                            author: {
                                followers: {
                                    some: {
                                        followerId: userId,
                                    },
                                },
                            },
                        },
                    ],
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
                    }
                },
            }),

            this.prisma.post.count({
                where: {
                    deletedAt: null,

                    OR: [
                        {
                            authorId: userId,
                        },
                        {
                            author: {
                                followers: {
                                    some: {
                                        followerId: userId,
                                    },
                                },
                            },
                        },
                    ],
                },
            }),
        ]);

        // Lấy những post mà current user đã like
        const likedPosts = await this.prisma.like.findMany({
            where: {
                userId,
                postId: {
                    in: posts.map((post) => post.id),
                },
            },
            select: {
                postId: true,
            },
        });

        const likedPostIds = new Set(
            likedPosts.map((like) => like.postId),
        );

        // Chuẩn hóa response
        const data = posts.map((post) => ({
            id: post.id,
            content: post.content,
            createdAt: post.createdAt,
            updatedAt: post.updatedAt,
            author: post.author,
            media: post.media,
            likeCount: post._count.likes,
            isLiked: likedPostIds.has(post.id),
            commentsCount: post._count.comments,
        }));

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
}
