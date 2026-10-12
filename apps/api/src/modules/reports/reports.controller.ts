import { Body, Controller, Post, Request, UseGuards } from '@nestjs/common';

import { JwtAuthGuard } from '../auth/guards/jwt-auth.guard';
import { CreateReportDto } from './dto/create-report.dto';
import { ReportsService } from './reports.service';

@Controller('reports')
@UseGuards(JwtAuthGuard)
export class ReportsController {
    constructor(private readonly reportsService: ReportsService) { }

    @Post()
    async create(
        @Request() request: { user: { userId: string } },
        @Body() dto: CreateReportDto,
    ) {
        return this.reportsService.create(request.user.userId, dto);
    }
}
