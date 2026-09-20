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

@Injectable()
export class AuthService {
    constructor(
        private readonly usersService: UsersService,
        private readonly jwtService: JwtService,
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

        if (!user) {
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
}