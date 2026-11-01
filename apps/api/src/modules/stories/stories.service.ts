import {
    BadRequestException,
    ForbiddenException,
    Injectable,
    NotFoundException,
} from '@nestjs/common';

import { PrismaService } from '../../prisma/prisma.service';
import { ReactionType } from '../likes/likes.service';
import { MessagesService } from '../messages/messages.service';
import { NotificationsService } from '../notifications/notifications.service';
import { authorSelect, blockedUserIds } from '../posts/post-view';
import { storedUrl } from '../storage/media-url';
import { StorageService } from '../storage/storage.service';

const STORY_LIFETIME_MS = 24 * 60 * 60 * 1000;
const MAX_IMAGE_BYTES = 10 * 1024 * 1024;
const MAX_VIDEO_BYTES = 30 * 1024 * 1024;
// 60 giây, cộng 1 giây dung sai như video của bài viết.
const MAX_VIDEO_MS = 61_000;
// Thông báo cảm xúc được gộp: mỗi story tối đa một push trong khoảng này.
const REACTION_PUSH_INTERVAL_MS = 15 * 60 * 1000;

export type CreateStoryInput = {
    type: 'IMAGE' | 'VIDEO';
    storageKey: string;
    thumbnailKey?: string;
    durationMs?: number;
    allowAnonymous?: boolean;
};

// Tin 24 giờ. Hết hạn bằng cách lọc expiresAt khi đọc.
// Chủ story không xem được ai đã xem (StoryView chỉ dùng cho vòng "đã xem" phía người xem);
// chủ story chỉ thấy người thả cảm xúc, người thả ẩn danh hiện là "Người ẩn danh".
// shortcut: không có tác vụ dọn dẹp, dòng và tệp hết hạn vẫn nằm lại; thêm job xóa định kỳ khi dung lượng đáng kể.
@Injectable()
export class StoriesService {
    // shortcut: nằm trong bộ nhớ một tiến trình; chạy nhiều bản API thì có thể push trùng một lần.
    private readonly lastReactionPushAt = new Map<string, number>();

    constructor(
        private readonly prisma: PrismaService,
        private readonly storageService: StorageService,
        private readonly messagesService: MessagesService,
        private readonly notificationsService: NotificationsService,
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
                allowAnonymous: dto.allowAnonymous ?? false,
            },
        });

        return { data: { ...story, isSeen: true, reactionsCount: 0 } };
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
                allowAnonymous: true,
                author: { select: authorSelect },
                views: { where: { viewerId: userId }, select: { viewerId: true } },
                reactions: {
                    where: { userId },
                    select: { type: true, isAnonymous: true },
                },
                _count: { select: { reactions: true } },
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

        for (const { author, views, reactions, _count, ...story } of stories) {
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
                // Chủ story thấy số cảm xúc; người xem thấy cảm xúc của chính mình.
                ...(isOwn
                    ? { reactionsCount: _count.reactions }
                    : { myReaction: reactions[0] ?? null }),
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

    // Story còn hạn mà viewer được xem (của chính họ hoặc của người họ theo dõi, không chặn nhau).
    private async requireVisible(userId: string, storyId: string) {
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
            select: { id: true, authorId: true, allowAnonymous: true },
        });

        if (!story) {
            throw new NotFoundException('Story not found');
        }

        return story;
    }

    // Ghi nhận lượt xem chỉ để tô vòng "đã xem" cho người xem; chủ story không đọc được danh sách này.
    async markViewed(userId: string, storyId: string) {
        const story = await this.requireVisible(userId, storyId);

        if (story.authorId !== userId) {
            await this.prisma.storyView.createMany({
                data: [{ storyId, viewerId: userId }],
                skipDuplicates: true,
            });
        }

        return { data: { isSeen: true } };
    }

    // Một cảm xúc mỗi người mỗi story; thả lại thì đổi. Ẩn danh chỉ khi chủ story cho phép.
    async react(userId: string, storyId: string, type: ReactionType, anonymous: boolean) {
        const story = await this.requireVisible(userId, storyId);

        if (story.authorId === userId) {
            throw new BadRequestException('You cannot react to your own story');
        }

        if (anonymous && !story.allowAnonymous) {
            throw new ForbiddenException('This story does not allow anonymous reactions');
        }

        await this.prisma.storyReaction.upsert({
            where: { storyId_userId: { storyId, userId } },
            create: { storyId, userId, type, isAnonymous: anonymous },
            update: { type, isAnonymous: anonymous },
        });

        // Gộp: không báo từng cảm xúc, và không nêu tên ai (kể cả cảm xúc công khai).
        const now = Date.now();

        if (now - (this.lastReactionPushAt.get(storyId) ?? 0) > REACTION_PUSH_INTERVAL_MS) {
            this.lastReactionPushAt.set(storyId, now);
            void this.notificationsService.pushToUser(
                story.authorId,
                'MobileSocialMedia',
                'Story của bạn có cảm xúc mới',
                { type: 'STORY_REACTION', storyId },
            );
        }

        return { data: { myReaction: { type, isAnonymous: anonymous } } };
    }

    async removeReaction(userId: string, storyId: string) {
        await this.prisma.storyReaction.deleteMany({ where: { storyId, userId } });

        return { data: { myReaction: null } };
    }

    // Chủ story xem ai đã thả cảm xúc. Người thả ẩn danh: `user: null`.
    async findReactions(userId: string, storyId: string) {
        await this.requireOwn(userId, storyId);

        const reactions = await this.prisma.storyReaction.findMany({
            where: { storyId },
            orderBy: { createdAt: 'desc' },
            take: 200,
            select: {
                type: true,
                isAnonymous: true,
                createdAt: true,
                user: { select: authorSelect },
            },
        });

        return {
            data: reactions.map((reaction) => ({
                type: reaction.type,
                isAnonymous: reaction.isAnonymous,
                createdAt: reaction.createdAt,
                user: reaction.isAnonymous ? null : reaction.user,
            })),
        };
    }

    // Trả lời story: vào tin nhắn thường, hoặc vào hội thoại ẩn danh khi chủ story cho phép.
    async reply(userId: string, storyId: string, content: string, anonymous: boolean) {
        const story = await this.requireVisible(userId, storyId);

        if (story.authorId === userId) {
            throw new BadRequestException('You cannot reply to your own story');
        }

        if (anonymous && !story.allowAnonymous) {
            throw new ForbiddenException('This story does not allow anonymous replies');
        }

        const conversationId = anonymous
            ? (await this.messagesService.openAnonymousConversation(userId, story.authorId)).id
            : (await this.messagesService.open(userId, story.authorId)).data.id;

        const sent = await this.messagesService.send(
            userId,
            conversationId,
            { content },
            undefined,
            storyId,
        );

        return { data: { conversationId, message: sent.data } };
    }

    async remove(userId: string, storyId: string) {
        const story = await this.requireOwn(userId, storyId);

        await this.prisma.story.delete({ where: { id: storyId } });
        await this.storageService.removeByUrls([story.url, story.thumbnailUrl]);

        return { data: { deleted: true } };
    }
}
