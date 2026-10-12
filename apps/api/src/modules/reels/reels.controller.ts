import {
    Body,
    Controller,
    Get,
    HttpCode,
    Post,
    Query,
    Request,
    UseGuards,
} from '@nestjs/common';

import { JwtAuthGuard } from '../auth/guards/jwt-auth.guard';
import { InteractionsDto } from './dto/interactions.dto';
import { ReelFeedQueryDto } from './dto/reel-feed-query.dto';
import { UploadUrlDto } from './dto/upload-url.dto';
import { ReelsService } from './reels.service';

type AuthedRequest = { user: { userId: string }; hostname: string };

@Controller()
@UseGuards(JwtAuthGuard)
export class ReelsController {
    constructor(private readonly reelsService: ReelsService) { }

    @Post('media/upload-url')
    createUploadUrl(@Request() request: AuthedRequest, @Body() dto: UploadUrlDto) {
        return this.reelsService.createUploadUrl(
            request.user.userId,
            dto,
            request.hostname,
        );
    }

    @Get('reels/feed')
    getFeed(@Request() request: AuthedRequest, @Query() query: ReelFeedQueryDto) {
        return this.reelsService.getFeed(
            request.user.userId,
            query.limit,
            (query.exclude ?? '').split(',').filter(Boolean).slice(-50),
        );
    }

    @Post('interactions')
    @HttpCode(204)
    async recordInteractions(
        @Request() request: AuthedRequest,
        @Body() dto: InteractionsDto,
    ): Promise<void> {
        await this.reelsService.recordInteractions(request.user.userId, dto.events);
    }
}
