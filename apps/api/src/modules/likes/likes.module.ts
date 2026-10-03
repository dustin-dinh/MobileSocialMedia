import { Module } from '@nestjs/common';
import { LikesController } from './likes.controller';
import { LikesService } from './likes.service';
import { NotificationsModule } from '../notifications/notifications.module';

@Module({
  controllers: [LikesController],
  providers: [LikesService],
  imports: [NotificationsModule],
})
export class LikesModule { }
