import { IsIn, IsOptional, IsString, MaxLength } from 'class-validator';

export class CreateReportDto {
    // CONVERSATION: báo cáo một hội thoại tin nhắn (targetId = id hội thoại).
    @IsIn(['POST', 'COMMENT', 'USER', 'CONVERSATION'])
    targetType!: string;

    @IsString()
    @MaxLength(64)
    targetId!: string;

    @IsIn(['SPAM', 'HARASSMENT', 'SENSITIVE', 'MISINFORMATION', 'SCAM', 'OTHER'])
    reason!: string;

    @IsOptional()
    @IsString()
    @MaxLength(500)
    note?: string;
}
