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

    @Get('me/follow-requests')
    async findRequests(@Request() request: { user: { userId: string } }) {
        return this.followsService.findRequests(request.user.userId);
    }

    // :id là người đã gửi yêu cầu.
    @Post(':id/follow-request/accept')
    async acceptRequest(
        @Request() request: { user: { userId: string } },
        @Param('id') requesterId: string,
    ) {
        return this.followsService.answerRequest(request.user.userId, requesterId, true);
    }

    @Delete(':id/follow-request')
    async declineRequest(
        @Request() request: { user: { userId: string } },
        @Param('id') requesterId: string,
    ) {
        return this.followsService.answerRequest(request.user.userId, requesterId, false);
    }

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
        @Request() request: { user: { userId: string } },
        @Param('id') userId: string,
        @Query() query: FeedQueryDto,
    ) {
        return this.followsService.getFollowers(
            request.user.userId,
            userId,
            query.page,
            query.limit,
        );
    }

    @Get(':id/following')
    async getFollowing(
        @Request() request: { user: { userId: string } },
        @Param('id') userId: string,
        @Query() query: FeedQueryDto,
    ) {
        return this.followsService.getFollowing(
            request.user.userId,
            userId,
            query.page,
            query.limit,
        );
    }
}
