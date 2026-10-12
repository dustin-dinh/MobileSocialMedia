import { Injectable } from '@nestjs/common';

import { PrismaService } from '../../prisma/prisma.service';
import { CreateReportDto } from './dto/create-report.dto';

// shortcut: chưa có trang quản trị, xem báo cáo bằng Prisma Studio/SQL; làm màn duyệt khi có người kiểm duyệt.
@Injectable()
export class ReportsService {
    constructor(private readonly prisma: PrismaService) { }

    async create(reporterId: string, dto: CreateReportDto) {
        const key = {
            reporterId,
            targetType: dto.targetType,
            targetId: dto.targetId,
        };

        // Báo cáo lại cùng một đối tượng chỉ cập nhật lý do, không tạo bản ghi mới.
        await this.prisma.report.upsert({
            where: { reporterId_targetType_targetId: key },
            create: { ...key, reason: dto.reason, note: dto.note },
            update: { reason: dto.reason, note: dto.note },
        });

        return { data: { reported: true } };
    }
}
