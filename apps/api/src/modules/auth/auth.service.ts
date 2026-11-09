import {
    BadRequestException,
    ConflictException,
    ForbiddenException,
    Injectable,
    UnauthorizedException,
    InternalServerErrorException,
    HttpException,
    HttpStatus,
} from "@nestjs/common";
import { JwtService } from "@nestjs/jwt";
import * as bcrypt from "bcrypt";

import { toMe, UsersService } from "../users/users.service";
import { AGE_RESTRICTED_ERROR, ageOn, MINIMUM_AGE, parseBirthDate } from "../moderation/age";
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
import { SESSION_REVOKED_ERROR } from "./session";

type SessionUser = NonNullable<Awaited<ReturnType<UsersService["findById"]>>>;

// Email không tồn tại vẫn chạy bcrypt.compare với hash giả để thời gian trả lời không lộ email nào đã đăng ký.
const DUMMY_PASSWORD_HASH = bcrypt.hashSync("timing-equaliser-not-a-password", 10);
const MAX_FAILED_LOGINS = 5;
const LOGIN_LOCK_MS = 15 * 60 * 1000;
const INVALID_CREDENTIALS = "Email hoặc mật khẩu không đúng.";
const INVALID_LOGIN_CODE = "Mã xác minh không đúng hoặc đã hết hạn.";
const ACCOUNT_BANNED_ERROR = {
    statusCode: 401,
    code: "ACCOUNT_BANNED",
    message: "Tài khoản này đã bị khóa.",
};

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
                "Dịch vụ mã xác minh chưa được cấu hình.",
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

    // Mã email xác minh, hoặc mã đăng nhập hai lớp (LOGIN_TWO_FACTOR). Mã hai lớp được 5 lần/giờ
    // thay vì 3 vì mỗi lần đăng nhập cũng gửi một mã.
    private async issueVerificationOtp(
        userId: string,
        email: string,
        purpose: "EMAIL_VERIFICATION" | "LOGIN_TWO_FACTOR" = "EMAIL_VERIFICATION",
    ) {
        const now = new Date();
        const oneHourAgo = new Date(now.getTime() - 60 * 60 * 1000);

        const recentSends = await this.prisma.authToken.count({
            where: {
                userId,
                purpose,
                createdAt: { gte: oneHourAgo },
            },
        });

        if (recentSends >= (purpose === "LOGIN_TWO_FACTOR" ? 5 : this.maxResendsPerHour)) {
            throw this.tooManyRequests(
                "Bạn đã yêu cầu quá nhiều mã. Vui lòng thử lại sau.",
            );
        }

        const otp = this.generateOtp();
        const tokenHash = purpose === "LOGIN_TWO_FACTOR"
            ? this.hashOtp(`LOGIN_TWO_FACTOR:${userId}`, otp)
            : this.hashOtp(userId, otp);

        await this.prisma.$transaction(async (tx) => {
            await tx.authToken.updateMany({
                where: {
                    userId,
                    purpose,
                    usedAt: null,
                },
                data: { usedAt: now },
            });

            await tx.authToken.create({
                data: {
                    userId,
                    tokenHash,
                    purpose,
                    expiresAt: new Date(now.getTime() + this.otpTtlMs),
                },
            });
        });

        if (purpose === "LOGIN_TWO_FACTOR") {
            await this.mailService.sendLoginCode(email, otp);
        } else {
            await this.mailService.sendVerificationOtp(email, otp);
        }
    }

    async verifyEmail(dto: VerifyEmailDto) {
        const email = this.normalizeEmail(dto.email);
        const user = await this.usersService.findByEmail(email);

        // Tránh tiết lộ email có đăng ký hay không.
        if (!user) {
            throw new UnauthorizedException("Mã xác minh không đúng hoặc đã hết hạn.");
        }

        if (user.emailVerifiedAt) {
            return { message: "Email đã được xác minh." };
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
            throw new UnauthorizedException("Mã xác minh không đúng hoặc đã hết hạn.");
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

            throw new UnauthorizedException("Mã xác minh không đúng hoặc đã hết hạn.");
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
                throw new UnauthorizedException("Mã xác minh không đúng hoặc đã hết hạn.");
            }

            await tx.user.update({
                where: { id: user.id },
                data: { emailVerifiedAt: new Date() },
            });
        });

        return { message: "Đã xác minh email." };
    }

    async resendVerification(dto: ResendVerificationDto) {
        const email = this.normalizeEmail(dto.email);
        const user = await this.usersService.findByEmail(email);

        // Trả cùng một thông báo dù email không tồn tại, đã xác minh,
        // hay đã gửi lại mã để tránh tiết lộ trạng thái tài khoản.
        const genericResponse = {
            message: "Nếu tài khoản cần xác minh, mã mới sẽ được gửi tới email.",
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
                "Không gửi được email xác minh. Vui lòng thử lại sau.",
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
        const birthDate = parseBirthDate(dto.birthDate);

        // Dưới 18 tuổi: không tạo tài khoản.
        if (ageOn(birthDate) < MINIMUM_AGE) {
            throw new ForbiddenException(AGE_RESTRICTED_ERROR);
        }

        if (await this.usersService.findByEmail(email)) {
            throw new ConflictException("Email này đã được dùng cho một tài khoản khác.");
        }

        if (await this.usersService.findByUsername(username)) {
            throw new ConflictException("Tên người dùng này đã có người dùng.");
        }

        const passwordHash = await bcrypt.hash(dto.password, 10);

        const user = await this.usersService.create({
            username,
            email,
            passwordHash,
            birthDate,
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
                    "Đã tạo tài khoản nhưng chưa gửi được email xác minh. Hãy yêu cầu mã mới.",
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
            message: "Đã tạo tài khoản. Kiểm tra email để lấy mã xác minh.",
        };
    }


    async login(dto: LoginDto) {
        const email = dto.email
            .trim()
            .toLowerCase();

        const user =
            await this.usersService.findByEmail(email);

        if (user?.loginLockedUntil && user.loginLockedUntil > new Date()) {
            throw this.loginLocked(user.loginLockedUntil);
        }

        const passwordMatches =
            await bcrypt.compare(
                dto.password,
                user?.passwordHash ?? DUMMY_PASSWORD_HASH,
            );

        if (!user || !user.passwordHash || !passwordMatches) {
            if (user?.passwordHash) {
                await this.recordFailedLogin(user.id);
            }

            throw new UnauthorizedException(INVALID_CREDENTIALS);
        }

        if (user.failedLoginCount > 0 || user.loginLockedUntil) {
            await this.prisma.user.update({
                where: { id: user.id },
                data: { failedLoginCount: 0, loginLockedUntil: null },
            });
        }

        if (!user.emailVerifiedAt) {
            // code để client phân biệt với sai mật khẩu mà không phải so chuỗi.
            throw new UnauthorizedException({
                statusCode: 401,
                code: "EMAIL_NOT_VERIFIED",
                message: "Vui lòng xác minh email trước khi đăng nhập.",
            });
        }

        return this.startSession(user);
    }

    // 423, không phải 429: app hiện nguyên câu này, còn 429 bị app thay bằng câu "thao tác quá nhanh".
    private loginLocked(until: Date): HttpException {
        const minutes = Math.max(1, Math.ceil((until.getTime() - Date.now()) / 60_000));

        return new HttpException(
            {
                statusCode: HttpStatus.LOCKED,
                code: "LOGIN_LOCKED",
                message: `Bạn đã nhập sai mật khẩu quá nhiều lần. Vui lòng thử lại sau ${minutes} phút.`,
            },
            HttpStatus.LOCKED,
        );
    }

    // Sai lần thứ 5 liên tiếp: khóa đăng nhập 15 phút và báo ngay ở lần sai này.
    private async recordFailedLogin(userId: string) {
        const { failedLoginCount } = await this.prisma.user.update({
            where: { id: userId },
            data: { failedLoginCount: { increment: 1 } },
            select: { failedLoginCount: true },
        });

        if (failedLoginCount >= MAX_FAILED_LOGINS) {
            const until = new Date(Date.now() + LOGIN_LOCK_MS);

            await this.prisma.user.update({
                where: { id: userId },
                data: { failedLoginCount: 0, loginLockedUntil: until },
            });

            throw this.loginLocked(until);
        }
    }

    private assertCanSignIn(user: SessionUser): void {
        if (user.deletedAt) {
            throw new UnauthorizedException(INVALID_CREDENTIALS);
        }

        if (user.bannedAt) {
            throw new UnauthorizedException(ACCOUNT_BANNED_ERROR);
        }

        if (user.ageLockedAt) {
            throw new UnauthorizedException(AGE_RESTRICTED_ERROR);
        }
    }

    // Mật khẩu hoặc Google đã đúng: cấp phiên, hoặc gửi mã hai lớp và trả challengeToken nếu người dùng đã bật.
    private async startSession(user: SessionUser) {
        this.assertCanSignIn(user);

        if (!user.twoFactorEnabled) {
            return this.issueSession(user);
        }

        await this.sendLoginCode(user);

        return {
            data: {
                twoFactorRequired: true,
                challengeToken: await this.jwtService.signAsync(
                    { sub: user.id, purpose: "LOGIN_TWO_FACTOR" },
                    { secret: this.challengeSecret(), expiresIn: "10m" },
                ),
                // Để màn nhập mã hiện email đã che (đăng nhập Google không gõ email).
                email: user.email,
            },
        };
    }

    private async issueSession(user: SessionUser) {
        const accessToken = await this.jwtService.signAsync({
            sub: user.id,
            ver: user.tokenVersion,
        });

        return {
            data: {
                accessToken,

                user: toMe(user),
            },
        };
    }

    // Khóa ký riêng: challengeToken không bao giờ dùng được như access token (JwtStrategy, socket).
    private challengeSecret(): string {
        return `${process.env.JWT_SECRET}:login-two-factor`;
    }

    private async sendLoginCode(user: SessionUser) {
        try {
            await this.issueVerificationOtp(user.id, user.email, "LOGIN_TWO_FACTOR");
        } catch (error) {
            // Giữ 429 (gửi quá nhiều mã); lỗi SMTP không lộ chi tiết.
            if (error instanceof HttpException && error.getStatus() === HttpStatus.TOO_MANY_REQUESTS) {
                throw error;
            }

            throw new InternalServerErrorException(
                "Không gửi được mã xác minh. Vui lòng thử lại sau.",
            );
        }
    }

    private async readChallenge(challengeToken: string): Promise<SessionUser> {
        const payload = await this.jwtService
            .verifyAsync<{ sub?: string; purpose?: string }>(challengeToken, {
                secret: this.challengeSecret(),
            })
            .catch(() => null);
        const user = payload?.purpose === "LOGIN_TWO_FACTOR" && payload.sub
            ? await this.usersService.findById(payload.sub)
            : null;

        if (!user) {
            throw new UnauthorizedException({
                statusCode: 401,
                code: "TWO_FACTOR_EXPIRED",
                message: "Phiên xác minh đã hết hạn. Vui lòng đăng nhập lại.",
            });
        }

        return user;
    }

    async verifyTwoFactor(challengeToken: string, code: string) {
        const user = await this.readChallenge(challengeToken);
        const token = await this.prisma.authToken.findFirst({
            where: {
                userId: user.id,
                purpose: "LOGIN_TWO_FACTOR",
                usedAt: null,
                expiresAt: { gt: new Date() },
            },
            orderBy: { createdAt: "desc" },
        });

        if (!token || token.attemptCount >= this.maxOtpAttempts) {
            throw new UnauthorizedException(INVALID_LOGIN_CODE);
        }

        const expectedHash = Buffer.from(token.tokenHash, "hex");
        const submittedHash = Buffer.from(
            this.hashOtp(`LOGIN_TWO_FACTOR:${user.id}`, code),
            "hex",
        );

        if (
            expectedHash.length !== submittedHash.length ||
            !timingSafeEqual(expectedHash, submittedHash)
        ) {
            await this.prisma.authToken.updateMany({
                where: {
                    id: token.id,
                    usedAt: null,
                    attemptCount: { lt: this.maxOtpAttempts },
                },
                data: { attemptCount: { increment: 1 } },
            });

            throw new UnauthorizedException(INVALID_LOGIN_CODE);
        }

        // Dùng một lần: hai yêu cầu cùng lúc với cùng mã thì chỉ một cái được.
        const consumed = await this.prisma.authToken.updateMany({
            where: {
                id: token.id,
                usedAt: null,
                expiresAt: { gt: new Date() },
                attemptCount: { lt: this.maxOtpAttempts },
            },
            data: { usedAt: new Date() },
        });

        if (consumed.count !== 1) {
            throw new UnauthorizedException(INVALID_LOGIN_CODE);
        }

        // Tài khoản có thể bị khóa trong lúc chờ mã.
        this.assertCanSignIn(user);

        return this.issueSession(user);
    }

    async resendTwoFactor(challengeToken: string) {
        const user = await this.readChallenge(challengeToken);

        await this.sendLoginCode(user);

        return { message: "Đã gửi mã mới tới email của bạn." };
    }

    // Bật/tắt xác thực hai lớp, luôn hỏi mật khẩu hiện tại. Tài khoản chỉ có Google phải đặt mật khẩu trước.
    // Sai mật khẩu trả 400, không phải 401: client coi 401 là hết phiên và tự đăng xuất.
    async setTwoFactor(userId: string, enabled: boolean, currentPassword: string) {
        const user = await this.usersService.findById(userId);

        if (!user) {
            throw new UnauthorizedException(SESSION_REVOKED_ERROR);
        }

        if (!user.passwordHash) {
            throw new BadRequestException({
                statusCode: 400,
                code: "PASSWORD_REQUIRED",
                message: "Hãy đặt mật khẩu trước khi bật xác thực hai lớp.",
            });
        }

        if (!(await bcrypt.compare(currentPassword, user.passwordHash))) {
            throw new BadRequestException("Mật khẩu hiện tại không đúng.");
        }

        await this.prisma.user.update({
            where: { id: userId },
            data: { twoFactorEnabled: enabled },
        });

        return { data: { twoFactorEnabled: enabled } };
    }

    // Đăng xuất mọi thiết bị: mọi token đang có mang tokenVersion cũ.
    async logout(userId: string): Promise<void> {
        await this.prisma.user.update({
            where: { id: userId },
            data: { tokenVersion: { increment: 1 } },
        });
    }

    async loginWithGoogle(dto: GoogleLoginDto) {
        const payload = await this.googleVerifier.verify(dto.idToken);

        if (!payload.email || payload.emailVerified !== true) {
            throw new UnauthorizedException("Không xác minh được tài khoản Google. Vui lòng thử lại.");
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
                    throw new ConflictException("Không tạo được tên người dùng. Vui lòng thử lại.");
                }
                user = createdUser;
            }
        }

        return this.startSession(user);
    }
    ///////////////Reset Password

    private hashPasswordResetOtp(userId: string, otp: string): string {
        const secret = process.env.OTP_HASH_SECRET;

        if (!secret) {
            throw new InternalServerErrorException(
                "Dịch vụ mã xác minh chưa được cấu hình.",
            );
        }

        return createHmac("sha256", secret)
            .update(`PASSWORD_RESET:${userId}:${otp}`)
            .digest("hex");
    }

    async forgotPassword(dto: ForgotPasswordDto) {
        const email = this.normalizeEmail(dto.email);
        const genericResponse = {
            message: "Nếu email đã đăng ký, mã đặt lại mật khẩu sẽ được gửi tới email.",
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
            throw new UnauthorizedException("Mã đặt lại mật khẩu không đúng hoặc đã hết hạn.");
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
            throw new UnauthorizedException("Mã đặt lại mật khẩu không đúng hoặc đã hết hạn.");
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

            throw new UnauthorizedException("Mã đặt lại mật khẩu không đúng hoặc đã hết hạn.");
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
                throw new UnauthorizedException("Mã đặt lại mật khẩu không đúng hoặc đã hết hạn.");
            }

            // Đăng xuất mọi thiết bị và mở khóa đăng nhập (chủ tài khoản vừa chứng minh qua email).
            await tx.user.update({
                where: { id: user.id },
                data: {
                    passwordHash: newPasswordHash,
                    tokenVersion: { increment: 1 },
                    failedLoginCount: 0,
                    loginLockedUntil: null,
                },
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

        return { message: "Đã đặt lại mật khẩu." };
    }

    async changePassword(
        userId: string,
        currentPassword: string | undefined,
        newPassword: string,
    ) {
        const user = await this.usersService.findById(userId);

        if (!user) {
            throw new UnauthorizedException();
        }

        // Tài khoản chỉ có Google chưa có mật khẩu: cho đặt lần đầu mà không cần mật khẩu cũ.
        // Sai mật khẩu trả 400, không phải 401: client coi 401 là hết phiên và tự đăng xuất.
        if (
            user.passwordHash &&
            !(await bcrypt.compare(currentPassword ?? "", user.passwordHash))
        ) {
            throw new BadRequestException("Mật khẩu hiện tại không đúng.");
        }

        // Các thiết bị khác bị đăng xuất; thiết bị này nhận token mới để vẫn đăng nhập.
        const updated = await this.prisma.user.update({
            where: { id: userId },
            data: {
                passwordHash: await bcrypt.hash(newPassword, 10),
                tokenVersion: { increment: 1 },
            },
        });
        const { data } = await this.issueSession(updated);

        return { data: { changed: true, accessToken: data.accessToken } };
    }
}
