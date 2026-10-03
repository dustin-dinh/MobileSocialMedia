import { Type } from 'class-transformer';
import {
    IsInt,
    IsNotEmpty,
    IsString,
    Max,
    Min,
} from 'class-validator';

export class UserSearchQueryDto {
    @IsString()
    @IsNotEmpty()
    q!: string;

    @Type(() => Number)
    @IsInt()
    @Min(1)
    page = 1;

    @Type(() => Number)
    @IsInt()
    @Min(1)
    @Max(50)
    limit = 20;
}