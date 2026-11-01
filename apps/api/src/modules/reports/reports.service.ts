import { Injectable, NotFoundException } from '@nestjs/common';

import { PrismaService } from '../../prisma/prisma.service';
import { CreateReportDto } from './dto/create-report.dto';

// Số tin đưa vào bản chụp khi báo cáo một hội thoại.
const SNAPSHOT_MESSAGES = 50;

@Injectable()
export class ReportsService {
    constructor(private readonly prisma: PrismaService) { }

    async create(reporterId: string, dto: CreateReportDto) {
        const key = {
            reporterId,
            targetType: dto.targetType,
            targetId: dto.targetId,
        };
        const snapshot =
            dto.targetType === 'CONVERSATION'
                ? await this.reportConversation(reporterId, dto.targetId)
                : undefined;

        // Báo cáo lại cùng một đối tượng chỉ cập nhật lý do, không tạo bản ghi mới.
        await this.prisma.report.upsert({
            where: { reporterId_targetType_targetId: key },
            create: { ...key, reason: dto.reason, note: dto.note, snapshot },
            update: { reason: dto.reason, note: dto.note, ...(snapshot ? { snapshot } : {}) },
        });

        return { data: { reported: true } };
    }

    // Báo cáo một hội thoại (lừa đảo, quấy rối...). Admin chỉ thấy tin của hội thoại bị báo cáo,
    // qua bản chụp này. Hội thoại ẩn danh: đóng ngay và tạm tước quyền gửi ẩn danh của người kia
    // cho tới khi admin xem (docs/moderation/MODERATION_PLAN.md, mục 5).
    private async reportConversation(reporterId: string, conversationId: string) {
        const conversation = await this.prisma.conversation.findUnique({
            where: { id: conversationId },
            select: { userAId: true, userBId: true, kind: true, closedAt: true },
        });

        if (
            !conversation ||
            (conversation.userAId !== reporterId && conversation.userBId !== reporterId)
        ) {
            throw new NotFoundException('Conversation not found');
        }

        const reportedUserId =
            conversation.userAId === reporterId ? conversation.userBId : conversation.userAId;
        const anonymousUserId =
            conversation.kind === 'ANON_A'
                ? conversation.userAId
                : conversation.kind === 'ANON_B'
                    ? conversation.userBId
                    : null;

        const messages = await this.prisma.message.findMany({
            where: { conversationId },
            orderBy: { createdAt: 'desc' },
            take: SNAPSHOT_MESSAGES,
            select: {
                id: true,
                senderId: true,
                content: true,
                imageUrl: true,
                sensitive: true,
                createdAt: true,
            },
        });

        if (anonymousUserId === reportedUserId) {
            const now = new Date();

            await this.prisma.$transaction([
                this.prisma.conversation.update({
                    where: { id: conversationId },
                    data: { closedAt: conversation.closedAt ?? now },
                }),
                this.prisma.user.updateMany({
                    where: { id: reportedUserId, anonymousSuspendedAt: null },
                    data: { anonymousSuspendedAt: now },
                }),
            ]);
        }

        return {
            conversationId,
            kind: conversation.kind,
            reportedUserId,
            anonymous: anonymousUserId === reportedUserId,
            messages: messages.reverse().map((message) => ({
                ...message,
                createdAt: message.createdAt.toISOString(),
            })),
        };
    }
}
