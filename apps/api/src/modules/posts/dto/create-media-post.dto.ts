import { Type } from 'class-transformer';
import {
    ArrayMaxSize,
    ArrayMinSize,
    IsArray,
    IsEnum,
    IsIn,
    IsInt,
    IsOptional,
    IsString,
    MaxLength,
    Min,
    ValidateNested,
} from 'class-validator';

import { PostPrivacy } from '../../../generated/prisma/client';

export class MediaItemDto {
    @IsIn(['VIDEO'])
    type!: 'VIDEO';

    // Khóa nhận từ POST /media/upload-url sau khi đã tải tệp lên.
    @IsString()
    @MaxLength(300)
    storageKey!: string;

    @IsOptional()
    @IsString()
    @MaxLength(300)
    thumbnailKey?: string;

    @IsOptional()
    @IsInt()
    @Min(0)
    width?: number;

    @IsOptional()
    @IsInt()
    @Min(0)
    height?: number;

    @IsInt()
    @Min(1)
    durationMs!: number;
}

export class CreateMediaPostDto {
    @IsOptional()
    @IsString()
    @MaxLength(500)
    content?: string;

    @IsOptional()
    @IsEnum(PostPrivacy)
    privacy?: PostPrivacy;

    // Bản đầu: đúng một video mỗi bài.
    @IsArray()
    @ArrayMinSize(1)
    @ArrayMaxSize(1)
    @ValidateNested({ each: true })
    @Type(() => MediaItemDto)
    media!: MediaItemDto[];
}
