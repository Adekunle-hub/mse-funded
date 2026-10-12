import { ConflictException, Injectable, NotFoundException } from '@nestjs/common';

import type { Prisma } from '../generated/prisma/client.js';
import { PrismaService } from '../prisma/prisma.service.js';
import { ADMIN_PAGE_SIZE } from './admin-listings.service.js';
import type { CreateSourceDto } from './dto/admin.dto.js';

const SOURCE_FIELDS = {
  id: true,
  name: true,
  url: true,
  kind: true,
  origin: true,
  isActive: true,
  lastStatus: true,
  lastError: true,
  lastCrawledAt: true,
} as const;

@Injectable()
export class AdminSourcesService {
  constructor(private readonly prisma: PrismaService) {}

  async list(search: string | undefined, onlyProblems: boolean, page: number) {
    const q = search?.trim();
    const where: Prisma.SourceWhereInput = {
      ...(onlyProblems ? { lastError: { not: null } } : {}),
      ...(q ? { OR: [{ name: { contains: q, mode: 'insensitive' } }, { url: { contains: q, mode: 'insensitive' } }] } : {}),
    };

    const [total, items] = await Promise.all([
      this.prisma.source.count({ where }),
      this.prisma.source.findMany({
        where,
        orderBy: { createdAt: 'desc' },
        skip: (page - 1) * ADMIN_PAGE_SIZE,
        take: ADMIN_PAGE_SIZE,
        select: SOURCE_FIELDS,
      }),
    ]);

    return { items, total, page, pageCount: Math.max(1, Math.ceil(total / ADMIN_PAGE_SIZE)) };
  }

  async create(dto: CreateSourceDto) {
    const url = new URL(dto.url);
    url.hash = '';
    const existing = await this.prisma.source.findUnique({ where: { url: url.toString() }, select: { id: true } });
    if (existing) throw new ConflictException('This link is already a source');

    return this.prisma.source.create({
      data: { url: url.toString(), name: dto.name?.trim() || url.hostname, kind: dto.kind, origin: 'SEED' },
      select: SOURCE_FIELDS,
    });
  }

  async setActive(id: string, isActive: boolean) {
    const source = await this.prisma.source.findUnique({ where: { id }, select: { id: true } });
    if (!source) throw new NotFoundException('Source not found');
    return this.prisma.source.update({ where: { id }, data: { isActive }, select: SOURCE_FIELDS });
  }

  async retryFailedPages() {
    const { count } = await this.prisma.rawPage.updateMany({
      where: { extractionStatus: 'FAILED' },
      data: { extractionStatus: 'PENDING', extractionError: null },
    });
    return { count };
  }
}
