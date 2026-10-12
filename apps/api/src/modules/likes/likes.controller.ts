import {
    Body,
    Controller,
    Delete,
    Get,
    Param,
    Post,
    Query,
    Request,
    UseGuards,
} from '@nestjs/common';

import { IsIn, IsOptional } from 'class-validator';

import { LikesService, REACTION_TYPES, ReactionType } from './likes.service';
import { JwtAuthGuard } from '../auth/guards/jwt-auth.guard';
import { FeedQueryDto } from '../posts/dto/feed-query.dto';

class ReactDto {
    @IsOptional()
    @IsIn(REACTION_TYPES)
    type?: ReactionType;
}

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
        @Body() dto: ReactDto,
    ) {
        return this.likesService.like(
            request.user.userId,
            postId,
            dto?.type,
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
