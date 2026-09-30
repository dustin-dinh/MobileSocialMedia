import {
    HttpException,
    HttpStatus,
    Injectable,
} from '@nestjs/common';
import { PrismaService } from '../../prisma/prisma.service';
import { CreatePostDto } from './dto/create-post.dto';

@Injectable()
export class PostsService {
    constructor(private readonly prisma: PrismaService) { }

    async create(userId: string, dto: CreatePostDto) {
        const content = dto.content?.trim() ?? '';

        if (!content) {
            throw new HttpException(
                {
                    error: {
                        code: 'POST_CONTENT_REQUIRED',
                        message: 'Post content is required',
                    },
                },
                HttpStatus.BAD_REQUEST,
            );
        }

        const post = await this.prisma.post.create({
            data: {
                authorId: userId,
                content,
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

        return post;
    }

    async findOne(postId: string) {
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

        return post;
    }
}