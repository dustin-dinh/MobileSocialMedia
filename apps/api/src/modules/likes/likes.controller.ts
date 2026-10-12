import {
    Controller,
    Delete,
    Get,
    Param,
    Post,
    Query,
    Request,
    UseGuards,
} from '@nestjs/common';

import { LikesService } from './likes.service';
import { JwtAuthGuard } from '../auth/guards/jwt-auth.guard';
import { FeedQueryDto } from '../posts/dto/feed-query.dto';

@Controller('posts/:id')
@UseGuards(JwtAuthGuard)
export class LikesController {
    constructor(
        private readonly likesService: LikesService,
    ) { }

    @Post('like')
    async like(
        @Request() request: { user: { userId: string } },
        @Param('id') postId: string,
    ) {
        return this.likesService.like(
            request.user.userId,
            postId,
        );
    }

    @Delete('like')
    async unlike(
        @Request() request: { user: { userId: string } },
        @Param('id') postId: string,
    ) {
        return this.likesService.unlike(
            request.user.userId,
            postId,
        );
    }

    @Get('likes')
    async findLikers(
        @Request() request: { user: { userId: string } },
        @Param('id') postId: string,
        @Query() query: FeedQueryDto,
    ) {
        return this.likesService.findLikers(
            request.user.userId,
            postId,
            query.page,
            query.limit,
        );
    }
}
