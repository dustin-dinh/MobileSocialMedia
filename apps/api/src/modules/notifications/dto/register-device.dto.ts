import { IsIn, IsString, MaxLength, MinLength } from 'class-validator';

export class RegisterDeviceDto {
    @IsString()
    @MinLength(10)
    @MaxLength(255)
    token!: string;

    @IsIn(['android', 'ios'])
    platform!: string;
}
