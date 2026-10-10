import {
    Injectable,
    InternalServerErrorException,
} from "@nestjs/common";
import { ConfigService } from "@nestjs/config";
import nodemailer, { type Transporter } from "nodemailer";

@Injectable()
export class MailService {
    private readonly transporter: Transporter;

    constructor(private readonly config: ConfigService) {
        this.transporter = nodemailer.createTransport({
            host: this.config.getOrThrow<string>("SMTP_HOST"),
            port: Number(this.config.get<string>("SMTP_PORT", "587")),
            secure: this.config.get<string>("SMTP_SECURE") === "true",
            auth: {
                user: this.config.getOrThrow<string>("SMTP_USER"),
                pass: this.config.getOrThrow<string>("SMTP_PASS"),
            },
        });
    }

    async sendVerificationOtp(email: string, otp: string): Promise<void> {
        try {
            await this.transporter.sendMail({
                from: this.config.getOrThrow<string>("MAIL_FROM"),
                to: email,
                subject: "Your MobileSocialMedia verification code",
                text: `Your verification code is ${otp}. It expires in 5 minutes.`,
                html: `
          <div style="font-family:Arial,sans-serif;line-height:1.6">
            <h2>Verify your email</h2>
            <p>Enter this code in the MobileSocialMedia app:</p>
            <p style="font-size:30px;font-weight:bold;letter-spacing:8px">
              ${otp}
            </p>
            <p>This code expires in 5 minutes.</p>
            <p>If you did not create this account, ignore this email.</p>
          </div>
        `,
            });
        } catch {
            throw new InternalServerErrorException(
                "Unable to send verification email",
            );
        }
    }

    async sendPasswordResetOtp(email: string, otp: string): Promise<void> {
        try {
            await this.transporter.sendMail({
                from: this.config.getOrThrow<string>("MAIL_FROM"),
                to: email,
                subject: "Your MobileSocialMedia password reset code",
                text: [
                    `Your password reset code is: ${otp}`,
                    "",
                    "This code expires in 5 minutes.",
                    "If you did not request a password reset, ignore this email.",
                ].join("\n"),
                html: `
        <div style="font-family:Arial,sans-serif;line-height:1.6">
          <h2>Reset your password</h2>
          <p>Enter this code in the MobileSocialMedia app:</p>
          <p style="font-size:30px;font-weight:bold;letter-spacing:8px">
            ${otp}
          </p>
          <p>This code expires in 5 minutes.</p>
          <p>If you did not request a password reset, ignore this email.</p>
        </div>
      `,
            });
        } catch {
            throw new InternalServerErrorException(
                "Unable to send password reset email",
            );
        }
    }

}
