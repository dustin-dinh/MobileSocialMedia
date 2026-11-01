import {
    Body,
    Controller,
    Delete,
    Get,
    Param,
    Post,
    Request,
    UseGuards,
} from '@nestjs/common';
import {
    IsBoolean,
    IsIn,
    IsInt,
    IsNotEmpty,
    IsOptional,
    IsString,
    MaxLength,
    Min,
} from 'class-validator';

import { JwtAuthGuard } from '../auth/guards/jwt-auth.guard';
import { REACTION_TYPES, ReactionType } from '../likes/likes.service';
import { StoriesService } from './stories.service';

class CreateStoryDto {
    @IsIn(['IMAGE', 'VIDEO'])
    type!: 'IMAGE' | 'VIDEO';

    @IsString()
    @MaxLength(300)
    storageKey!: string;

    @IsOptional()
    @IsString()
    @MaxLength(300)
    thumbnailKey?: string;

    @IsOptional()
    @IsInt()
    @Min(1)
    durationMs?: number;

    // Cho phép thả cảm xúc và trả lời ẩn danh story này.
    @IsOptional()
    @IsBoolean()
    allowAnonymous?: boolean;
}

class StoryReactionDto {
    @IsIn(REACTION_TYPES)
    type!: ReactionType;

    @IsOptional()
    @IsBoolean()
    anonymous?: boolean;
}

class StoryReplyDto {
    @IsString()
    @IsNotEmpty()
    @MaxLength(2000)
    content!: string;

    @IsOptional()
    @IsBoolean()
    anonymous?: boolean;
}

type AuthedRequest = { user: { userId: string } };

@Controller('stories')
@UseGuards(JwtAuthGuard)
export class StoriesController {
    constructor(private readonly storiesService: StoriesService) { }

    @Post()
    create(@Request() request: AuthedRequest, @Body() dto: CreateStoryDto) {
        return this.storiesService.create(request.user.userId, dto);
    }

    @Get('feed')
    feed(@Request() request: AuthedRequest) {
        return this.storiesService.feed(request.user.userId);
    }

    @Post(':id/view')
    markViewed(@Request() request: AuthedRequest, @Param('id') id: string) {
        return this.storiesService.markViewed(request.user.userId, id);
    }

    // Chủ story: danh sách người thả cảm xúc (không có danh sách người xem).
    @Get(':id/reactions')
    findReactions(@Request() request: AuthedRequest, @Param('id') id: string) {
        return this.storiesService.findReactions(request.user.userId, id);
    }

    @Post(':id/reactions')
    react(
        @Request() request: AuthedRequest,
        @Param('id') id: string,
        @Body() dto: StoryReactionDto,
    ) {
        return this.storiesService.react(request.user.userId, id, dto.type, dto.anonymous ?? false);
    }

    @Delete(':id/reactions')
    removeReaction(@Request() request: AuthedRequest, @Param('id') id: string) {
        return this.storiesService.removeReaction(request.user.userId, id);
    }

    @Post(':id/reply')
    reply(
        @Request() request: AuthedRequest,
        @Param('id') id: string,
        @Body() dto: StoryReplyDto,
    ) {
        return this.storiesService.reply(request.user.userId, id, dto.content, dto.anonymous ?? false);
    }

    @Delete(':id')
    remove(@Request() request: AuthedRequest, @Param('id') id: string) {
        return this.storiesService.remove(request.user.userId, id);
    }
}
