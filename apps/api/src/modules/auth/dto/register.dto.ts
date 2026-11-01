import {
    IsEmail,
    IsISO8601,
    IsString,
    Matches,
    MaxLength,
    MinLength,
} from "class-validator";

export class RegisterDto {
    @IsString()
    @MinLength(3)
    @MaxLength(30)
    @Matches(/^[a-zA-Z0-9._]+$/, {
        message:
            "Username can only contain letters, numbers, dots and underscores",
    })
    username!: string;

    @IsEmail()
    @MaxLength(255)
    email!: string;

    @IsString()
    @MinLength(8)
    @MaxLength(72)
    password!: string;

    // "YYYY-MM-DD". Phải đủ 18 tuổi (kiểm tra trong AuthService).
    @IsISO8601({ strict: true })
    @MaxLength(10)
    birthDate!: string;
}