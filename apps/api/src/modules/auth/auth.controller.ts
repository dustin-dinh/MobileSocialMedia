import {
    Body,
    Controller,
    Get,
    HttpCode,
    HttpStatus,
    Post,
    UseGuards,
} from "@nestjs/common";

import { JwtAuthGuard } from "./guards/jwt-auth.guard";

import { AuthService } from './auth.service';
import { RegisterDto } from './dto/register.dto';
import { LoginDto } from './dto/login.dto';

@Controller('auth')
export class AuthController {
    constructor(
        private readonly authService: AuthService,
    ) { }

    @Post('register')
    register(@Body() dto: RegisterDto) {
        return this.authService.register(dto);
    }

    @Post('login')
    login(@Body() dto: LoginDto) {
        return this.authService.login(dto);
    }
    @UseGuards(JwtAuthGuard)
    @Post("logout")
    @HttpCode(HttpStatus.NO_CONTENT)
    logout(): void {
        return;
    }
}