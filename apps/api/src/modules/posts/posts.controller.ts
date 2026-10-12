import {
    Body,
    Controller,
    Get,
    Param,
    Post,
    Request,
    Query,
    UseGuards,
    UploadedFiles,
    UseInterceptors,
    Patch,
    Delete,
} from '@nestjs/common';

import { FeedQueryDto } from './dto/feed-query.dto';

import { FilesInterceptor } from '@nestjs/platform-express';

import { CreatePostDto } from './dto/create-post.dto';
import { CreateMediaPostDto } from './dto/create-media-post.dto';
import { PostsService } from './posts.service';

import { JwtAuthGuard } from "../auth/guards/jwt-auth.guard";
import { UpdatePostDto } from './dto/update-post.dto';
import { PostSearchQueryDto } from './dto/post-search-query.dto';

@Controller('posts')

@UseGuards(JwtAuthGuard)
export class PostsController {
    constructor(private readonly postsService: PostsService) { }
    @Post()
    @UseInterceptors(FilesInterceptor('images', 4))
    async create(
        @Request() request: { user: { userId: string } },
        @Body() dto: CreatePostDto,
        @UploadedFiles() images: Express.Multer.File[],
    ) {
        return this.postsService.create(
            request.user.userId,
            dto,
            images ?? [],
        );
    }

    // Bài có video: tệp đã được điện thoại tải thẳng lên kho (xem POST /media/upload-url).
    @Post('media')
    async createWithMedia(
        @Request() request: { user: { userId: string } },
        @Body() dto: CreateMediaPostDto,
    ) {
        return this.postsService.createWithMedia(request.user.userId, dto);
    }

    @Get('feed')
    async getFeed(
        @Request() request: { user: { userId: string } },
        @Query() query: FeedQueryDto,
    ) {
        return this.postsService.getFeed(
            request.user.userId,
            query,
        );
    }

    // Các route tĩnh phải đứng trước `:id`.
    @Get('search')
    async search(
        @Request() request: { user: { userId: string } },
        @Query() query: PostSearchQueryDto,
    ) {
        return this.postsService.search(
            request.user.userId,
            query.q,
            query,
        );
    }

    @Get('saved')
    async findSaved(
        @Request() request: { user: { userId: string } },
        @Query() query: FeedQueryDto,
    ) {
        return this.postsService.findSaved(
            request.user.userId,
            query,
        );
    }

    @Get(':id')
    async findOne(
        @Request() request: { user: { userId: string } },
        @Param('id') id: string,
    ) {
        return this.postsService.findOne(
            id,
            request.user.userId,
        );
    }


    @Patch(':id')
    @UseInterceptors(FilesInterceptor('images', 4))
    async update(
        @Request() request: { user: { userId: string } },
        @Param('id') id: string,
        @Body() dto: UpdatePostDto,
        @UploadedFiles() images: Express.Multer.File[],
    ) {
        return this.postsService.update(
            id,
            request.user.userId,
            dto,
            images ?? [],
        );
    }

    @Delete(':id')
    async remove(
        @Request() request: { user: { userId: string } },
        @Param('id') id: string,
    ) {
        return this.postsService.remove(
            id,
            request.user.userId,
        );
    }

    @Post(':id/repost')
    async repost(
        @Request() request: { user: { userId: string } },
        @Param('id') id: string,
    ) {
        return this.postsService.repost(
            id,
            request.user.userId,
        );
    }

    @Delete(':id/repost')
    async undoRepost(
        @Request() request: { user: { userId: string } },
        @Param('id') id: string,
    ) {
        return this.postsService.undoRepost(
            id,
            request.user.userId,
        );
    }

    @Post(':id/save')
    async save(
        @Request() request: { user: { userId: string } },
        @Param('id') id: string,
    ) {
        return this.postsService.setSaved(
            id,
            request.user.userId,
            true,
        );
    }

    @Delete(':id/save')
    async unsave(
        @Request() request: { user: { userId: string } },
        @Param('id') id: string,
    ) {
        return this.postsService.setSaved(
            id,
            request.user.userId,
            false,
        );
    }

    // "Không quan tâm" trong Reels: ẩn bài khỏi mọi luồng của người xem.
    @Post(':id/not-interested')
    async notInterested(
        @Request() request: { user: { userId: string } },
        @Param('id') id: string,
    ) {
        return this.postsService.setHidden(id, request.user.userId, true);
    }

    @Post(':id/hide')
    async hide(
        @Request() request: { user: { userId: string } },
        @Param('id') id: string,
    ) {
        return this.postsService.setHidden(
            id,
            request.user.userId,
            true,
        );
    }

    @Delete(':id/hide')
    async unhide(
        @Request() request: { user: { userId: string } },
        @Param('id') id: string,
    ) {
        return this.postsService.setHidden(
            id,
            request.user.userId,
            false,
        );
    }
}
