import { IsIn, IsOptional, IsString, MaxLength } from 'class-validator';

export class CreateReportDto {
    // CONVERSATION: báo cáo một hội thoại tin nhắn (targetId = id hội thoại).
    @IsIn(['POST', 'COMMENT', 'USER', 'CONVERSATION'])
    targetType!: string;

    @IsString()
    @MaxLength(64)
    targetId!: string;

    // CHILD_SAFETY: nội dung xâm hại hoặc gợi dục trẻ em, luôn được xử lý trước tiên.
    @IsIn(['CHILD_SAFETY', 'SPAM', 'HARASSMENT', 'SENSITIVE', 'MISINFORMATION', 'SCAM', 'OTHER'])
    reason!: string;

    @IsOptional()
    @IsString()
    @MaxLength(500)
    note?: string;
}
