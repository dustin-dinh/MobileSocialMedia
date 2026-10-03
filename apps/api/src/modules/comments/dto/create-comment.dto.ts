import { IsNotEmpty, IsOptional, IsString, MaxLength } from 'class-validator';

export class CreateCommentDto {
    @IsString()
    @IsNotEmpty()
    @MaxLength(1000)
    content!: string;

    @IsOptional()
    @IsString()
    parentId?: string;
}