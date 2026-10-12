import {
    Controller,
    Get,
    Query,
    Request,
    UseGuards,
} from '@nestjs/common';

import { JwtAuthGuard } from '../auth/guards/jwt-auth.guard';
import { SearchService } from './search.service';
import { UserSearchQueryDto } from './dto/user-search-query.dto';

@Controller('users')
@UseGuards(JwtAuthGuard)
export class SearchController {
    constructor(
        private readonly searchService: SearchService,
    ) { }

    @Get('search')
    async searchUsers(
        @Request() request: { user: { userId: string } },
        @Query() query: UserSearchQueryDto,
    ) {
        return this.searchService.searchUsers(request.user.userId, query);
    }
}
@Controller('hashtags')
@UseGuards(JwtAuthGuard)
export class HashtagsController {
    constructor(
        private readonly searchService: SearchService,
    ) { }

    @Get('trending')
    async trending(@Request() request: { user: { userId: string } }) {
        return this.searchService.trendingHashtags(request.user.userId, 10);
    }
}
