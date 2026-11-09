import {
    BadRequestException,
    ConflictException,
    Injectable,
    NotFoundException,
} from '@nestjs/common';
import * as bcrypt from 'bcrypt';
import { v4 as uuidv4 } from 'uuid';

import { PrismaService } from '../../prisma/prisma.service';
import { ageLockedUserIds } from '../auth/ban-list';
import { ageOn, formatBirthDate, MINIMUM_AGE, parseBirthDate } from '../moderation/age';
import { StorageService } from '../storage/storage.service';
import {
    activeUserWhere,
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
    birthDate?: Date | null;
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
    coverUrl: string | null;
    isPrivate: boolean;
    role: string;
    birthDate: Date | null;
    allowAnonymousMessages: boolean;
    messagePermission: string;
    twoFactorEnabled: boolean;
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
        coverUrl: user.coverUrl,
        isPrivate: user.isPrivate,
        role: user.role,
        // null: tài khoản cũ hoặc đăng ký bằng Google chưa khai; app bắt khai trước khi dùng.
        birthDate: formatBirthDate(user.birthDate),
        allowAnonymousMessages: user.allowAnonymousMessages,
        messagePermission: user.messagePermission,
        twoFactorEnabled: user.twoFactorEnabled,
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
                birthDate: data.birthDate ?? null,
            },
        });
    }

    // Khai ngày sinh một lần (tài khoản chưa có). Dưới 18 tuổi: khóa tài khoản, không xóa dữ liệu.
    async setBirthDate(userId: string, value: string) {
        const birthDate = parseBirthDate(value);
        const current = await this.prisma.user.findUnique({
            where: { id: userId },
            select: { birthDate: true },
        });

        if (current?.birthDate) {
            throw new ConflictException('Birth date is already set');
        }

        const isMinor = ageOn(birthDate) < MINIMUM_AGE;
        const user = await this.prisma.user.update({
            where: { id: userId },
            data: { birthDate, ...(isMinor ? { ageLockedAt: new Date() } : {}) },
        });

        if (isMinor) {
            ageLockedUserIds.add(userId);
        }

        return { data: { ...toMe(user), ageLocked: isMinor } };
    }

    async updateProfile(userId: string, dto: UpdateProfileDto) {
        try {
            const user = await this.prisma.user.update({
                where: { id: userId },
                data: {
                    displayName: dto.displayName,
                    bio: dto.bio,
                    username: dto.username,
                    isPrivate: dto.isPrivate,
                    allowAnonymousMessages: dto.allowAnonymousMessages,
                    messagePermission: dto.messagePermission,
                },
            });

            // Chuyển về công khai: mọi yêu cầu đang chờ được chấp nhận luôn.
            if (dto.isPrivate === false) {
                const pending = await this.prisma.followRequest.findMany({
                    where: { targetId: userId },
                    select: { requesterId: true },
                });

                if (pending.length > 0) {
                    await this.prisma.$transaction([
                        this.prisma.follow.createMany({
                            data: pending.map((request) => ({
                                followerId: request.requesterId,
                                followingId: userId,
                            })),
                            skipDuplicates: true,
                        }),
                        this.prisma.followRequest.deleteMany({
                            where: { targetId: userId },
                        }),
                    ]);
                }
            }

            return { data: toMe(user) };
        } catch (error) {
            if ((error as { code?: string }).code === 'P2002') {
                throw new ConflictException('Username already exists');
            }

            throw error;
        }
    }

    // file = null nghĩa là gỡ ảnh. Dùng chung cho ảnh đại diện và ảnh bìa.
    async setImage(
        userId: string,
        field: 'avatarUrl' | 'coverUrl',
        file: Express.Multer.File | null,
    ) {
        let avatarUrl: string | null = null;
        const folder = field === 'avatarUrl' ? 'avatars' : 'covers';

        if (file) {
            if (!['image/jpeg', 'image/png', 'image/webp'].includes(file.mimetype)) {
                throw new BadRequestException(
                    `Unsupported image type: ${file.mimetype}`,
                );
            }

            if (file.size > 5 * 1024 * 1024) {
                throw new BadRequestException('Image must be <= 5MB');
            }

            const extension =
                file.originalname.split('.').pop()?.toLowerCase() || 'jpg';

            avatarUrl = await this.storageService.upload(
                file,
                `${folder}/${userId}/${uuidv4()}.${extension}`,
            );
        }

        const previous = await this.prisma.user.findUnique({
            where: { id: userId },
            select: { avatarUrl: true, coverUrl: true },
        });
        const user = await this.prisma.user.update({
            where: { id: userId },
            data: { [field]: avatarUrl },
        });

        await this.storageService.removeByUrls([previous?.[field]]);

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

        // Tệp không bị xóa theo dòng database, nên gom trước: ảnh và video bài viết, story, ảnh đại diện,
        // ảnh bìa, và ảnh người này đã gửi trong tin nhắn.
        const [media, stories, messageImages, openReports] = await Promise.all([
            this.prisma.postMedia.findMany({
                where: { post: { authorId: userId } },
                select: { url: true, thumbnailUrl: true },
            }),
            this.prisma.story.findMany({
                where: { authorId: userId },
                select: { url: true, thumbnailUrl: true },
            }),
            this.prisma.message.findMany({
                where: { senderId: userId, imageUrl: { not: null } },
                select: { imageUrl: true },
            }),
            this.prisma.report.findMany({
                where: { status: 'OPEN', targetType: 'CONVERSATION' },
                select: { snapshot: true },
            }),
        ]);
        // Ảnh nằm trong bản chụp của một báo cáo đang mở là bằng chứng: giữ lại.
        const evidence = new Set(
            openReports.flatMap(({ snapshot }) =>
                ((snapshot as { messages?: { imageUrl?: string | null }[] } | null)?.messages ?? [])
                    .map((message) => message.imageUrl),
            ),
        );

        // Giữ dòng User (đã xóa thông tin cá nhân) để hội thoại, báo cáo của người khác còn nguyên.
        const mine = { userId };
        await this.prisma.$transaction([
            this.prisma.post.deleteMany({ where: { authorId: userId } }),
            this.prisma.story.deleteMany({ where: { authorId: userId } }),
            this.prisma.comment.deleteMany({ where: mine }),
            this.prisma.follow.deleteMany({
                where: { OR: [{ followerId: userId }, { followingId: userId }] },
            }),
            this.prisma.followRequest.deleteMany({
                where: { OR: [{ requesterId: userId }, { targetId: userId }] },
            }),
            this.prisma.block.deleteMany({
                where: { OR: [{ blockerId: userId }, { blockedId: userId }] },
            }),
            this.prisma.mute.deleteMany({
                where: { OR: [{ muterId: userId }, { mutedId: userId }] },
            }),
            this.prisma.notification.deleteMany({
                where: { OR: [{ actorId: userId }, { recipientId: userId }] },
            }),
            this.prisma.save.deleteMany({ where: mine }),
            this.prisma.like.deleteMany({ where: mine }),
            this.prisma.repost.deleteMany({ where: mine }),
            this.prisma.commentLike.deleteMany({ where: mine }),
            this.prisma.hiddenPost.deleteMany({ where: mine }),
            this.prisma.storyReaction.deleteMany({ where: mine }),
            this.prisma.storyView.deleteMany({ where: { viewerId: userId } }),
            this.prisma.deviceToken.deleteMany({ where: mine }),
            this.prisma.authToken.deleteMany({ where: mine }),
            this.prisma.contentInteraction.deleteMany({ where: mine }),
            // Người kia thấy "Tin nhắn đã bị xóa" (messages.service, viewMessage).
            this.prisma.message.updateMany({
                where: { senderId: userId },
                data: { content: null, imageUrl: null, sensitive: false, storyId: null },
            }),
            this.prisma.user.update({
                where: { id: userId },
                data: {
                    deletedAt: new Date(),
                    // Mọi token đang có hết hiệu lực.
                    tokenVersion: { increment: 1 },
                    // Viết lại username và email để chúng đăng ký lại được.
                    username: `deleted_${userId.replace(/-/g, '').slice(0, 12)}`,
                    email: `deleted+${userId}@deleted.invalid`,
                    passwordHash: null,
                    googleId: null,
                    emailVerifiedAt: null,
                    // Lưu sẵn nhãn: mọi nơi hiện tên (danh sách hội thoại, đầu khung chat) tự hiện đúng.
                    displayName: 'Người dùng đã xóa',
                    avatarUrl: null,
                    coverUrl: null,
                    bio: null,
                    birthDate: null,
                    role: 'USER',
                    allowAnonymousMessages: false,
                    twoFactorEnabled: false,
                },
            }),
        ]);

        await this.storageService.removeByUrls(
            [
                ...media.flatMap((item) => [item.url, item.thumbnailUrl]),
                ...stories.flatMap((story) => [story.url, story.thumbnailUrl]),
                ...messageImages.map((message) => message.imageUrl),
                user.avatarUrl,
                user.coverUrl,
            ].filter((url) => !url || !evidence.has(url)),
        );

        return { data: { deleted: true } };
    }

    async findProfile(targetUserId: string, viewerId: string) {
        const [user, blocks, follows] = await Promise.all([
            // Tài khoản bị khóa, khóa vì tuổi hoặc đã xóa: với người khác coi như không tồn tại.
            this.prisma.user.findFirst({
                where: { id: targetUserId, ...activeUserWhere },
                select: {
                    ...authorSelect,
                    mutedBy: { where: { muterId: viewerId }, select: { muterId: true } },
                    bio: true,
                    coverUrl: true,
                    isPrivate: true,
                    allowAnonymousMessages: true,
                    createdAt: true,
                    _count: { select: { followers: true, following: true } },
                    followRequestsReceived: {
                        where: { requesterId: viewerId },
                        select: { requesterId: true },
                    },
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
                coverUrl: user.coverUrl,
                isPrivate: user.isPrivate,
                isFollowing: follows.some((f) => f.followerId === viewerId),
                // Viewer đã gửi yêu cầu theo dõi tài khoản riêng tư này và đang chờ duyệt.
                followRequested: user.followRequestsReceived.length > 0,
                followsYou: follows.some((f) => f.followerId === targetUserId),
                isBlocked: blocks.length > 0,
                // Người này nhận tin ẩn danh; chỉ người đang theo dõi mới gửi được (MessagesService).
                acceptsAnonymousMessages: user.allowAnonymousMessages,
                // Viewer đã tắt tiếng người này (chỉ viewer thấy).
                isMuted: user.mutedBy.length > 0,
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
            this.prisma.followRequest.deleteMany({
                where: {
                    OR: [
                        { requesterId: userId, targetId: targetUserId },
                        { requesterId: targetUserId, targetId: userId },
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
                    ...activeUserWhere,
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
                where: { id: { in: ids }, ...activeUserWhere },
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
