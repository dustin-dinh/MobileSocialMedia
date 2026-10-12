import { Type } from 'class-transformer';
import {
    ArrayMaxSize,
    IsArray,
    IsIn,
    IsInt,
    IsISO8601,
    IsOptional,
    IsString,
    MaxLength,
    Min,
    ValidateNested,
} from 'class-validator';

export const INTERACTION_TYPES = [
    'VIEW',
    'COMPLETE',
    'REPLAY',
    'SKIP',
    'LIKE',
    'SAVE',
    'NOT_INTERESTED',
] as const;

export class InteractionEventDto {
    @IsString()
    @MaxLength(100)
    eventId!: string;

    @IsIn(INTERACTION_TYPES)
    eventType!: (typeof INTERACTION_TYPES)[number];

    @IsString()
    @MaxLength(100)
    postId!: string;

    @IsOptional()
    @IsString()
    @MaxLength(100)
    mediaId?: string | null;

    @IsOptional()
    @IsInt()
    @Min(0)
    watchMs?: number | null;

    @IsOptional()
    @IsInt()
    @Min(0)
    durationMs?: number | null;

    @IsOptional()
    @IsInt()
    @Min(0)
    position?: number | null;

    @IsOptional()
    @IsString()
    @MaxLength(100)
    requestId?: string | null;

    @IsString()
    @MaxLength(30)
    surface!: string;

    @IsOptional()
    @IsISO8601()
    createdAt?: string;
}

export class InteractionsDto {
    @IsArray()
    @ArrayMaxSize(50)
    @ValidateNested({ each: true })
    @Type(() => InteractionEventDto)
    events!: InteractionEventDto[];
}
