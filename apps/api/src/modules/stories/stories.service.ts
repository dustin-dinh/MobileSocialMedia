import {
    BadRequestException,
    Injectable,
    NotFoundException,
} from '@nestjs/common';

import { PrismaService } from '../../prisma/prisma.service';
import { authorSelect, blockedUserIds } from '../posts/post-view';
import { storedUrl } from '../storage/media-url';
import { StorageService } from '../storage/storage.service';

const STORY_LIFETIME_MS = 24 * 60 * 60 * 1000;
const MAX_IMAGE_BYTES = 10 * 1024 * 1024;
const MAX_VIDEO_BYTES = 30 * 1024 * 1024;
// 60 giây, cộng 1 giây dung sai như video của bài viết.
const MAX_VIDEO_MS = 61_000;

export type CreateStoryInput = {
    type: 'IMAGE' | 'VIDEO';
    storageKey: string;
    thumbnailKey?: string;
    durationMs?: number;
};

// Tin 24 giờ. Hết hạn bằng cách lọc expiresAt khi đọc.
// shortcut: không có tác vụ dọn dẹp, dòng và tệp hết hạn vẫn nằm lại; thêm job xóa định kỳ khi dung lượng đáng kể.
@Injectable()
export class StoriesService {
    constructor(
        private readonly prisma: PrismaService,
        private readonly storageService: StorageService,
    ) { }

    // Tệp đã được điện thoại tải thẳng lên kho qua POST /media/upload-url.
    async create(userId: string, dto: CreateStoryInput) {
        const keys = [dto.storageKey, dto.thumbnailKey].filter(
            (key): key is string => Boolean(key),
        );

        if (keys.some((key) => !key.startsWith(`posts/${userId}/`) || key.includes('..'))) {
            throw new BadRequestException('Invalid storage key');
        }

        const reject = async (message: string): Promise<never> => {
            await Promise.allSettled(keys.map((key) => this.storageService.remove(key)));
            throw new BadRequestException(message);
        };

        const file = await this.storageService.head(dto.storageKey);

        if (!file) {
            throw new BadRequestException('Uploaded file not found');
        }

        const isVideo = dto.type === 'VIDEO';

        if (!file.contentType.startsWith(isVideo ? 'video/' : 'image/')) {
            await reject('Uploaded file does not match the story type');
        }

        if (file.size > (isVideo ? MAX_VIDEO_BYTES : MAX_IMAGE_BYTES)) {
            await reject('File is too large');
        }

        if (isVideo && (!dto.durationMs || dto.durationMs > MAX_VIDEO_MS)) {
            await reject('Video is too long');
        }

        const story = await this.prisma.story.create({
            data: {
                authorId: userId,
                type: isVideo ? 'video' : 'image',
                url: storedUrl(dto.storageKey),
                thumbnailUrl: dto.thumbnailKey ? storedUrl(dto.thumbnailKey) : null,
                durationMs: isVideo ? dto.durationMs : null,
                expiresAt: new Date(Date.now() + STORY_LIFETIME_MS),
            },
        });

        return { data: { ...story, isSeen: true, viewsCount: 0 } };
    }

    // Tin còn hạn của mình và của người mình theo dõi, gom theo tác giả.
    async feed(userId: string) {
        const blocked = await blockedUserIds(this.prisma, userId);

        const stories = await this.prisma.story.findMany({
            where: {
                expiresAt: { gt: new Date() },
                OR: [
                    { authorId: userId },
                    {
                        authorId: { notIn: blocked },
                        author: { followers: { some: { followerId: userId } } },
                    },
                ],
            },
            orderBy: { createdAt: 'asc' },
            select: {
                id: true,
                type: true,
                url: true,
                thumbnailUrl: true,
                durationMs: true,
                createdAt: true,
                expiresAt: true,
                author: { select: authorSelect },
                views: { where: { viewerId: userId }, select: { viewerId: true } },
                _count: { select: { views: true } },
            },
        });

        const groups = new Map<
            string,
            {
                author: (typeof stories)[number]['author'];
                hasUnseen: boolean;
                latestAt: Date;
                stories: unknown[];
            }
        >();

        for (const { author, views, _count, ...story } of stories) {
            const isOwn = author.id === userId;
            const isSeen = isOwn || views.length > 0;
            const group = groups.get(author.id) ?? {
                author,
                hasUnseen: false,
                latestAt: story.createdAt,
                stories: [],
            };

            group.hasUnseen ||= !isSeen;
            group.latestAt = story.createdAt;
            group.stories.push({
                ...story,
                isSeen,
                // Chỉ chủ tin mới biết số người đã xem.
                ...(isOwn ? { viewsCount: _count.views } : {}),
            });
            groups.set(author.id, group);
        }

        // Tin của mình trước, rồi nhóm còn tin chưa xem, mới nhất trước.
        const rank = (group: { author: { id: string }; hasUnseen: boolean }) =>
            group.author.id === userId ? 0 : group.hasUnseen ? 1 : 2;

        return {
            data: [...groups.values()].sort(
                (a, b) =>
                    rank(a) - rank(b) || b.latestAt.getTime() - a.latestAt.getTime(),
            ),
        };
    }

    private async requireOwn(userId: string, storyId: string) {
        const story = await this.prisma.story.findFirst({
            where: { id: storyId, authorId: userId },
        });

        if (!story) {
            throw new NotFoundException('Story not found');
        }

        return story;
    }

    // Chỉ ghi nhận lượt xem khi viewer thật sự được xem tin đó.
    async markViewed(userId: string, storyId: string) {
        const blocked = await blockedUserIds(this.prisma, userId);
        const story = await this.prisma.story.findFirst({
            where: {
                id: storyId,
                expiresAt: { gt: new Date() },
                authorId: { notIn: blocked },
                OR: [
                    { authorId: userId },
                    { author: { followers: { some: { followerId: userId } } } },
                ],
            },
            select: { authorId: true },
        });

        if (!story) {
            throw new NotFoundException('Story not found');
        }

        if (story.authorId !== userId) {
            await this.prisma.storyView.createMany({
                data: [{ storyId, viewerId: userId }],
                skipDuplicates: true,
            });
        }

        return { data: { isSeen: true } };
    }

    async findViewers(userId: string, storyId: string) {
        await this.requireOwn(userId, storyId);

        const views = await this.prisma.storyView.findMany({
            where: { storyId },
            orderBy: { createdAt: 'desc' },
            take: 200,
            select: { createdAt: true, viewer: { select: authorSelect } },
        });

        return {
            data: views.map((view) => ({ ...view.viewer, viewedAt: view.createdAt })),
        };
    }

    async remove(userId: string, storyId: string) {
        const story = await this.requireOwn(userId, storyId);

        await this.prisma.story.delete({ where: { id: storyId } });
        await this.storageService.removeByUrls([story.url, story.thumbnailUrl]);

        return { data: { deleted: true } };
    }
}
