import { IsIn, IsInt, IsString, Min } from 'class-validator';

export class UploadUrlDto {
    @IsIn(['video', 'thumbnail', 'image'])
    kind!: 'video' | 'thumbnail' | 'image';

    @IsString()
    mimeType!: string;

    @IsInt()
    @Min(1)
    sizeBytes!: number;
}
