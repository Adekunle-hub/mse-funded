import { ConflictException, Injectable, NotFoundException } from '@nestjs/common';

import { Prisma, type ListingStatus } from '../generated/prisma/client.js';
import { PrismaService } from '../prisma/prisma.service.js';
import { WebsiteService } from '../website/website.service.js';
import { listingStatuses, toDeadline, type UpdateListingDto } from './dto/admin.dto.js';

export const ADMIN_PAGE_SIZE = 20;

export function pageNumber(value: string | undefined): number {
  const page = Number.parseInt(value ?? '1', 10);
  return Number.isFinite(page) && page > 0 ? page : 1;
}

@Injectable()
export class AdminListingsService {
  constructor(
    private readonly prisma: PrismaService,
    private readonly website: WebsiteService,
  ) {}

  async list(search: string | undefined, status: string | undefined, page: number) {
    const q = search?.trim();
    const statusFilter = (listingStatuses as readonly string[]).includes(status ?? '') ? (status as ListingStatus) : undefined;
    const where: Prisma.ScholarshipWhereInput = {
      ...(statusFilter ? { status: statusFilter } : {}),
      ...(q ? { OR: [{ name: { contains: q, mode: 'insensitive' } }, { institution: { contains: q, mode: 'insensitive' } }] } : {}),
    };

    const [total, items] = await Promise.all([
      this.prisma.scholarship.count({ where }),
      this.prisma.scholarship.findMany({
        where,
        orderBy: { updatedAt: 'desc' },
        skip: (page - 1) * ADMIN_PAGE_SIZE,
        take: ADMIN_PAGE_SIZE,
        select: {
          id: true,
          slug: true,
          name: true,
          institution: true,
          country: true,
          status: true,
          deadline: true,
          officialUrl: true,
          reviewNote: true,
          verifiedAt: true,
          _count: { select: { reports: { where: { resolvedAt: null } } } },
        },
      }),
    ]);

    return {
      items: items.map(({ _count, ...item }) => ({ ...item, openReports: _count.reports })),
      total,
      page,
      pageCount: Math.max(1, Math.ceil(total / ADMIN_PAGE_SIZE)),
    };
  }

  async update(id: string, dto: UpdateListingDto) {
    const listing = await this.prisma.scholarship.findUnique({ where: { id }, select: { id: true } });
    if (!listing) throw new NotFoundException('Listing not found');

    const data: Prisma.ScholarshipUpdateInput = {
      name: dto.name?.trim(),
      officialUrl: dto.officialUrl,
      deadline: toDeadline(dto.deadline),
      status: dto.status,
    };
    if (dto.status === 'PUBLISHED') {
      data.reviewNote = null;
      data.verifiedAt = new Date();
    }

    try {
      const updated = await this.prisma.scholarship.update({
        where: { id },
        data,
        select: { id: true, name: true, status: true, deadline: true, officialUrl: true },
      });
      await this.website.refreshListings();
      return updated;
    } catch (error) {
      if (error instanceof Prisma.PrismaClientKnownRequestError && error.code === 'P2002') {
        throw new ConflictException('Another listing from this funder already has this name');
      }
      throw error;
    }
  }
}
