import {
    Body,
    CanActivate,
    Controller,
    Delete,
    ExecutionContext,
    ForbiddenException,
    Get,
    Header,
    Injectable,
    Param,
    Post,
    Query,
    Request,
    UseGuards,
} from '@nestjs/common';
import { Type } from 'class-transformer';
import {
    IsIn,
    IsInt,
    IsOptional,
    IsString,
    Max,
    MaxLength,
    Min,
} from 'class-validator';
import { readFileSync } from 'node:fs';
import { join } from 'node:path';

import { PrismaService } from '../../prisma/prisma.service';
import { JwtAuthGuard } from '../auth/guards/jwt-auth.guard';
import { AdminService, ReportAction } from './admin.service';

// Chạy sau JwtAuthGuard. Vai trò được đọc từ database ở mỗi request quản trị,
// nên tước quyền admin có hiệu lực ngay.
@Injectable()
export class AdminGuard implements CanActivate {
    constructor(private readonly prisma: PrismaService) { }

    async canActivate(context: ExecutionContext): Promise<boolean> {
        const { user } = context
            .switchToHttp()
            .getRequest<{ user: { userId: string } }>();
        const account = await this.prisma.user.findUnique({
            where: { id: user.userId },
            select: { role: true },
        });

        if (account?.role !== 'ADMIN') {
            throw new ForbiddenException('Administrator access required');
        }

        return true;
    }
}

class PageQueryDto {
    @IsOptional()
    @Type(() => Number)
    @IsInt()
    @Min(1)
    page = 1;

    @IsOptional()
    @Type(() => Number)
    @IsInt()
    @Min(1)
    @Max(50)
    limit = 20;
}

class ReportsQueryDto extends PageQueryDto {
    @IsOptional()
    @IsIn(['OPEN', 'RESOLVED', 'DISMISSED'])
    status = 'OPEN';
}

class UsersQueryDto extends PageQueryDto {
    @IsOptional()
    @IsString()
    @MaxLength(100)
    q = '';
}

class ResolveReportDto {
    @IsIn(['DISMISS', 'REMOVE_CONTENT', 'BAN_USER'])
    action!: ReportAction;
}

type AuthedRequest = { user: { userId: string } };

// Trang quản trị (HTML tĩnh). Không cần token để tải trang; mọi dữ liệu đi qua các route có bảo vệ bên dưới.
@Controller('admin')
export class AdminPageController {
    private readonly page = readFileSync(join(__dirname, 'admin.html'), 'utf8');

    @Get()
    @Header('Content-Type', 'text/html; charset=utf-8')
    @Header('Cache-Control', 'no-store')
    getPage(): string {
        return this.page;
    }
}

@Controller('admin')
@UseGuards(JwtAuthGuard, AdminGuard)
export class AdminController {
    constructor(private readonly adminService: AdminService) { }

    @Get('stats')
    stats() {
        return this.adminService.stats();
    }

    @Get('reports')
    findReports(@Query() query: ReportsQueryDto) {
        return this.adminService.findReports(query.status, query.page, query.limit);
    }

    @Post('reports/:id/resolve')
    resolveReport(
        @Request() request: AuthedRequest,
        @Param('id') id: string,
        @Body() dto: ResolveReportDto,
    ) {
        return this.adminService.resolveReport(request.user.userId, id, dto.action);
    }

    @Get('users')
    findUsers(@Query() query: UsersQueryDto) {
        return this.adminService.findUsers(query.q.trim(), query.page, query.limit);
    }

    @Post('users/:id/ban')
    ban(@Request() request: AuthedRequest, @Param('id') id: string) {
        return this.adminService.setBanned(request.user.userId, id, true);
    }

    @Delete('users/:id/ban')
    unban(@Request() request: AuthedRequest, @Param('id') id: string) {
        return this.adminService.setBanned(request.user.userId, id, false);
    }

    @Delete('users/:id/age-lock')
    unlockAge(@Param('id') id: string) {
        return this.adminService.unlockAge(id);
    }

    // Trả lại / tước quyền gửi tin ẩn danh.
    @Post('users/:id/anonymous')
    allowAnonymous(@Param('id') id: string) {
        return this.adminService.setAnonymousAllowed(id, true);
    }

    @Delete('users/:id/anonymous')
    suspendAnonymous(@Param('id') id: string) {
        return this.adminService.setAnonymousAllowed(id, false);
    }
}
