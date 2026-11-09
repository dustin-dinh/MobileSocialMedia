import { Module } from "@nestjs/common";
import { ConfigService } from "@nestjs/config";
import { JwtModule } from "@nestjs/jwt";
import { PassportModule } from "@nestjs/passport";

import { UsersModule } from "../users/users.module";
import { AuthController } from "./auth.controller";
import { AuthService } from "./auth.service";
import { GoogleVerifierService } from "./google-verifier.service";
import { JwtStrategy } from "./strategies/jwt.strategy";
import { MailModule } from "../mail/mail.module";

@Module({
  imports: [
    UsersModule,
    MailModule,
    PassportModule,

    JwtModule.registerAsync({
      inject: [ConfigService],

      useFactory: (
        configService: ConfigService,
      ) => ({
        secret:
          configService.getOrThrow<string>(
            "JWT_SECRET",
          ),

        signOptions: {
          // shortcut: chưa có refresh token nên token sống 30 ngày để người dùng không bị đăng xuất
          // mỗi ngày; thu hồi phiên đã có qua tokenVersion (session.ts) nhưng chỉ theo cả tài khoản,
          // làm refresh token xoay vòng khi cần token ngắn hạn hoặc đăng xuất riêng từng thiết bị.
          expiresIn: "30d",
        },
      }),
    }),
  ],

  controllers: [AuthController],

  providers: [
    AuthService,
    GoogleVerifierService,
    JwtStrategy,
  ],

  exports: [
    JwtModule,
  ],
})
export class AuthModule { }