import {
    Body,
    Controller,
    Get,
    Param,
    Post,
    Req,
    UseGuards,
} from '@nestjs/common';

import { CreatePostDto } from './dto/create-post.dto';
import { PostsService } from './posts.service';

import { JwtAuthGuard } from "../auth/guards/jwt-auth.guard";

@Controller('posts')
@UseGuards(JwtAuthGuard)
export class PostsController {
    constructor(private readonly postsService: PostsService) { }

    @Post()
    async create(
        @Req() request: { user: { userId: string } },
        @Body() dto: CreatePostDto,
    ) {
        const post = await this.postsService.create(
            request.user.userId,
            dto,
        );

        return {
            data: post,
        };
    }

    @Get(':id')
    async findOne(@Param('id') id: string) {
        const post = await this.postsService.findOne(id);

        return {
            data: post,
        };
    }
}