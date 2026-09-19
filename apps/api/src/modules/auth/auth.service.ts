import {
    ConflictException,
    Injectable,
} from '@nestjs/common';
import * as bcrypt from 'bcrypt';

import { UsersService } from '../users/users.service';
import { RegisterDto } from './dto/register.dto';

@Injectable()
export class AuthService {
    constructor(
        private readonly usersService: UsersService,
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
                'Email already exists',
            );
        }

        const existingUsername =
            await this.usersService.findByUsername(username);

        if (existingUsername) {
            throw new ConflictException(
                'Username already exists',
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
}