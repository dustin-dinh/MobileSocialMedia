import { Injectable, NotFoundException } from '@nestjs/common';
import { PrismaService } from '../../prisma/prisma.service';

type CreateUserData = {
    username: string;
    email: string;
    passwordHash?: string | null;
    googleId?: string | null;
    displayName?: string | null;
    avatarUrl?: string | null;
};

@Injectable()
export class UsersService {
    constructor(
        private readonly prisma: PrismaService,
    ) { }

    async findByEmail(email: string) {
        return this.prisma.user.findUnique({
            where: { email },
        });
    }

    async findByUsername(username: string) {
        return this.prisma.user.findUnique({
            where: { username },
        });
    }

    async findById(id: string) {
        return this.prisma.user.findUnique({
            where: { id },
        });
    }

    async findByGoogleId(googleId: string) {
        return this.prisma.user.findUnique({
            where: { googleId },
        });
    }

    async linkGoogle(userId: string, googleId: string) {
        return this.prisma.user.update({
            where: { id: userId },
            data: {
                googleId,
                passwordHash: null,
            },
        });
    }

    async create(data: CreateUserData) {
        return this.prisma.user.create({
            data: {
                username: data.username,
                email: data.email,
                passwordHash: data.passwordHash ?? null,
                googleId: data.googleId ?? null,
                displayName: data.displayName ?? null,
                avatarUrl: data.avatarUrl ?? null,
            },
        });
    }


    async findProfile(userId: string) {
        const user = await this.prisma.user.findUnique({
            where: { id: userId },
            select: {
                id: true,
                username: true,
                displayName: true,
                avatarUrl: true,
                bio: true,
                createdAt: true,
                _count: {
                    select: {
                        posts: {
                            where: {
                                deletedAt: null,
                            },
                        },
                    },
                },
            },
        });

        if (!user) {
            throw new NotFoundException('User not found');
        }

        return {
            data: {
                id: user.id,
                username: user.username,
                displayName: user.displayName,
                avatarUrl: user.avatarUrl,
                bio: user.bio,
                createdAt: user.createdAt,
                postsCount: user._count.posts,
            },
        };
    }
    async findUserPosts(
        targetUserId: string,
        viewerUserId: string,
        page: number,
        limit: number,
    ) {
        const skip = (page - 1) * limit;

        const where = {
            authorId: targetUserId,
            deletedAt: null,
        };

        const [posts, total] = await Promise.all([
            this.prisma.post.findMany({
                where,
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
                    },
                },
            }),

            this.prisma.post.count({
                where,
            }),
        ]);

        const likedPosts = await this.prisma.like.findMany({
            where: {
                userId: viewerUserId,
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

        const data = posts.map((post) => ({
            id: post.id,
            content: post.content,
            createdAt: post.createdAt,
            updatedAt: post.updatedAt,
            author: post.author,
            media: post.media,

            likeCount: post._count.likes,
            commentsCount: post._count.comments,
            isLiked: likedPostIds.has(post.id),
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
