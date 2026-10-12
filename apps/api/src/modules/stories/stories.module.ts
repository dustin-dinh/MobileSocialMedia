import { Module } from '@nestjs/common';

import { StorageModule } from '../storage/storage.module';
import { StoriesController } from './stories.controller';
import { StoriesService } from './stories.service';

@Module({
    controllers: [StoriesController],
    providers: [StoriesService],
    imports: [StorageModule],
})
export class StoriesModule { }
