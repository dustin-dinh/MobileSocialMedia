import { Module } from '@nestjs/common';
import { PostsController } from './posts.controller';
import { MutesController } from './mutes.controller';
import { PostsService } from './posts.service';
import { StorageModule } from '../storage/storage.module';
import { NotificationsModule } from '../notifications/notifications.module';
@Module({
    controllers: [PostsController, MutesController],
    providers: [PostsService],
    imports: [StorageModule, NotificationsModule],
})
export class PostsModule { }
