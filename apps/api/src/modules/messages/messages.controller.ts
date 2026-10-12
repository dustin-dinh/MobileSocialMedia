import {
    Body,
    Controller,
    Get,
    Param,
    Post,
    Query,
    Request,
    UploadedFile,
    UseGuards,
    UseInterceptors,
} from '@nestjs/common';
import { FileInterceptor } from '@nestjs/platform-express';
import { Type } from 'class-transformer';
import {
    IsInt,
    IsISO8601,
    IsOptional,
    IsString,
    Max,
    MaxLength,
    Min,
} from 'class-validator';

import { JwtAuthGuard } from '../auth/guards/jwt-auth.guard';
import { MessagesService } from './messages.service';

class OpenConversationDto {
    @IsString()
    @MaxLength(100)
    userId!: string;
}

class SendMessageDto {
    @IsOptional()
    @IsString()
    @MaxLength(2000)
    content?: string;

    // Do thiết bị sinh ra; gửi lại cùng clientId không tạo tin trùng.
    @IsOptional()
    @IsString()
    @MaxLength(100)
    clientId?: string;
}

class MessagesQueryDto {
    @IsOptional()
    @IsISO8601()
    before?: string;

    @IsOptional()
    @Type(() => Number)
    @IsInt()
    @Min(1)
    @Max(50)
    limit = 30;
}

type AuthedRequest = { user: { userId: string } };

@Controller('conversations')
@UseGuards(JwtAuthGuard)
export class MessagesController {
    constructor(private readonly messagesService: MessagesService) { }

    @Get()
    list(@Request() request: AuthedRequest) {
        return this.messagesService.list(request.user.userId);
    }

    @Post()
    open(@Request() request: AuthedRequest, @Body() dto: OpenConversationDto) {
        return this.messagesService.open(request.user.userId, dto.userId);
    }

    // Route tĩnh phải đứng trước `:id`.
    @Get('unread-count')
    unreadCount(@Request() request: AuthedRequest) {
        return this.messagesService.unreadCount(request.user.userId);
    }

    @Get(':id/messages')
    findMessages(
        @Request() request: AuthedRequest,
        @Param('id') id: string,
        @Query() query: MessagesQueryDto,
    ) {
        return this.messagesService.findMessages(
            request.user.userId,
            id,
            query.before,
            query.limit,
        );
    }

    // JSON cho tin chữ, multipart (trường `image`) khi kèm ảnh.
    @Post(':id/messages')
    @UseInterceptors(FileInterceptor('image'))
    send(
        @Request() request: AuthedRequest,
        @Param('id') id: string,
        @Body() dto: SendMessageDto,
        @UploadedFile() image?: Express.Multer.File,
    ) {
        return this.messagesService.send(request.user.userId, id, dto, image);
    }

    @Post(':id/read')
    markRead(@Request() request: AuthedRequest, @Param('id') id: string) {
        return this.messagesService.markRead(request.user.userId, id);
    }
}
