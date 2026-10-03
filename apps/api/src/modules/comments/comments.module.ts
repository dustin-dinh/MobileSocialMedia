import { Module } from '@nestjs/common';
import { CommentsController } from './comments.controller';
import { CommentsService } from './comments.service';
import { NotificationsModule } from '../notifications/notifications.module';

@Module({
    controllers: [CommentsController],
    providers: [CommentsService],
    imports: [NotificationsModule],
})
export class CommentsModule { }
