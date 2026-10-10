import { Module } from "@nestjs/common";
import { ConfigModule } from "@nestjs/config";

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
  ],
})
export class AppModule { }
