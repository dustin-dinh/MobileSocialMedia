import { BadRequestException, Injectable, NotFoundException } from '@nestjs/common';
import { PrismaService } from '../../prisma/prisma.service';

type CreateUserData = {
    username: string;
    email: string;
    passwordHash: string;
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

    async create(data: CreateUserData) {
        return this.prisma.user.create({
            data,
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
        userId: string,
        page: number,
        limit: number,
    ) {
        const skip = (page - 1) * limit;

        const where = {
            authorId: userId,
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
                },
            }),

            this.prisma.post.count({
                where,
            }),
        ]);

        return {
            data: posts,
            meta: {
                page,
                limit,
                total,
                totalPages: Math.ceil(total / limit),
            },
        };
    }
    async follow(currentUserId: string, targetUserId: string) {
        if (currentUserId === targetUserId) {
            throw new BadRequestException('Cannot follow yourself');
        }

        const targetUser = await this.prisma.user.findUnique({
            where: { id: targetUserId },
            select: { id: true },
        });

        if (!targetUser) {
            throw new NotFoundException('User not found');
        }

        const existing = await this.prisma.follow.findUnique({
            where: {
                followerId_followingId: {
                    followerId: currentUserId,
                    followingId: targetUserId,
                },
            },
        });

        if (existing) {
            return {
                data: {
                    following: true,
                },
            };
        }

        await this.prisma.follow.create({
            data: {
                followerId: currentUserId,
                followingId: targetUserId,
            },
        });

        return {
            data: {
                following: true,
            },
        };
    }

    async unfollow(currentUserId: string, targetUserId: string) {
        await this.prisma.follow.deleteMany({
            where: {
                followerId: currentUserId,
                followingId: targetUserId,
            },
        });

        return {
            data: {
                following: false,
            },
        };
    }
    async getFollowers(userId: string, page: number, limit: number) {
        const skip = (page - 1) * limit;

        const [followers, total] = await Promise.all([
            this.prisma.follow.findMany({
                where: {
                    followingId: userId,
                },
                orderBy: {
                    followerId: 'asc',
                },
                skip,
                take: limit,
                select: {
                    follower: {
                        select: {
                            id: true,
                            username: true,
                            displayName: true,
                            avatarUrl: true,
                        },
                    },
                },
            }),

            this.prisma.follow.count({
                where: {
                    followingId: userId,
                },
            }),
        ]);
        return {
            data: followers.map((item) => item.follower),
            meta: {
                page,
                limit,
                total,
                totalPages: Math.ceil(total / limit),
            },
        };
    }

    async getFollowing(userId: string, page: number, limit: number) {
        const skip = (page - 1) * limit;

        const [following, total] = await Promise.all([
            this.prisma.follow.findMany({
                where: {
                    followerId: userId,
                },
                orderBy: {
                    followingId: 'asc',
                },
                skip,
                take: limit,
                select: {
                    following: {
                        select: {
                            id: true,
                            username: true,
                            displayName: true,
                            avatarUrl: true,
                        },
                    },
                },
            }),

            this.prisma.follow.count({
                where: {
                    followerId: userId,
                },
            }),
        ]);
        return {
            data: following.map((item) => item.following),
            meta: {
                page,
                limit,
                total,
                totalPages: Math.ceil(total / limit),
            },
        };
    }
}
