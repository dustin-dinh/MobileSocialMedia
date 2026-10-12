import { Transform } from 'class-transformer';
import {
    IsOptional,
    IsString,
    Matches,
    MaxLength,
    MinLength,
} from 'class-validator';

const trim = ({ value }: { value: unknown }) =>
    typeof value === 'string' ? value.trim() : value;

export class UpdateProfileDto {
    @IsOptional()
    @Transform(trim)
    @IsString()
    @MinLength(1)
    @MaxLength(50)
    displayName?: string;

    @IsOptional()
    @Transform(trim)
    @IsString()
    @MaxLength(160)
    bio?: string;

    // Cùng quy tắc với RegisterDto.
    @IsOptional()
    @Transform(trim)
    @IsString()
    @MinLength(3)
    @MaxLength(30)
    @Matches(/^[a-zA-Z0-9._]+$/, {
        message:
            'Username can only contain letters, numbers, dots and underscores',
    })
    username?: string;
}
