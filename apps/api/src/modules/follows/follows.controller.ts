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

import { JwtAuthGuard } from '../auth/guards/jwt-auth.guard';
import { FeedQueryDto } from '../posts/dto/feed-query.dto';
import { FollowsService } from './follows.service';

@Controller('users')
@UseGuards(JwtAuthGuard)
export class FollowsController {
    constructor(private readonly followsService: FollowsService) { }

    @Post(':id/follow')
    async follow(
        @Request() request: { user: { userId: string } },
        @Param('id') targetUserId: string,
    ) {
        return this.followsService.follow(
            request.user.userId,
            targetUserId,
        );
    }

    @Delete(':id/follow')
    async unfollow(
        @Request() request: { user: { userId: string } },
        @Param('id') targetUserId: string,
    ) {
        return this.followsService.unfollow(
            request.user.userId,
            targetUserId,
        );
    }

    @Get(':id/followers')
    async getFollowers(
        @Param('id') userId: string,
        @Query() query: FeedQueryDto,
    ) {
        return this.followsService.getFollowers(
            userId,
            query.page,
            query.limit,
        );
    }

    @Get(':id/following')
    async getFollowing(
        @Param('id') userId: string,
        @Query() query: FeedQueryDto,
    ) {
        return this.followsService.getFollowing(
            userId,
            query.page,
            query.limit,
        );
    }
}
