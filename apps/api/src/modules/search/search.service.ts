import { Injectable } from '@nestjs/common';
import { PrismaService } from '../../prisma/prisma.service';
import { UserSearchQueryDto } from './dto/user-search-query.dto';
import { blockedUserIds } from '../posts/post-view';

@Injectable()
export class SearchService {
    constructor(
        private readonly prisma: PrismaService,
    ) { }

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