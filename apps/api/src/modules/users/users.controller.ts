import {
    Controller,
    Get,
    Query,
    Param,
    Request,
    UnauthorizedException,
    UseGuards,
    Delete,
    Post,
} from "@nestjs/common";

import { JwtAuthGuard } from "../auth/guards/jwt-auth.guard";
import { AuthenticatedRequest } from "../auth/types/authenticated-request.type";
import { UsersService } from "./users.service";
import { FeedQueryDto } from "../posts/dto/feed-query.dto";

@Controller("users")
export class UsersController {
    constructor(
        private readonly usersService: UsersService,
    ) { }

    @UseGuards(JwtAuthGuard)
    @Get("me")
    async getMe(
        @Request() request: AuthenticatedRequest,
    ) {
        const user =
            await this.usersService.findById(
                request.user.userId,
            );

        if (!user) {
            throw new UnauthorizedException();
        }

        return {
            data: {
                id: user.id,
                username: user.username,
                email: user.email,
                displayName: user.displayName,
                bio: user.bio,
                avatarUrl: user.avatarUrl,
                createdAt: user.createdAt,
                updatedAt: user.updatedAt,
            },
        };
    }

    @Get(':id')
    async getProfile(@Param('id') id: string) {
        return this.usersService.findProfile(id);
    }

    @Get(':id/posts')
    async getUserPosts(
        @Param('id') id: string,
        @Query() query: FeedQueryDto,
    ) {
        return this.usersService.findUserPosts(
            id,
            query.page,
            query.limit,
        );
    }

    @Post(':id/follow')
    async follow(
        @Request() request: { user: { userId: string } },
        @Param('id') id: string,
    ) {
        return this.usersService.follow(
            request.user.userId,
            id,
        );
    }

    @Delete(':id/follow')
    async unfollow(
        @Request() request: { user: { userId: string } },
        @Param('id') id: string,
    ) {
        return this.usersService.unfollow(
            request.user.userId,
            id,
        );
    }

    @Get(':id/followers')
    async getFollowers(
        @Param('id') id: string,
        @Query() query: FeedQueryDto,
    ) {
        return this.usersService.getFollowers(
            id,
            query.page,
            query.limit,
        );
    }

    @Get(':id/following')
    async getFollowing(
        @Param('id') id: string,
        @Query() query: FeedQueryDto,
    ) {
        return this.usersService.getFollowing(
            id,
            query.page,
            query.limit,
        );
    }
}