import { BadRequestException, Injectable } from '@nestjs/common';
import { v4 as uuidv4 } from 'uuid';

import { PrismaService } from '../../prisma/prisma.service';
import {
    blockedUserIds,
    postSelect,
    toPostDto,
    visiblePostWhere,
} from '../posts/post-view';
import { StorageService } from '../storage/storage.service';
import { InteractionEventDto } from './dto/interactions.dto';
import { UploadUrlDto } from './dto/upload-url.dto';

// Giới hạn tệp tải lên; phía mobile kiểm tra cùng con số trước khi tải.
export const UPLOAD_LIMITS = {
    video: {
        maxBytes: 30 * 1024 * 1024,
        types: { 'video/mp4': 'mp4', 'video/quicktime': 'mov' } as Record<string, string>,
    },
    // Ảnh của tin 24 giờ.
    image: {
        maxBytes: 10 * 1024 * 1024,
        types: {
            'image/jpeg': 'jpg',
            'image/png': 'png',
            'image/webp': 'webp',
        } as Record<string, string>,
    },
    thumbnail: {
        maxBytes: 2 * 1024 * 1024,
        types: {
            'image/jpeg': 'jpg',
            'image/png': 'png',
            'image/webp': 'webp',
        } as Record<string, string>,
    },
};

const CANDIDATE_POOL = 200;
const SEEN_WINDOW_MS = 7 * 24 * 60 * 60 * 1000;
const SEEN_EVENTS = ['VIEW', 'COMPLETE', 'SKIP'];

@Injectable()
export class ReelsService {
    constructor(
        private readonly prisma: PrismaService,
        private readonly storageService: StorageService,
    ) { }

    async createUploadUrl(userId: string, dto: UploadUrlDto, requestHost: string) {
        const limit = UPLOAD_LIMITS[dto.kind];
        const extension = limit.types[dto.mimeType];

        if (!extension) {
            throw new BadRequestException(
                `Unsupported ${dto.kind} type: ${dto.mimeType}`,
            );
        }

        if (dto.sizeBytes > limit.maxBytes) {
            throw new BadRequestException(
                `File is too large: maximum ${limit.maxBytes / (1024 * 1024)} MB`,
            );
        }

        // Thư mục theo người dùng: khi tạo bài chỉ nhận khóa nằm trong thư mục của chính họ.
        const storageKey = `posts/${userId}/${uuidv4()}.${extension}`;

        return {
            data: {
                storageKey,
                uploadUrl: await this.storageService.createUploadUrl(
                    storageKey,
                    dto.mimeType,
                    requestHost,
                ),
                method: 'PUT',
                headers: { 'Content-Type': dto.mimeType },
            },
        };
    }

    // Xếp hạng bản đầu: mới + nhiều tương tác + người mình theo dõi; video đã xem chìm xuống cuối.
    // shortcut: chấm điểm trong bộ nhớ trên 200 video mới nhất, thay bằng bộ gợi ý theo sở thích khi có đủ dữ liệu xem.
    async getFeed(userId: string, limit: number, exclude: string[]) {
        const blocked = await blockedUserIds(this.prisma, userId);

        const [candidates, seenRows] = await Promise.all([
            this.prisma.post.findMany({
                where: {
                    ...visiblePostWhere(userId, blocked),
                    reelEligible: true,
                    hiddenBy: { none: { userId } },
                    ...(exclude.length ? { id: { notIn: exclude } } : {}),
                },
                orderBy: { createdAt: 'desc' },
                take: CANDIDATE_POOL,
                select: postSelect(userId),
            }),
            this.prisma.contentInteraction.findMany({
                where: {
                    userId,
                    eventType: { in: SEEN_EVENTS },
                    createdAt: { gte: new Date(Date.now() - SEEN_WINDOW_MS) },
                },
                distinct: ['postId'],
                select: { postId: true },
            }),
        ]);

        const followed = await this.prisma.follow.findMany({
            where: {
                followerId: userId,
                followingId: { in: candidates.map((post) => post.author.id) },
            },
            select: { followingId: true },
        });

        const seen = new Set(seenRows.map((row) => row.postId));
        const following = new Set(followed.map((row) => row.followingId));
        const now = Date.now();

        const ranked = candidates
            .map((post) => {
                const ageHours = (now - post.createdAt.getTime()) / 3_600_000;
                const engagement = Math.log1p(
                    post._count.likes +
                    2 * post._count.comments +
                    3 * post._count.reposts,
                );
                const isFollowing = following.has(post.author.id);

                return {
                    post,
                    engagement,
                    isFollowing,
                    score:
                        2 / (1 + ageHours / 24) +
                        engagement +
                        (isFollowing ? 1.5 : 0) -
                        (seen.has(post.id) ? 100 : 0),
                };
            })
            .sort((a, b) => b.score - a.score)
            .slice(0, limit);

        return {
            data: ranked.map(({ post, engagement, isFollowing }) => ({
                ...toPostDto(post),
                reason: isFollowing
                    ? { code: 'FOLLOWING', text: 'Bạn đang theo dõi người đăng' }
                    : engagement >= 1.5
                        ? { code: 'TRENDING', text: 'Đang được nhiều người quan tâm' }
                        : { code: 'FRESH', text: 'Video mới đăng' },
            })),
            meta: { requestId: uuidv4() },
        };
    }

    async recordInteractions(userId: string, events: InteractionEventDto[]) {
        if (events.length === 0) {
            return;
        }

        // Bỏ qua sự kiện của bài không còn tồn tại thay vì làm hỏng cả lô.
        const existing = await this.prisma.post.findMany({
            where: { id: { in: [...new Set(events.map((event) => event.postId))] } },
            select: { id: true },
        });
        const existingIds = new Set(existing.map((post) => post.id));

        await this.prisma.contentInteraction.createMany({
            data: events
                .filter((event) => existingIds.has(event.postId))
                .map((event) => ({
                    id: event.eventId,
                    userId,
                    postId: event.postId,
                    mediaId: event.mediaId ?? null,
                    eventType: event.eventType,
                    watchMs: event.watchMs ?? null,
                    durationMs: event.durationMs ?? null,
                    surface: event.surface,
                    requestId: event.requestId ?? null,
                    position: event.position ?? null,
                    ...(event.createdAt
                        ? { createdAt: new Date(event.createdAt) }
                        : {}),
                })),
            // Thiết bị gửi lại lô cũ khi mất mạng: cùng eventId thì không ghi lần hai.
            skipDuplicates: true,
        });
    }
}
