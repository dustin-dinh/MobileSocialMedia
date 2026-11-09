
import { IsEmail, IsString, Matches, MinLength } from "class-validator";

export class ResetPasswordDto {
    @IsEmail()
    email!: string;

    @IsString()
    @Matches(/^\d{6}$/, {
        message: "Mã xác minh gồm đúng 6 chữ số.",
    })
    otp!: string;

    @IsString()
    @MinLength(8)
    newPassword!: string;
}
