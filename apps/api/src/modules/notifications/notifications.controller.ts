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
import { NotificationsService } from './notifications.service';
import { NotificationsQueryDto } from './dto/notifications-query.dto';
import { RegisterDeviceDto } from './dto/register-device.dto';

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

    @Post('devices')
    async registerDevice(
        @Request() request: { user: { userId: string } },
        @Body() dto: RegisterDeviceDto,
    ) {
        return this.notificationsService.registerDevice(
            request.user.userId,
            dto.token,
            dto.platform,
        );
    }

    // Token Expo có dấu [] nên truyền qua query thay vì path.
    @Delete('devices')
    async unregisterDevice(
        @Request() request: { user: { userId: string } },
        @Query('token') token?: string,
    ) {
        return this.notificationsService.unregisterDevice(
            request.user.userId,
            token ?? '',
        );
    }
}
