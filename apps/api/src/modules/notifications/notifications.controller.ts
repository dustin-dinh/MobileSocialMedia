import {
    Controller,
    Get,
    Param,
    Patch,
    Query,
    Request,
    UseGuards,
} from '@nestjs/common';

import { JwtAuthGuard } from '../auth/guards/jwt-auth.guard';
import { NotificationsService } from './notifications.service';
import { NotificationsQueryDto } from './dto/notifications-query.dto';

@Controller('notifications')
@UseGuards(JwtAuthGuard)
export class NotificationsController {
    constructor(
        private readonly notificationsService: NotificationsService,
    ) { }

    @Get()
    async findMine(
        @Request() request: {
            user: { userId: string };
        },
        @Query() query: NotificationsQueryDto,
    ) {
        return this.notificationsService.findMyNotifications(
            request.user.userId,
            query,
        );
    }

    @Patch('read-all')
    async markAllAsRead(
        @Request() request: {
            user: { userId: string };
        },
    ) {
        return this.notificationsService.markAllAsRead(
            request.user.userId,
        );
    }

    @Patch(':id/read')
    async markAsRead(
        @Request() request: {
            user: { userId: string };
        },
        @Param('id') notificationId: string,
    ) {
        return this.notificationsService.markAsRead(
            request.user.userId,
            notificationId,
        );
    }
}
