import { Controller, Delete, Get, Param, Post, Request, UseGuards } from '@nestjs/common';

import { JwtAuthGuard } from '../auth/guards/jwt-auth.guard';
import { PostsService } from './posts.service';

type AuthedRequest = { user: { userId: string } };

// Tắt tiếng người khác: ẩn bài và tin của họ khỏi bảng tin, Reels và khay tin của mình.
@Controller('users')
@UseGuards(JwtAuthGuard)
export class MutesController {
    constructor(private readonly postsService: PostsService) { }

    @Get('me/muted')
    findMuted(@Request() request: AuthedRequest) {
        return this.postsService.findMuted(request.user.userId);
    }

    @Post(':id/mute')
    mute(@Request() request: AuthedRequest, @Param('id') id: string) {
        return this.postsService.setMuted(request.user.userId, id, true);
    }

    @Delete(':id/mute')
    unmute(@Request() request: AuthedRequest, @Param('id') id: string) {
        return this.postsService.setMuted(request.user.userId, id, false);
    }
}
