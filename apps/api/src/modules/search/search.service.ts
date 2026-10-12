import { Injectable } from '@nestjs/common';
import { PrismaService } from '../../prisma/prisma.service';
import { UserSearchQueryDto } from './dto/user-search-query.dto';
import { blockedUserIds } from '../posts/post-view';

@Injectable()
export class SearchService {
    constructor(
        private readonly prisma: PrismaService,
    ) { }

    // Hashtag được dùng trong nhiều bài công khai nhất trong 7 ngày qua.
    // shortcut: đếm trong bộ nhớ trên 500 bài mới nhất có dấu #, chuyển sang bảng hashtag khi lượng bài lớn.
    async trendingHashtags(viewerId: string, limit: number) {
        const posts = await this.prisma.post.findMany({
            where: {
                deletedAt: null,
                privacy: 'PUBLIC',
                content: { contains: '#' },
                createdAt: { gte: new Date(Date.now() - 7 * 24 * 60 * 60 * 1000) },
                author: {
                    isPrivate: false,
                    id: { notIn: await blockedUserIds(this.prisma, viewerId) },
                },
            },
            orderBy: { createdAt: 'desc' },
            take: 500,
            select: { content: true },
        });

        const counts = new Map<string, number>();

        for (const post of posts) {
            // Cùng mẫu với RichText ở mobile; mỗi bài chỉ tính một lần cho mỗi hashtag.
            const tags = new Set(
                (post.content ?? '')
                    .match(/#[\w.\u00C0-\u1EF9]*[\w\u00C0-\u1EF9]/g)
                    ?.map((tag) => tag.slice(1).toLowerCase()),
            );

            tags.forEach((tag) => counts.set(tag, (counts.get(tag) ?? 0) + 1));
        }

        return {
            data: [...counts.entries()]
                .sort((a, b) => b[1] - a[1] || a[0].localeCompare(b[0]))
                .slice(0, limit)
                .map(([tag, postsCount]) => ({ tag, postsCount })),
        };
    }

    async searchUsers(viewerId: string, query: UserSearchQueryDto) {
        const q = query.q.trim();
        const page = query.page;
        const limit = query.limit;
        const skip = (page - 1) * limit;

        const where = {
            id: { notIn: await blockedUserIds(this.prisma, viewerId) },
            OR: [
                {
                    username: {
                        contains: q,
                        mode: 'insensitive' as const,
                    },
                },
                {
                    displayName: {
                        contains: q,
                        mode: 'insensitive' as const,
                    },
                },
            ],
        };

        const [users, total] = await Promise.all([
            this.prisma.user.findMany({
                where,
                orderBy: {
                    username: 'asc',
                },
                skip,
                take: limit,
                select: {
                    id: true,
                    username: true,
                    displayName: true,
                    avatarUrl: true,
                },
            }),

            this.prisma.user.count({
                where,
            }),
        ]);

        return {
            data: users,
            meta: {
                page,
                limit,
                total,
                totalPages: Math.ceil(total / limit),
            },
        };
    }
}