
import {
    IsEnum,
    IsOptional,
    IsString,
    MaxLength,
} from 'class-validator';

import { PostPrivacy } from '../../../generated/prisma/client';

export class CreatePostDto {
    @IsOptional()
    @IsString()
    @MaxLength(500)
    content?: string;

    @IsOptional()
    @IsEnum(PostPrivacy)
    privacy?: PostPrivacy;
}
