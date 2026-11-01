import { Module } from '@nestjs/common';

import { NotificationsModule } from '../notifications/notifications.module';
import { StorageModule } from '../storage/storage.module';
import { MessagesController } from './messages.controller';
import { MessagesService } from './messages.service';

@Module({
    controllers: [MessagesController],
    providers: [MessagesService],
    exports: [MessagesService],
    imports: [NotificationsModule, StorageModule],
})
export class MessagesModule { }
