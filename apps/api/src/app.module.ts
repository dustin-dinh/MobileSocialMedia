import { Module } from "@nestjs/common";
import { ConfigModule } from "@nestjs/config";
import { APP_GUARD, APP_INTERCEPTOR } from "@nestjs/core";
import { ThrottlerGuard, ThrottlerModule } from "@nestjs/throttler";

import { PrismaModule } from "./prisma/prisma.module";
import { UsersModule } from './modules/users/users.module';
import { AuthModule } from './modules/auth/auth.module';
import { PostsModule } from './modules/posts/posts.module';
import { LikesModule } from './modules/likes/likes.module';
import { CommentsModule } from './modules/comments/comments.module';
import { SearchModule } from './modules/search/search.module';
import { NotificationsModule } from './modules/notifications/notifications.module';
import { FollowsModule } from './modules/follows/follows.module';
import { MailModule } from "./modules/mail/mail.module";
import { ReportsModule } from "./modules/reports/reports.module";
import { ReelsModule } from "./modules/reels/reels.module";
import { MediaUrlInterceptor } from "./modules/storage/media-url.interceptor";
@Module({
  imports: [
    ConfigModule.forRoot({
      isGlobal: true,
      envFilePath: ".env",
    }),
    PrismaModule,
    // SearchModule must register before UsersModule: both serve `users/...`,
    // and `GET users/search` would otherwise be captured by `GET users/:id`.
    SearchModule,
    UsersModule,
    PostsModule,
    AuthModule,
    LikesModule,
    CommentsModule,
    NotificationsModule,
    FollowsModule,
    MailModule,
    ReportsModule,
    ReelsModule,
    // Trần chung theo IP; các route nhạy cảm (auth) đặt giới hạn chặt hơn bằng @Throttle.
    ThrottlerModule.forRoot([{ ttl: 60_000, limit: 300 }]),
  ],
  providers: [
    { provide: APP_GUARD, useClass: ThrottlerGuard },
    { provide: APP_INTERCEPTOR, useClass: MediaUrlInterceptor },
  ],
})
export class AppModule { }
