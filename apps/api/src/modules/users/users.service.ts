import {
    BadRequestException,
    ConflictException,
    Injectable,
    NotFoundException,
} from '@nestjs/common';
import * as bcrypt from 'bcrypt';
import { v4 as uuidv4 } from 'uuid';

import { PrismaService } from '../../prisma/prisma.service';
import { StorageService } from '../storage/storage.service';
import {
    authorSelect,
    blockedUserIds,
    pageMeta,
    postSelect,
    repostSelect,
    toPostDto,
    toRepostDto,
    visiblePostWhere,
} from '../posts/post-view';
import { DeleteAccountDto } from './dto/delete-account.dto';
import { UpdateProfileDto } from './dto/update-profile.dto';

type CreateUserData = {
    username: string;
    email: string;
    passwordHash?: string | null;
    googleId?: string | null;
    displayName?: string | null;
    avatarUrl?: string | null;
};

type MeSource = {
    id: string;
    username: string;
    email: string;
    displayName: string | null;
    bio: string | null;
    avatarUrl: string | null;
    createdAt: Date;
    updatedAt: Date;
    onboardedAt: Date | null;
    passwordHash: string | null;
};

// Dạng trả về của "tài khoản đang đăng nhập", dùng chung cho login và /users/me.
export function toMe(user: MeSource) {
    return {
        id: user.id,
        username: user.username,
        email: user.email,
        displayName: user.displayName,
        bio: user.bio,
        avatarUrl: user.avatarUrl,
        createdAt: user.createdAt,
        updatedAt: user.updatedAt,
        onboardedAt: user.onboardedAt,
        hasPassword: user.passwordHash !== null,
    };
}

@Injectable()
export class UsersService {
    constructor(
        private readonly prisma: PrismaService,
        private readonly storageService: StorageService,
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

    async updateProfile(userId: string, dto: UpdateProfileDto) {
        try {
            const user = await this.prisma.user.update({
                where: { id: userId },
                data: {
                    displayName: dto.displayName,
                    bio: dto.bio,
                    username: dto.username,
                },
            });

            return { data: toMe(user) };
        } catch (error) {
            if ((error as { code?: string }).code === 'P2002') {
                throw new ConflictException('Username already exists');
            }

            throw error;
        }
    }

    // file = null nghĩa là gỡ ảnh đại diện.
    async setAvatar(userId: string, file: Express.Multer.File | null) {
        let avatarUrl: string | null = null;

        if (file) {
            if (!['image/jpeg', 'image/png', 'image/webp'].includes(file.mimetype)) {
                throw new BadRequestException(
                    `Unsupported image type: ${file.mimetype}`,
                );
            }

            if (file.size > 5 * 1024 * 1024) {
                throw new BadRequestException('Avatar must be <= 5MB');
            }

            const extension =
                file.originalname.split('.').pop()?.toLowerCase() || 'jpg';

            avatarUrl = await this.storageService.upload(
                file,
                `avatars/${userId}/${uuidv4()}.${extension}`,
            );
        }

        const previous = await this.prisma.user.findUnique({
            where: { id: userId },
            select: { avatarUrl: true },
        });
        const user = await this.prisma.user.update({
            where: { id: userId },
            data: { avatarUrl },
        });

        await this.storageService.removeByUrls([previous?.avatarUrl]);

        return { data: toMe(user) };
    }

    async completeOnboarding(userId: string) {
        const user = await this.prisma.user.update({
            where: { id: userId },
            data: { onboardedAt: new Date() },
        });

        return { data: toMe(user) };
    }

    async deleteAccount(userId: string, dto: DeleteAccountDto) {
        const user = await this.prisma.user.findUnique({
            where: { id: userId },
        });

        if (!user) {
            throw new NotFoundException('User not found');
        }

        // Không trả 401 ở đây: client coi 401 là hết phiên và tự đăng xuất.
        const confirmed = user.passwordHash
            ? Boolean(dto.password) &&
              (await bcrypt.compare(dto.password ?? '', user.passwordHash))
            : dto.confirm === user.username;

        if (!confirmed) {
            throw new BadRequestException(
                user.passwordHash
                    ? 'Incorrect password'
                    : 'Type your username to confirm',
            );
        }

        const media = await this.prisma.postMedia.findMany({
            where: { post: { authorId: userId } },
            select: { url: true },
        });

        // Các bảng liên quan đều onDelete: Cascade theo User.
        await this.prisma.user.delete({ where: { id: userId } });
        await this.storageService.removeByUrls([
            ...media.map((item) => item.url),
            user.avatarUrl,
        ]);

        return { data: { deleted: true } };
    }

    async findProfile(targetUserId: string, viewerId: string) {
        const [user, blocks, follows] = await Promise.all([
            this.prisma.user.findUnique({
                where: { id: targetUserId },
                select: {
                    ...authorSelect,
                    bio: true,
                    createdAt: true,
                    _count: { select: { followers: true, following: true } },
                },
            }),
            this.prisma.block.findMany({
                where: {
                    OR: [
                        { blockerId: viewerId, blockedId: targetUserId },
                        { blockerId: targetUserId, blockedId: viewerId },
                    ],
                },
                select: { blockerId: true },
            }),
            this.prisma.follow.findMany({
                where: {
                    OR: [
                        { followerId: viewerId, followingId: targetUserId },
                        { followerId: targetUserId, followingId: viewerId },
                    ],
                },
                select: { followerId: true },
            }),
        ]);

        // Người đã chặn viewer thì với viewer coi như không tồn tại.
        if (!user || blocks.some((block) => block.blockerId === targetUserId)) {
            throw new NotFoundException('User not found');
        }

        const postsCount = await this.prisma.post.count({
            where: {
                AND: [
                    { authorId: targetUserId },
                    visiblePostWhere(viewerId),
                ],
            },
        });

        return {
            data: {
                id: user.id,
                username: user.username,
                displayName: user.displayName,
                avatarUrl: user.avatarUrl,
                bio: user.bio,
                createdAt: user.createdAt,
                postsCount,
                followersCount: user._count.followers,
                followingCount: user._count.following,
                isFollowing: follows.some((f) => f.followerId === viewerId),
                followsYou: follows.some((f) => f.followerId === targetUserId),
                isBlocked: blocks.length > 0,
            },
        };
    }

    async findUserPosts(
        targetUserId: string,
        viewerUserId: string,
        page: number,
        limit: number,
    ) {
        const where = {
            AND: [
                { authorId: targetUserId },
                visiblePostWhere(
                    viewerUserId,
                    await blockedUserIds(this.prisma, viewerUserId),
                ),
            ],
        };

        const [posts, total] = await Promise.all([
            this.prisma.post.findMany({
                where,
                orderBy: {
                    createdAt: 'desc',
                },
                skip: (page - 1) * limit,
                take: limit,
                select: postSelect(viewerUserId),
            }),

            this.prisma.post.count({
                where,
            }),
        ]);

        return {
            data: posts.map(toPostDto),
            meta: pageMeta(page, limit, total),
        };
    }

    // Chỉ trả các bài đăng lại mà viewer còn xem được bài gốc.
    async findUserReposts(
        targetUserId: string,
        viewerUserId: string,
        page: number,
        limit: number,
    ) {
        const where = {
            userId: targetUserId,
            post: visiblePostWhere(
                viewerUserId,
                await blockedUserIds(this.prisma, viewerUserId),
            ),
        };

        const [reposts, total] = await Promise.all([
            this.prisma.repost.findMany({
                where,
                orderBy: { createdAt: 'desc' },
                skip: (page - 1) * limit,
                take: limit,
                select: repostSelect(viewerUserId),
            }),
            this.prisma.repost.count({ where }),
        ]);

        return {
            data: reposts.map((repost) => toRepostDto(repost, true)),
            meta: pageMeta(page, limit, total),
        };
    }

    async setBlocked(userId: string, targetUserId: string, blocked: boolean) {
        if (!blocked) {
            await this.prisma.block.deleteMany({
                where: { blockerId: userId, blockedId: targetUserId },
            });

            return { data: { isBlocked: false } };
        }

        if (userId === targetUserId) {
            throw new BadRequestException('Cannot block yourself');
        }

        const target = await this.prisma.user.findUnique({
            where: { id: targetUserId },
            select: { id: true },
        });

        if (!target) {
            throw new NotFoundException('User not found');
        }

        await this.prisma.$transaction([
            this.prisma.block.createMany({
                data: [{ blockerId: userId, blockedId: targetUserId }],
                skipDuplicates: true,
            }),
            this.prisma.follow.deleteMany({
                where: {
                    OR: [
                        { followerId: userId, followingId: targetUserId },
                        { followerId: targetUserId, followingId: userId },
                    ],
                },
            }),
        ]);

        return { data: { isBlocked: true } };
    }

    async findBlocked(userId: string) {
        const blocks = await this.prisma.block.findMany({
            where: { blockerId: userId },
            orderBy: { createdAt: 'desc' },
            select: { blocked: { select: authorSelect } },
        });

        return { data: blocks.map((block) => block.blocked) };
    }

    // Thứ tự ưu tiên: người đang follow mình -> bạn của bạn -> tài khoản nhiều follower.
    async findSuggestions(userId: string, limit: number) {
        const [following, blocked] = await Promise.all([
            this.prisma.follow.findMany({
                where: { followerId: userId },
                select: { followingId: true },
            }),
            blockedUserIds(this.prisma, userId),
        ]);
        const followingIds = following.map((row) => row.followingId);
        const excluded = [userId, ...followingIds, ...blocked];

        const [followers, friendsOfFriends] = await Promise.all([
            this.prisma.follow.findMany({
                where: { followingId: userId, followerId: { notIn: excluded } },
                orderBy: { createdAt: 'desc' },
                take: limit,
                select: { followerId: true },
            }),
            this.prisma.follow.groupBy({
                by: ['followingId'],
                where: {
                    followerId: { in: followingIds },
                    followingId: { notIn: excluded },
                },
                _count: { followingId: true },
                orderBy: { _count: { followingId: 'desc' } },
                take: limit,
            }),
        ]);

        const followsYou = new Set(followers.map((row) => row.followerId));
        let ids = [
            ...new Set([
                ...followsYou,
                ...friendsOfFriends.map((row) => row.followingId),
            ]),
        ].slice(0, limit);

        if (ids.length < limit) {
            const popular = await this.prisma.user.findMany({
                where: {
                    id: { notIn: [...excluded, ...ids] },
                    // Bỏ tài khoản đăng ký xong chưa từng xác thực.
                    OR: [
                        { emailVerifiedAt: { not: null } },
                        { googleId: { not: null } },
                    ],
                },
                orderBy: { followers: { _count: 'desc' } },
                take: limit - ids.length,
                select: { id: true },
            });

            ids = [...ids, ...popular.map((user) => user.id)];
        }

        const [users, mutuals] = await Promise.all([
            this.prisma.user.findMany({
                where: { id: { in: ids } },
                select: authorSelect,
            }),
            this.prisma.follow.findMany({
                where: {
                    followerId: { in: followingIds },
                    followingId: { in: ids },
                },
                select: {
                    followingId: true,
                    follower: {
                        select: { username: true, displayName: true },
                    },
                },
            }),
        ]);

        const usersById = new Map(users.map((user) => [user.id, user]));

        return {
            data: ids.flatMap((id) => {
                const user = usersById.get(id);

                if (!user) {
                    return [];
                }

                const mine = mutuals.filter((row) => row.followingId === id);

                return [{
                    ...user,
                    isFollowing: false,
                    mutualCount: mine.length,
                    mutualPreview: mine
                        .slice(0, 2)
                        .map((row) => row.follower.displayName ?? row.follower.username),
                    reason: followsYou.has(id)
                        ? 'FOLLOWS_YOU'
                        : mine.length > 0
                            ? 'MUTUAL'
                            : 'POPULAR',
                }];
            }),
        };
    }
}
