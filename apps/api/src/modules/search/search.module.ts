import { Module } from '@nestjs/common';
import { HashtagsController, SearchController } from './search.controller';
import { SearchService } from './search.service';

@Module({
    controllers: [SearchController, HashtagsController],
    providers: [SearchService],
})
export class SearchModule { }