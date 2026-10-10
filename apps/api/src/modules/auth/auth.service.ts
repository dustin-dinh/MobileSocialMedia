import {
    ConflictException,
    Injectable,
    UnauthorizedException,
    InternalServerErrorException,
    HttpException,
    HttpStatus,
} from "@nestjs/common";
import { JwtService } from "@nestjs/jwt";
import * as bcrypt from "bcrypt";

import { UsersService } from "../users/users.service";
import { LoginDto } from "./dto/login.dto";
import { RegisterDto } from "./dto/register.dto";
import { GoogleLoginDto } from "./dto/google-login.dto";
import { GoogleVerifierService } from "./google-verifier.service";

import { createHmac, randomInt, timingSafeEqual } from "node:crypto";
import { PrismaService } from "../../prisma/prisma.service";
import { MailService } from "../mail/mail.service";
import { VerifyEmailDto } from "./dto/verify-email.dto";
import { ResendVerificationDto } from "./dto/resend-verification.dto";

import { ForgotPasswordDto } from "./dto/forgot-password.dto";
import { ResetPasswordDto } from "./dto/reset-password.dto";

@Injectable()
export class AuthService {

    private readonly otpTtlMs = 5 * 60 * 1000;
    private readonly maxOtpAttempts = 5;
    private readonly maxResendsPerHour = 3;

    private normalizeEmail(email: string): string {
        return email.trim().toLowerCase();
    }

    private hashOtp(userId: string, otp: string): string {
        const secret = process.env.OTP_HASH_SECRET;
        if (!secret) {
            throw new InternalServerErrorException(
                "OTP service is not configured",
            );
        }

        return createHmac("sha256", secret)
            .update(`${userId}:${otp}`)
            .digest("hex");
    }

    private generateOtp(): string {
        return randomInt(0, 1_000_000).toString().padStart(6, "0");
    }

    private tooManyRequests(message: string): HttpException {
        return new HttpException(message, HttpStatus.TOO_MANY_REQUESTS);
    }

    private async issueVerificationOtp(userId: string, email: string) {
        const now = new Date();
        const oneHourAgo = new Date(now.getTime() - 60 * 60 * 1000);

        const recentSends = await this.prisma.authToken.count({
            where: {
                userId,
                purpose: "EMAIL_VERIFICATION",
                createdAt: { gte: oneHourAgo },
            },
        });

        if (recentSends >= this.maxResendsPerHour) {
            throw this.tooManyRequests(
                "Too many verification emails. Try again later.",
            );
        }

        const otp = this.generateOtp();
        const tokenHash = this.hashOtp(userId, otp);

        await this.prisma.$transaction(async (tx) => {
            await tx.authToken.updateMany({
                where: {
                    userId,
                    purpose: "EMAIL_VERIFICATION",
                    usedAt: null,
                },
                data: { usedAt: now },
            });

            await tx.authToken.create({
                data: {
                    userId,
                    tokenHash,
                    purpose: "EMAIL_VERIFICATION",
                    expiresAt: new Date(now.getTime() + this.otpTtlMs),
                },
            });
        });

        await this.mailService.sendVerificationOtp(email, otp);
    }

    async verifyEmail(dto: VerifyEmailDto) {
        const email = this.normalizeEmail(dto.email);
        const user = await this.usersService.findByEmail(email);

        // Tránh tiết lộ email có đăng ký hay không.
        if (!user) {
            throw new UnauthorizedException("Invalid or expired OTP");
        }

        if (user.emailVerifiedAt) {
            return { message: "Email already verified" };
        }

        const now = new Date();
        const token = await this.prisma.authToken.findFirst({
            where: {
                userId: user.id,
                purpose: "EMAIL_VERIFICATION",
                usedAt: null,
                expiresAt: { gt: now },
            },
            orderBy: { createdAt: "desc" },
        });

        if (!token || token.attemptCount >= this.maxOtpAttempts) {
            throw new UnauthorizedException("Invalid or expired OTP");
        }

        const expectedHash = Buffer.from(token.tokenHash, "hex");
        const submittedHash = Buffer.from(
            this.hashOtp(user.id, dto.otp),
            "hex",
        );

        const matches =
            expectedHash.length === submittedHash.length &&
            timingSafeEqual(expectedHash, submittedHash);

        if (!matches) {
            await this.prisma.authToken.updateMany({
                where: {
                    id: token.id,
                    usedAt: null,
                    attemptCount: { lt: this.maxOtpAttempts },
                },
                data: { attemptCount: { increment: 1 } },
            });

            throw new UnauthorizedException("Invalid or expired OTP");
        }

        await this.prisma.$transaction(async (tx) => {
            const consumed = await tx.authToken.updateMany({
                where: {
                    id: token.id,
                    tokenHash: token.tokenHash,
                    usedAt: null,
                    expiresAt: { gt: new Date() },
                    attemptCount: { lt: this.maxOtpAttempts },
                },
                data: { usedAt: new Date() },
            });

            if (consumed.count !== 1) {
                throw new UnauthorizedException("Invalid or expired OTP");
            }

            await tx.user.update({
                where: { id: user.id },
                data: { emailVerifiedAt: new Date() },
            });
        });

        return { message: "Email verified successfully" };
    }

    async resendVerification(dto: ResendVerificationDto) {
        const email = this.normalizeEmail(dto.email);
        const user = await this.usersService.findByEmail(email);

        // Trả cùng một thông báo dù email không tồn tại, đã xác minh,
        // hay đã gửi lại mã để tránh tiết lộ trạng thái tài khoản.
        const genericResponse = {
            message: "If the account needs verification, a code will be sent.",
        };

        if (!user || user.emailVerifiedAt || !user.passwordHash) {
            return genericResponse;
        }

        try {
            await this.issueVerificationOtp(user.id, user.email);
        } catch (error) {
            if (error instanceof HttpException) {
                throw error;
            }

            // Không tiết lộ thông tin SMTP hoặc chi tiết nội bộ cho client.
            throw new InternalServerErrorException(
                "Unable to send verification email",
            );
        }

        return genericResponse;
    }
    constructor(
        private readonly usersService: UsersService,
        private readonly jwtService: JwtService,
        private readonly googleVerifier: GoogleVerifierService,
        private readonly prisma: PrismaService,
        private readonly mailService: MailService,

    ) { }


    async register(dto: RegisterDto) {
        const email = this.normalizeEmail(dto.email);
        const username = dto.username.trim();

        if (await this.usersService.findByEmail(email)) {
            throw new ConflictException("Email already exists");
        }

        if (await this.usersService.findByUsername(username)) {
            throw new ConflictException("Username already exists");
        }

        const passwordHash = await bcrypt.hash(dto.password, 10);

        const user = await this.usersService.create({
            username,
            email,
            passwordHash,
        });

        try {
            await this.issueVerificationOtp(user.id, user.email);
        } catch {
            // Tài khoản đã tạo; không xóa tài khoản chỉ vì SMTP lỗi.
            // Client có thể dùng endpoint resend-verification để thử lại.
            return {
                data: {
                    id: user.id,
                    username: user.username,
                    email: user.email,
                    displayName: user.displayName,
                    bio: user.bio,
                    avatarUrl: user.avatarUrl,
                    createdAt: user.createdAt,
                    emailVerified: false,
                    verificationEmailSent: false,
                },
                message:
                    "Account created, but the verification email could not be sent. Request a new code.",
            };
        }

        return {
            data: {
                id: user.id,
                username: user.username,
                email: user.email,
                displayName: user.displayName,
                bio: user.bio,
                avatarUrl: user.avatarUrl,
                createdAt: user.createdAt,
                emailVerified: false,
                verificationEmailSent: true,
            },
            message: "Account created. Check your email for the verification code.",
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

        if (!user.emailVerifiedAt) {
            throw new UnauthorizedException("Please verify your email before logging in");
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
    ///////////////Reset Password

    private hashPasswordResetOtp(userId: string, otp: string): string {
        const secret = process.env.OTP_HASH_SECRET;

        if (!secret) {
            throw new InternalServerErrorException(
                "OTP service is not configured",
            );
        }

        return createHmac("sha256", secret)
            .update(`PASSWORD_RESET:${userId}:${otp}`)
            .digest("hex");
    }

    async forgotPassword(dto: ForgotPasswordDto) {
        const email = this.normalizeEmail(dto.email);
        const genericResponse = {
            message: "If the account is eligible, a reset code will be sent.",
        };

        const user = await this.usersService.findByEmail(email);

        // Không gửi reset OTP cho tài khoản Google-only hoặc email chưa xác minh.
        if (!user || !user.passwordHash || !user.emailVerifiedAt) {
            return genericResponse;
        }

        const now = new Date();
        const oneHourAgo = new Date(now.getTime() - 60 * 60 * 1000);

        const recentTokens = await this.prisma.authToken.count({
            where: {
                userId: user.id,
                purpose: "PASSWORD_RESET",
                createdAt: { gte: oneHourAgo },
            },
        });

        if (recentTokens >= this.maxResendsPerHour) {
            // Giữ phản hồi chung để không làm lộ trạng thái tài khoản.
            return genericResponse;
        }

        const otp = this.generateOtp();
        const tokenHash = this.hashPasswordResetOtp(user.id, otp);

        await this.prisma.$transaction(async (tx) => {
            await tx.authToken.updateMany({
                where: {
                    userId: user.id,
                    purpose: "PASSWORD_RESET",
                    usedAt: null,
                },
                data: { usedAt: now },
            });

            await tx.authToken.create({
                data: {
                    userId: user.id,
                    tokenHash,
                    purpose: "PASSWORD_RESET",
                    expiresAt: new Date(now.getTime() + this.otpTtlMs),
                },
            });
        });

        try {
            await this.mailService.sendPasswordResetOtp(user.email, otp);
        } catch {
            // Không tiết lộ lỗi SMTP cho client.
            // Token chưa gửi được vẫn hết hạn sau 5 phút.
            return genericResponse;
        }

        return genericResponse;
    }

    async resetPassword(dto: ResetPasswordDto) {
        const email = this.normalizeEmail(dto.email);
        const user = await this.usersService.findByEmail(email);

        if (!user || !user.passwordHash || !user.emailVerifiedAt) {
            throw new UnauthorizedException("Invalid or expired reset code");
        }

        const now = new Date();
        const token = await this.prisma.authToken.findFirst({
            where: {
                userId: user.id,
                purpose: "PASSWORD_RESET",
                usedAt: null,
                expiresAt: { gt: now },
            },
            orderBy: { createdAt: "desc" },
        });

        if (!token || token.attemptCount >= this.maxOtpAttempts) {
            throw new UnauthorizedException("Invalid or expired reset code");
        }

        const expectedHash = Buffer.from(token.tokenHash, "hex");
        const submittedHash = Buffer.from(
            this.hashPasswordResetOtp(user.id, dto.otp),
            "hex",
        );

        const matches =
            expectedHash.length === submittedHash.length &&
            timingSafeEqual(expectedHash, submittedHash);

        if (!matches) {
            await this.prisma.authToken.updateMany({
                where: {
                    id: token.id,
                    usedAt: null,
                    attemptCount: { lt: this.maxOtpAttempts },
                },
                data: { attemptCount: { increment: 1 } },
            });

            throw new UnauthorizedException("Invalid or expired reset code");
        }

        const newPasswordHash = await bcrypt.hash(dto.newPassword, 10);

        await this.prisma.$transaction(async (tx) => {
            const consumed = await tx.authToken.updateMany({
                where: {
                    id: token.id,
                    purpose: "PASSWORD_RESET",
                    tokenHash: token.tokenHash,
                    usedAt: null,
                    expiresAt: { gt: new Date() },
                    attemptCount: { lt: this.maxOtpAttempts },
                },
                data: { usedAt: new Date() },
            });

            if (consumed.count !== 1) {
                throw new UnauthorizedException("Invalid or expired reset code");
            }

            await tx.user.update({
                where: { id: user.id },
                data: { passwordHash: newPasswordHash },
            });

            // Vô hiệu hóa những reset token khác còn hiệu lực.
            await tx.authToken.updateMany({
                where: {
                    userId: user.id,
                    purpose: "PASSWORD_RESET",
                    usedAt: null,
                },
                data: { usedAt: new Date() },
            });
        });

        return { message: "Password reset successfully" };
    }

}