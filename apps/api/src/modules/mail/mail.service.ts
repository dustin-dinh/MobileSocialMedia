import {
    Injectable,
    InternalServerErrorException,
} from "@nestjs/common";
import { ConfigService } from "@nestjs/config";
import nodemailer, { type Transporter } from "nodemailer";

const OTP_WARNING =
    "Không chia sẻ mã này với bất kỳ ai. MobileSocialMedia không bao giờ yêu cầu bạn cung cấp mã qua điện thoại, tin nhắn hay email. (Do not share this code with anyone.)";

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
                subject: "Mã xác thực email MobileSocialMedia",
                text: `Mã xác thực của bạn là ${otp}. Mã hết hạn sau 5 phút.

${OTP_WARNING}`,
                html: `
          <div style="font-family:Arial,sans-serif;line-height:1.6">
            <h2>Xác thực email của bạn</h2>
            <p>Nhập mã này trong ứng dụng MobileSocialMedia:</p>
            <p style="font-size:30px;font-weight:bold;letter-spacing:8px">
              ${otp}
            </p>
            <p>Mã hết hạn sau 5 phút.</p>
            <p><strong>${OTP_WARNING}</strong></p>
            <p>Nếu bạn không tạo tài khoản này, hãy bỏ qua email này.</p>
          </div>
        `,
            });
        } catch {
            throw new InternalServerErrorException(
                "Không gửi được email xác thực. Vui lòng thử lại sau.",
            );
        }
    }

    async sendPasswordResetOtp(email: string, otp: string): Promise<void> {
        try {
            await this.transporter.sendMail({
                from: this.config.getOrThrow<string>("MAIL_FROM"),
                to: email,
                subject: "Mã đặt lại mật khẩu MobileSocialMedia",
                text: [
                    `Mã đặt lại mật khẩu của bạn là: ${otp}`,
                    "",
                    "Mã hết hạn sau 5 phút.",
                    OTP_WARNING,
                    "Nếu bạn không yêu cầu đặt lại mật khẩu, hãy bỏ qua email này.",
                ].join("\n"),
                html: `
        <div style="font-family:Arial,sans-serif;line-height:1.6">
          <h2>Đặt lại mật khẩu</h2>
          <p>Nhập mã này trong ứng dụng MobileSocialMedia:</p>
          <p style="font-size:30px;font-weight:bold;letter-spacing:8px">
            ${otp}
          </p>
          <p>Mã hết hạn sau 5 phút.</p>
            <p><strong>${OTP_WARNING}</strong></p>
          <p>Nếu bạn không yêu cầu đặt lại mật khẩu, hãy bỏ qua email này.</p>
        </div>
      `,
            });
        } catch {
            throw new InternalServerErrorException(
                "Không gửi được email đặt lại mật khẩu. Vui lòng thử lại sau.",
            );
        }
    }

    async sendLoginCode(email: string, otp: string): Promise<void> {
        try {
            await this.transporter.sendMail({
                from: this.config.getOrThrow<string>("MAIL_FROM"),
                to: email,
                subject: "Mã đăng nhập MobileSocialMedia",
                text: [
                    `Mã đăng nhập của bạn là: ${otp}`,
                    "",
                    "Mã hết hạn sau 5 phút.",
                    OTP_WARNING,
                    "Nếu bạn không vừa đăng nhập, hãy đổi mật khẩu ngay: ai đó đã biết mật khẩu của bạn.",
                ].join("\n"),
                html: `
        <div style="font-family:Arial,sans-serif;line-height:1.6">
          <h2>Mã đăng nhập</h2>
          <p>Nhập mã này trong ứng dụng MobileSocialMedia để hoàn tất đăng nhập:</p>
          <p style="font-size:30px;font-weight:bold;letter-spacing:8px">
            ${otp}
          </p>
          <p>Mã hết hạn sau 5 phút.</p>
          <p><strong>${OTP_WARNING}</strong></p>
          <p>Nếu bạn không vừa đăng nhập, hãy đổi mật khẩu ngay: ai đó đã biết mật khẩu của bạn.</p>
        </div>
      `,
            });
        } catch {
            throw new InternalServerErrorException(
                "Không gửi được mã xác minh. Vui lòng thử lại sau.",
            );
        }
    }
}
