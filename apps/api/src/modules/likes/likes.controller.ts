import {
    Controller,
    Delete,
    Param,
    Post,
    Request,
    UseGuards,
} from '@nestjs/common';
import { LikesService } from './likes.service';
import { JwtAuthGuard } from '../auth/guards/jwt-auth.guard';

@Controller('posts/:id/like')
@UseGuards(JwtAuthGuard)
export class LikesController {
    constructor(
        private readonly likesService: LikesService,
    ) { }

    @Post()
    async like(
        @Request() request: { user: { userId: string } },
        @Param('id') postId: string,
    ) {
        return this.likesService.like(
            request.user.userId,
            postId,
        );
    }

    @Delete()
    async unlike(
        @Request() request: { user: { userId: string } },
        @Param('id') postId: string,
    ) {
        return this.likesService.unlike(
            request.user.userId,
            postId,
        );
    }
}