import { Injectable, UnauthorizedException } from "@nestjs/common";
import { ConfigService } from "@nestjs/config";
import { PassportStrategy } from "@nestjs/passport";
import {
    ExtractJwt,
    Strategy,
} from "passport-jwt";

import { ageLockedUserIds, bannedUserIds } from "../ban-list";
import { AGE_RESTRICTED_ERROR } from "../../moderation/age";
import { JwtPayload } from "../types/jwt-payload.type";

@Injectable()
export class JwtStrategy extends PassportStrategy(
    Strategy,
) {
    constructor(
        configService: ConfigService,
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

    validate(payload: JwtPayload) {
        // Tài khoản bị khóa: mọi token đang có đều bị từ chối.
        if (bannedUserIds.has(payload.sub)) {
            throw new UnauthorizedException({
                statusCode: 401,
                code: "ACCOUNT_BANNED",
                message: "This account has been suspended",
            });
        }

        if (ageLockedUserIds.has(payload.sub)) {
            throw new UnauthorizedException(AGE_RESTRICTED_ERROR);
        }

        return {
            userId: payload.sub,
        };
    }
}