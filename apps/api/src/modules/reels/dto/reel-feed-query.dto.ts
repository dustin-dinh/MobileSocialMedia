import { Type } from 'class-transformer';
import { IsInt, IsOptional, IsString, Max, MaxLength, Min } from 'class-validator';

export class ReelFeedQueryDto {
    @IsOptional()
    @Type(() => Number)
    @IsInt()
    @Min(1)
    @Max(20)
    limit = 5;

    // Danh sách id đã hiển thị, cách nhau bằng dấu phẩy (tối đa 50 id).
    @IsOptional()
    @IsString()
    @MaxLength(2000)
    exclude?: string;
}
