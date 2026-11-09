import { IsBoolean, IsString, Matches, MaxLength } from "class-validator";

export class SetTwoFactorDto {
    @IsBoolean()
    enabled!: boolean;

    @IsString()
    @MaxLength(72)
    currentPassword!: string;
}

export class TwoFactorChallengeDto {
    @IsString()
    @MaxLength(2048)
    challengeToken!: string;
}

export class VerifyTwoFactorDto extends TwoFactorChallengeDto {
    @IsString()
    @Matches(/^\d{6}$/, { message: "Mã xác minh gồm đúng 6 chữ số." })
    code!: string;
}
