import { Module } from '@nestjs/common';

import { StorageModule } from '../storage/storage.module';
import { ReelsController } from './reels.controller';
import { ReelsService } from './reels.service';

@Module({
    controllers: [ReelsController],
    providers: [ReelsService],
    imports: [StorageModule],
})
export class ReelsModule { }
