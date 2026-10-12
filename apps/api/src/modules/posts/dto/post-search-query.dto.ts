import { IsString, MaxLength, MinLength } from 'class-validator';

import { FeedQueryDto } from './feed-query.dto';

export class PostSearchQueryDto extends FeedQueryDto {
    @IsString()
    @MinLength(1)
    @MaxLength(100)
    q!: string;
}
