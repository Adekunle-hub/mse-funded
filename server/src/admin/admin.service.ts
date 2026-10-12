import { InjectQueue } from '@nestjs/bullmq';
import { Injectable } from '@nestjs/common';
import type { Queue } from 'bullmq';

import type { Opportunity } from '../extraction/extraction.schema.js';
import { PrismaService } from '../prisma/prisma.service.js';
import { CRAWL_QUEUE, EXTRACT_QUEUE, VERIFY_QUEUE } from '../queues.js';

@Injectable()
export class AdminService {
  constructor(
    private readonly prisma: PrismaService,
    @InjectQueue(CRAWL_QUEUE) private readonly crawlQueue: Queue,
    @InjectQueue(EXTRACT_QUEUE) private readonly extractQueue: Queue,
    @InjectQueue(VERIFY_QUEUE) private readonly verifyQueue: Queue,
  ) {}

  async summary() {
    const now = new Date();
    const startOfDay = new Date(Date.UTC(now.getUTCFullYear(), now.getUTCMonth(), now.getUTCDate()));
    const live = { status: { in: ['PUBLISHED' as const, 'UNDER_REVIEW' as const] }, OR: [{ deadline: null }, { deadline: { gte: now } }] };

    const [liveListings, underReview, needsReview, openReports, pagesWaiting, pagesFailed, sources, sourcesWithErrors, usageToday, callsTotal] =
      await Promise.all([
        this.prisma.scholarship.count({ where: live }),
        this.prisma.scholarship.count({ where: { ...live, status: 'UNDER_REVIEW' } }),
        this.prisma.extractedOpportunity.count({ where: { status: 'NEEDS_REVIEW' } }),
        this.prisma.report.count({ where: { resolvedAt: null } }),
        this.prisma.rawPage.count({ where: { extractionStatus: 'PENDING' } }),
        this.prisma.rawPage.count({ where: { extractionStatus: 'FAILED' } }),
        this.prisma.source.count({ where: { isActive: true } }),
        this.prisma.source.count({ where: { isActive: true, lastError: { not: null } } }),
        this.prisma.llmUsage.aggregate({
          where: { createdAt: { gte: startOfDay } },
          _count: true,
          _sum: { inputTokens: true, outputTokens: true },
        }),
        this.prisma.llmUsage.count(),
      ]);

    const queue = async (q: Queue) => ({ ...(await q.getJobCounts('waiting', 'active', 'failed')), paused: await q.isPaused() });

    return {
      listings: { live: liveListings, underReview, needsReview, openReports },
      pages: { waiting: pagesWaiting, failed: pagesFailed },
      sources: { active: sources, withErrors: sourcesWithErrors },
      queues: { crawl: await queue(this.crawlQueue), extract: await queue(this.extractQueue), verify: await queue(this.verifyQueue) },
      ai: {
        callsToday: usageToday._count,
        callsTotal,
        tokensToday: (usageToday._sum.inputTokens ?? 0) + (usageToday._sum.outputTokens ?? 0),
      },
    };
  }

  async heldForReview() {
    const rows = await this.prisma.extractedOpportunity.findMany({
      where: { status: 'NEEDS_REVIEW' },
      orderBy: { createdAt: 'asc' },
      include: { rawPage: { select: { url: true, finalUrl: true } } },
    });

    return rows.map((row) => {
      const data = row.data as unknown as Opportunity;
      return {
        id: row.id,
        title: row.title,
        institution: row.institution,
        level: row.level,
        country: data.country,
        fundingType: data.fundingType,
        fundingSummary: data.fundingSummary,
        openToNigerians: data.openToNigerians,
        deadline: row.deadline,
        officialUrl: data.officialUrl,
        pageUrl: row.rawPage.finalUrl ?? row.rawPage.url,
        note: row.note,
        createdAt: row.createdAt,
      };
    });
  }
}
