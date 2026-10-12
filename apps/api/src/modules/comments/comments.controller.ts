import {
    Body,
    Controller,
    Delete,
    Get,
    Param,
    Patch,
    Post,
    Query,
    Request,
    UseGuards,
} from '@nestjs/common';

import { JwtAuthGuard } from '../auth/guards/jwt-auth.guard';
import { CommentsService } from './comments.service';
import { CreateCommentDto } from './dto/create-comment.dto';
import { CommentsQueryDto } from './dto/comments-query.dto';
import { UpdateCommentDto } from './dto/update-comment.dto';

type AuthedRequest = { user: { userId: string } };

@Controller()
@UseGuards(JwtAuthGuard)
export class CommentsController {
    constructor(
        private readonly commentsService: CommentsService,
    ) { }

    @Post('posts/:id/comments')
    async create(
        @Request() request: AuthedRequest,
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
        @Request() request: AuthedRequest,
        @Param('id') postId: string,
        @Query() query: CommentsQueryDto,
    ) {
        return this.commentsService.findByPost(
            request.user.userId,
            postId,
            query,
        );
    }

    @Get('comments/:id/replies')
    async findReplies(
        @Request() request: AuthedRequest,
        @Param('id') commentId: string,
        @Query() query: CommentsQueryDto,
    ) {
        return this.commentsService.findReplies(
            request.user.userId,
            commentId,
            query,
        );
    }

    @Post('comments/:id/replies')
    async reply(
        @Request() request: AuthedRequest,
        @Param('id') commentId: string,
        @Body() dto: CreateCommentDto,
    ) {
        return this.commentsService.reply(
            request.user.userId,
            commentId,
            dto,
        );
    }

    @Patch('comments/:id')
    async update(
        @Request() request: AuthedRequest,
        @Param('id') commentId: string,
        @Body() dto: UpdateCommentDto,
    ) {
        return this.commentsService.update(
            request.user.userId,
            commentId,
            dto.content,
        );
    }

    @Delete('comments/:id')
    async remove(
        @Request() request: AuthedRequest,
        @Param('id') commentId: string,
    ) {
        return this.commentsService.remove(
            request.user.userId,
            commentId,
        );
    }

    @Post('comments/:id/like')
    async like(
        @Request() request: AuthedRequest,
        @Param('id') commentId: string,
    ) {
        return this.commentsService.setLike(
            request.user.userId,
            commentId,
            true,
        );
    }

    @Delete('comments/:id/like')
    async unlike(
        @Request() request: AuthedRequest,
        @Param('id') commentId: string,
    ) {
        return this.commentsService.setLike(
            request.user.userId,
            commentId,
            false,
        );
    }
}
