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
    IsIn,
    IsInt,
    IsOptional,
    IsString,
    MaxLength,
    Min,
} from 'class-validator';

import { JwtAuthGuard } from '../auth/guards/jwt-auth.guard';
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

    @Get(':id/viewers')
    findViewers(@Request() request: AuthedRequest, @Param('id') id: string) {
        return this.storiesService.findViewers(request.user.userId, id);
    }

    @Delete(':id')
    remove(@Request() request: AuthedRequest, @Param('id') id: string) {
        return this.storiesService.remove(request.user.userId, id);
    }
}
