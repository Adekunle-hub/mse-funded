import { Injectable, NotFoundException } from '@nestjs/common';

import { PrismaService } from '../prisma/prisma.service.js';
import { CreateReportDto } from './dto/create-report.dto.js';

@Injectable()
export class ReportsService {
  constructor(private readonly prisma: PrismaService) {}

  async create(slug: string, dto: CreateReportDto) {
    const scholarship = await this.prisma.scholarship.findFirst({
      where: { slug, status: { in: ['PUBLISHED', 'UNDER_REVIEW'] } },
      select: { id: true },
    });
    if (!scholarship) throw new NotFoundException('Scholarship not found');

    return this.prisma.report.create({
      data: { scholarshipId: scholarship.id, reason: dto.reason, details: dto.details?.trim() || null },
      select: { id: true, createdAt: true },
    });
  }

  listOpen() {
    return this.prisma.report.findMany({
      where: { resolvedAt: null },
      orderBy: { createdAt: 'desc' },
      select: {
        id: true,
        reason: true,
        details: true,
        createdAt: true,
        scholarship: { select: { id: true, slug: true, name: true, institution: true, officialUrl: true, deadline: true } },
      },
    });
  }

  async resolve(id: string): Promise<void> {
    const { count } = await this.prisma.report.updateMany({ where: { id, resolvedAt: null }, data: { resolvedAt: new Date() } });
    if (count === 0) throw new NotFoundException('Report not found');
  }
}
