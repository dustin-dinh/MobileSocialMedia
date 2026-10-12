import {
    Body,
    Controller,
    Get,
    HttpCode,
    HttpStatus,
    Patch,
    Post,
    Request,
    UseGuards,
} from "@nestjs/common";

import { Throttle } from "@nestjs/throttler";

import { JwtAuthGuard } from "./guards/jwt-auth.guard";

import { AuthService } from './auth.service';
import { RegisterDto } from './dto/register.dto';
import { LoginDto } from './dto/login.dto';
import { GoogleLoginDto } from './dto/google-login.dto';
import { VerifyEmailDto } from "./dto/verify-email.dto";
import { ResendVerificationDto } from "./dto/resend-verification.dto";
import { ForgotPasswordDto } from "./dto/forgot-password.dto";
import { ResetPasswordDto } from "./dto/reset-password.dto";
import { ChangePasswordDto } from "./dto/change-password.dto";
import { AuthenticatedRequest } from "./types/authenticated-request.type";
@Controller('auth')
export class AuthController {
    constructor(
        private readonly authService: AuthService,
    ) { }

    @Throttle({ default: { limit: 10, ttl: 60 * 60_000 } })
    @Post('register')
    register(@Body() dto: RegisterDto) {
        return this.authService.register(dto);
    }

    @Throttle({ default: { limit: 10, ttl: 60_000 } })
    @Post('login')
    login(@Body() dto: LoginDto) {
        return this.authService.login(dto);
    }

    @Post('google')
    @HttpCode(HttpStatus.OK)
    loginWithGoogle(@Body() dto: GoogleLoginDto) {
        return this.authService.loginWithGoogle(dto);
    }
    @UseGuards(JwtAuthGuard)
    @Post("logout")
    @HttpCode(HttpStatus.NO_CONTENT)
    logout(): void {
        return;
    }
    @Throttle({ default: { limit: 10, ttl: 60_000 } })
    @Post("verify-email")
    @HttpCode(HttpStatus.OK)
    verifyEmail(@Body() dto: VerifyEmailDto) {
        return this.authService.verifyEmail(dto);
    }

    @Throttle({ default: { limit: 10, ttl: 60 * 60_000 } })
    @Post("resend-verification")
    @HttpCode(HttpStatus.OK)
    resendVerification(@Body() dto: ResendVerificationDto) {
        return this.authService.resendVerification(dto);
    }
    @Throttle({ default: { limit: 10, ttl: 60 * 60_000 } })
    @Post("forgot-password")
    @HttpCode(HttpStatus.OK)
    forgotPassword(@Body() dto: ForgotPasswordDto) {
        return this.authService.forgotPassword(dto);
    }

    @Throttle({ default: { limit: 10, ttl: 60_000 } })
    @Post("reset-password")
    @HttpCode(HttpStatus.OK)
    resetPassword(@Body() dto: ResetPasswordDto) {
        return this.authService.resetPassword(dto);
    }

    @UseGuards(JwtAuthGuard)
    @Patch("password")
    changePassword(
        @Request() request: AuthenticatedRequest,
        @Body() dto: ChangePasswordDto,
    ) {
        return this.authService.changePassword(
            request.user.userId,
            dto.currentPassword,
            dto.newPassword,
        );
    }
}
