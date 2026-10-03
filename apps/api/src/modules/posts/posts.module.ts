import { Module } from '@nestjs/common';
import { PostsController } from './posts.controller';
import { PostsService } from './posts.service';
import { StorageModule } from '../storage/storage.module';
@Module({
    controllers: [PostsController],
    providers: [PostsService],
    imports: [StorageModule],
})
export class PostsModule { }