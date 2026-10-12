import {
    Body,
    Controller,
    Delete,
    Get,
    Patch,
    Post,
    Query,
    Param,
    Request,
    UnauthorizedException,
    UploadedFile,
    UseGuards,
    UseInterceptors,
} from "@nestjs/common";
import { FileInterceptor } from "@nestjs/platform-express";

import { JwtAuthGuard } from "../auth/guards/jwt-auth.guard";
import { AuthenticatedRequest } from "../auth/types/authenticated-request.type";
import { toMe, UsersService } from "./users.service";
import { FeedQueryDto } from "../posts/dto/feed-query.dto";
import { DeleteAccountDto } from "./dto/delete-account.dto";
import { UpdateProfileDto } from "./dto/update-profile.dto";

// Các route tĩnh (`me`, `suggestions`) phải khai báo trước `:id`.
@Controller("users")
@UseGuards(JwtAuthGuard)
export class UsersController {
    constructor(
        private readonly usersService: UsersService,
    ) { }

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
            data: toMe(user),
        };
    }

    @Patch("me")
    async updateMe(
        @Request() request: AuthenticatedRequest,
        @Body() dto: UpdateProfileDto,
    ) {
        return this.usersService.updateProfile(request.user.userId, dto);
    }

    @Delete("me")
    async deleteMe(
        @Request() request: AuthenticatedRequest,
        @Body() dto: DeleteAccountDto,
    ) {
        return this.usersService.deleteAccount(request.user.userId, dto);
    }

    @Post("me/avatar")
    @UseInterceptors(FileInterceptor("avatar"))
    async uploadAvatar(
        @Request() request: AuthenticatedRequest,
        @UploadedFile() avatar: Express.Multer.File,
    ) {
        return this.usersService.setAvatar(request.user.userId, avatar ?? null);
    }

    @Delete("me/avatar")
    async removeAvatar(
        @Request() request: AuthenticatedRequest,
    ) {
        return this.usersService.setAvatar(request.user.userId, null);
    }

    @Post("me/onboarding/complete")
    async completeOnboarding(
        @Request() request: AuthenticatedRequest,
    ) {
        return this.usersService.completeOnboarding(request.user.userId);
    }

    @Get("me/blocked")
    async findBlocked(
        @Request() request: AuthenticatedRequest,
    ) {
        return this.usersService.findBlocked(request.user.userId);
    }

    @Get("suggestions")
    async findSuggestions(
        @Request() request: AuthenticatedRequest,
        @Query() query: FeedQueryDto,
    ) {
        return this.usersService.findSuggestions(
            request.user.userId,
            query.limit,
        );
    }

    @Get(':id')
    async getProfile(
        @Request() request: AuthenticatedRequest,
        @Param('id') id: string,
    ) {
        return this.usersService.findProfile(id, request.user.userId);
    }

    @Get(':id/posts')
    async findUserPosts(
        @Request() request: AuthenticatedRequest,
        @Param('id') userId: string,
        @Query() query: FeedQueryDto,
    ) {
        return this.usersService.findUserPosts(
            userId,
            request.user.userId,
            query.page,
            query.limit,
        );
    }

    @Get(':id/reposts')
    async findUserReposts(
        @Request() request: AuthenticatedRequest,
        @Param('id') userId: string,
        @Query() query: FeedQueryDto,
    ) {
        return this.usersService.findUserReposts(
            userId,
            request.user.userId,
            query.page,
            query.limit,
        );
    }

    @Post(':id/block')
    async block(
        @Request() request: AuthenticatedRequest,
        @Param('id') userId: string,
    ) {
        return this.usersService.setBlocked(request.user.userId, userId, true);
    }

    @Delete(':id/block')
    async unblock(
        @Request() request: AuthenticatedRequest,
        @Param('id') userId: string,
    ) {
        return this.usersService.setBlocked(request.user.userId, userId, false);
    }
}
