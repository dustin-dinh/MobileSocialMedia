import { IsOptional, IsString, MaxLength } from 'class-validator';

export class DeleteAccountDto {
    // Tài khoản có mật khẩu xác nhận bằng mật khẩu.
    @IsOptional()
    @IsString()
    @MaxLength(72)
    password?: string;

    // Tài khoản chỉ có Google xác nhận bằng cách gõ lại username.
    @IsOptional()
    @IsString()
    @MaxLength(30)
    confirm?: string;
}
