
import {
    IsOptional,
    IsString,
    MaxLength,
} from 'class-validator';

export class UpdatePostDto {
    @IsOptional()
    @IsString()
    @MaxLength(500)
    content?: string;

    // JSON string, ví dụ: ["media_id_1", "media_id_2"]
    // Chỉ dùng để chỉ định các ảnh cũ cần giữ lại.
    // Không gửi trường này nghĩa là giữ tất cả ảnh cũ.
    keepMediaIds?: string;
}
