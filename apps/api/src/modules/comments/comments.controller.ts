import {
    Body,
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
import { CommentsService } from './comments.service';
import { CreateCommentDto } from './dto/create-comment.dto';
import { CommentsQueryDto } from './dto/comments-query.dto';

@Controller()
@UseGuards(JwtAuthGuard)
export class CommentsController {
    constructor(
        private readonly commentsService: CommentsService,
    ) { }

    @Post('posts/:id/comments')
    async create(
        @Request() request: { user: { userId: string } },
        @Param('id') postId: string,
        @Body() dto: CreateCommentDto,
    ) {
        return this.commentsService.create(
            request.user.userId,
            postId,
            dto,
        );
    }

    @Get('posts/:id/comments')
    async findByPost(
        @Param('id') postId: string,
        @Query() query: CommentsQueryDto,
    ) {
        return this.commentsService.findByPost(
            postId,
            query,
        );
    }

    @Get('comments/:id/replies')
    async findReplies(
        @Param('id') commentId: string,
        @Query() query: CommentsQueryDto,
    ) {
        return this.commentsService.findReplies(
            commentId,
            query,
        );
    }

    @Post('comments/:id/replies')
    async reply(
        @Request() request: { user: { userId: string } },
        @Param('id') commentId: string,
        @Body() dto: CreateCommentDto,
    ) {
        return this.commentsService.reply(
            request.user.userId,
            commentId,
            dto,
        );
    }

    @Delete('comments/:id')
    async remove(
        @Request() request: { user: { userId: string } },
        @Param('id') commentId: string,
    ) {
        return this.commentsService.remove(
            request.user.userId,
            commentId,
        );
    }
}