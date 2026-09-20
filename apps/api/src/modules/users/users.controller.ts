import {
    Controller,
    Get,
    Req,
    UnauthorizedException,
    UseGuards,
} from "@nestjs/common";

import { JwtAuthGuard } from "../auth/guards/jwt-auth.guard";
import { AuthenticatedRequest } from "../auth/types/authenticated-request.type";
import { UsersService } from "./users.service";

@Controller("users")
export class UsersController {
    constructor(
        private readonly usersService: UsersService,
    ) { }

    @UseGuards(JwtAuthGuard)
    @Get("me")
    async getMe(
        @Req() request: AuthenticatedRequest,
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
}