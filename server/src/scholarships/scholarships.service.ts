import { Injectable, NotFoundException } from '@nestjs/common';

import { PrismaService } from '../prisma/prisma.service.js';
import { buildLandingSnapshot } from '../shared/data/landing-snapshot.js';
import { countListings, findListing, openListings, searchListings, similarListings } from '../shared/data/search.js';
import { parseSearchFilters } from '../shared/scholarships/filters.js';
import type { ScholarshipDetail } from '../shared/types/scholarship.js';
import { toDetail } from './scholarship.mapper.js';

type QueryInput = Record<string, string | string[] | undefined>;

const PRERENDER_LIMIT = 50;

@Injectable()
export class ScholarshipsService {
  constructor(private readonly prisma: PrismaService) {}

  async search(query: QueryInput) {
    return searchListings(await this.listings(), parseSearchFilters(query), new Date());
  }

  async count(query: QueryInput) {
    return { total: countListings(await this.listings(), parseSearchFilters(query), new Date()) };
  }

  async findOne(id: string): Promise<ScholarshipDetail> {
    const scholarship = findListing(await this.listings(), id);
    if (!scholarship) throw new NotFoundException('Scholarship not found');
    return scholarship;
  }

  async similar(id: string) {
    const listings = await this.listings();
    if (!findListing(listings, id)) throw new NotFoundException('Scholarship not found');
    return similarListings(listings, id, new Date());
  }

  async prerenderIds() {
    const rows = await this.prisma.scholarship.findMany({
      where: { status: 'PUBLISHED', deadline: { gte: new Date() } },
      orderBy: { deadline: 'asc' },
      take: PRERENDER_LIMIT,
      select: { slug: true },
    });
    return rows.map((row) => row.slug);
  }

  async landingSnapshot() {
    const now = new Date();
    return buildLandingSnapshot(openListings(await this.listings(), now), now);
  }

  private async listings(): Promise<ScholarshipDetail[]> {
    const rows = await this.prisma.scholarship.findMany({ where: { status: { in: ['PUBLISHED', 'UNDER_REVIEW'] } } });
    return rows.map(toDetail);
  }
}
