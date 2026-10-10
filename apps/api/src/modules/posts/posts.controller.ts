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
import { PostsService } from './posts.service';

import { JwtAuthGuard } from "../auth/guards/jwt-auth.guard";
import { UpdatePostDto } from './dto/update-post.dto';

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


}