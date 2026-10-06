import {
    ConflictException,
    Injectable,
    UnauthorizedException,
} from "@nestjs/common";
import { JwtService } from "@nestjs/jwt";
import * as bcrypt from "bcrypt";

import { UsersService } from "../users/users.service";
import { LoginDto } from "./dto/login.dto";
import { RegisterDto } from "./dto/register.dto";
import { GoogleLoginDto } from "./dto/google-login.dto";
import { GoogleVerifierService } from "./google-verifier.service";

@Injectable()
export class AuthService {
    constructor(
        private readonly usersService: UsersService,
        private readonly jwtService: JwtService,
        private readonly googleVerifier: GoogleVerifierService,
    ) { }

    async register(dto: RegisterDto) {
        const email = dto.email
            .trim()
            .toLowerCase();

        const username = dto.username.trim();

        const existingEmail =
            await this.usersService.findByEmail(email);

        if (existingEmail) {
            throw new ConflictException(
                "Email already exists",
            );
        }

        const existingUsername =
            await this.usersService.findByUsername(
                username,
            );

        if (existingUsername) {
            throw new ConflictException(
                "Username already exists",
            );
        }

        const passwordHash = await bcrypt.hash(
            dto.password,
            10,
        );

        const user = await this.usersService.create({
            username,
            email,
            passwordHash,
        });

        return {
            data: {
                id: user.id,
                username: user.username,
                email: user.email,
                displayName: user.displayName,
                bio: user.bio,
                avatarUrl: user.avatarUrl,
                createdAt: user.createdAt,
            },
        };
    }

    async login(dto: LoginDto) {
        const email = dto.email
            .trim()
            .toLowerCase();

        const user =
            await this.usersService.findByEmail(email);

        if (!user || !user.passwordHash) {
            throw new UnauthorizedException(
                "Invalid email or password",
            );
        }

        const passwordMatches =
            await bcrypt.compare(
                dto.password,
                user.passwordHash,
            );

        if (!passwordMatches) {
            throw new UnauthorizedException(
                "Invalid email or password",
            );
        }

        const accessToken =
            await this.jwtService.signAsync({
                sub: user.id,
            });

        return {
            data: {
                accessToken,

                user: {
                    id: user.id,
                    username: user.username,
                    email: user.email,
                    displayName: user.displayName,
                    bio: user.bio,
                    avatarUrl: user.avatarUrl,
                },
            },
        };
    }

    async loginWithGoogle(dto: GoogleLoginDto) {
        const payload = await this.googleVerifier.verify(dto.idToken);

        if (!payload.email || payload.emailVerified !== true) {
            throw new UnauthorizedException("Invalid Google token");
        }

        const normalizedEmail = payload.email.trim().toLowerCase();

        // 2. findByGoogleId(sub)
        let user = await this.usersService.findByGoogleId(payload.sub);

        if (!user) {
            // 3. findByEmail(email) -> linkGoogle (D2)
            const existingUserByEmail = await this.usersService.findByEmail(normalizedEmail);
            if (existingUserByEmail) {
                user = await this.usersService.linkGoogle(existingUserByEmail.id, payload.sub);
            } else {
                // 4. Create new user (D3, D4)
                let baseUsername = normalizedEmail
                    .split("@")[0]
                    .replace(/[^a-zA-Z0-9._]/g, "")
                    .slice(0, 24);

                if (baseUsername.length < 3) {
                    baseUsername = `user_${baseUsername}`.slice(0, 24);
                    if (baseUsername.length < 3) {
                        baseUsername = "user";
                    }
                }

                let createdUser = null;
                let candidateUsername = baseUsername;

                for (let attempt = 0; attempt < 5; attempt++) {
                    if (attempt > 0) {
                        const randomSuffix = Math.floor(1000 + Math.random() * 9000).toString();
                        candidateUsername = `${baseUsername.slice(0, 25)}_${randomSuffix}`.slice(0, 30);
                    }

                    try {
                        createdUser = await this.usersService.create({
                            username: candidateUsername,
                            email: normalizedEmail,
                            passwordHash: null,
                            googleId: payload.sub,
                            displayName: payload.name ?? null,
                            avatarUrl: payload.picture ?? null,
                        });
                        break;
                    } catch (error: any) {
                        if (error?.code === "P2002" && attempt < 4) {
                            continue;
                        }
                        throw error;
                    }
                }

                if (!createdUser) {
                    throw new ConflictException("Could not generate a unique username");
                }
                user = createdUser;
            }
        }

        const accessToken = await this.jwtService.signAsync({
            sub: user.id,
        });

        return {
            data: {
                accessToken,

                user: {
                    id: user.id,
                    username: user.username,
                    email: user.email,
                    displayName: user.displayName,
                    bio: user.bio,
                    avatarUrl: user.avatarUrl,
                },
            },
        };
    }
}