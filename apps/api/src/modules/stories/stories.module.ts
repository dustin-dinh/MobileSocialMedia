import { Module } from '@nestjs/common';

import { MessagesModule } from '../messages/messages.module';
import { NotificationsModule } from '../notifications/notifications.module';
import { StorageModule } from '../storage/storage.module';
import { StoriesController } from './stories.controller';
import { StoriesService } from './stories.service';

@Module({
    controllers: [StoriesController],
    providers: [StoriesService],
    imports: [StorageModule, MessagesModule, NotificationsModule],
})
export class StoriesModule { }
