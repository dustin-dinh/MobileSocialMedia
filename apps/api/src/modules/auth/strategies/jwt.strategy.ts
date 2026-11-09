import { Injectable, UnauthorizedException } from "@nestjs/common";
import { ConfigService } from "@nestjs/config";
import { PassportStrategy } from "@nestjs/passport";
import {
    ExtractJwt,
    Strategy,
} from "passport-jwt";

import { ageLockedUserIds, bannedUserIds } from "../ban-list";
import { AGE_RESTRICTED_ERROR } from "../../moderation/age";
import { PrismaService } from "../../../prisma/prisma.service";
import { assertSessionValid } from "../session";
import { JwtPayload } from "../types/jwt-payload.type";

@Injectable()
export class JwtStrategy extends PassportStrategy(
    Strategy,
) {
    constructor(
        configService: ConfigService,
        private readonly prisma: PrismaService,
    ) {
        super({
            jwtFromRequest:
                ExtractJwt.fromAuthHeaderAsBearerToken(),

            ignoreExpiration: false,

            secretOrKey:
                configService.getOrThrow<string>(
                    "JWT_SECRET",
                ),
        });
    }

    async validate(payload: JwtPayload) {
        // Tài khoản bị khóa: mọi token đang có đều bị từ chối.
        if (bannedUserIds.has(payload.sub)) {
            throw new UnauthorizedException({
                statusCode: 401,
                code: "ACCOUNT_BANNED",
                message: "Tài khoản này đã bị khóa.",
            });
        }

        if (ageLockedUserIds.has(payload.sub)) {
            throw new UnauthorizedException(AGE_RESTRICTED_ERROR);
        }

        await assertSessionValid(this.prisma, payload);

        return {
            userId: payload.sub,
        };
    }
}