import { IsIn, IsInt, IsString, Min } from 'class-validator';

export class UploadUrlDto {
    @IsIn(['video', 'thumbnail'])
    kind!: 'video' | 'thumbnail';

    @IsString()
    mimeType!: string;

    @IsInt()
    @Min(1)
    sizeBytes!: number;
}
