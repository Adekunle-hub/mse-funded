import { Injectable } from '@nestjs/common';

import type { Source, SourceOrigin } from '../generated/prisma/client.js';
import { PrismaService } from '../prisma/prisma.service.js';

const MINUTE_MS = 60 * 1000;

export type CrawlResult = {
  status: number | null;
  error: string | null;
  robotsAllowed: boolean | null;
};

export type DiscoveredPage = { url: string; name: string };

@Injectable()
export class SourcesService {
  constructor(private readonly prisma: PrismaService) {}

  findById(id: string): Promise<Source | null> {
    return this.prisma.source.findUnique({ where: { id } });
  }

  async findDue(now = new Date()): Promise<Source[]> {
    const sources = await this.prisma.source.findMany({
      where: { isActive: true },
      orderBy: { lastCrawledAt: { sort: 'asc', nulls: 'first' } },
    });

    return sources.filter((source) => {
      if (!source.lastCrawledAt) return true;
      return now.getTime() - source.lastCrawledAt.getTime() >= source.crawlIntervalMinutes * MINUTE_MS;
    });
  }

  async recordCrawl(id: string, { status, error, robotsAllowed }: CrawlResult): Promise<void> {
    await this.prisma.source.update({
      where: { id },
      data: { lastCrawledAt: new Date(), lastStatus: status, lastError: error, robotsAllowed },
    });
  }

  async addDiscovered(pages: DiscoveredPage[], origin: SourceOrigin): Promise<number> {
    if (pages.length === 0) return 0;
    const { count } = await this.prisma.source.createMany({
      data: pages.map(({ url, name }) => ({ url, name, origin })),
      skipDuplicates: true,
    });
    return count;
  }
}
