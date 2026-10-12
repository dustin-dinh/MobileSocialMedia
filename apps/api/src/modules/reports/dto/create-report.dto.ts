import { IsIn, IsOptional, IsString, MaxLength } from 'class-validator';

export class CreateReportDto {
    @IsIn(['POST', 'COMMENT', 'USER'])
    targetType!: string;

    @IsString()
    @MaxLength(64)
    targetId!: string;

    @IsIn(['SPAM', 'HARASSMENT', 'SENSITIVE', 'MISINFORMATION', 'OTHER'])
    reason!: string;

    @IsOptional()
    @IsString()
    @MaxLength(500)
    note?: string;
}
