import { InjectQueue } from '@nestjs/bullmq';
import { Injectable } from '@nestjs/common';
import type { Queue } from 'bullmq';

import { PrismaService } from '../prisma/prisma.service.js';
import { CRAWL_QUEUE, EXTRACT_QUEUE, VERIFY_QUEUE } from '../queues.js';

const PRICE_PER_MILLION: Record<string, { input: number; output: number }> = {
  'claude-haiku-5-5': { input: 0.1, output: 0.5 },
  'claude-opus-5-5': { input: 4, output: 20 },
};

type UsageRow = { model: string; inputTokens: number; outputTokens: number };

function dollars(rows: UsageRow[]): number {
  const total = rows.reduce((sum, row) => {
    const price = PRICE_PER_MILLION[row.model] ?? PRICE_PER_MILLION['claude-opus-5-5'];
    return sum + (row.inputTokens * price.input + row.outputTokens * price.output) / 1_000_000;
  }, 0);
  return Math.round(total * 100) / 100;
}

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

    const [liveListings, underReview, needsReview, pagesWaiting, pagesFailed, sources, sourcesWithErrors, usageToday, usageTotal] =
      await Promise.all([
        this.prisma.scholarship.count({ where: live }),
        this.prisma.scholarship.count({ where: { ...live, status: 'UNDER_REVIEW' } }),
        this.prisma.extractedOpportunity.count({ where: { status: 'NEEDS_REVIEW' } }),
        this.prisma.rawPage.count({ where: { extractionStatus: 'PENDING' } }),
        this.prisma.rawPage.count({ where: { extractionStatus: 'FAILED' } }),
        this.prisma.source.count({ where: { isActive: true } }),
        this.prisma.source.count({ where: { isActive: true, lastError: { not: null } } }),
        this.prisma.llmUsage.findMany({ where: { createdAt: { gte: startOfDay } }, select: { model: true, inputTokens: true, outputTokens: true } }),
        this.prisma.llmUsage.findMany({ select: { model: true, inputTokens: true, outputTokens: true } }),
      ]);

    const queue = async (q: Queue) => ({ ...(await q.getJobCounts('waiting', 'active', 'failed')), paused: await q.isPaused() });

    return {
      listings: { live: liveListings, underReview, needsReview },
      pages: { waiting: pagesWaiting, failed: pagesFailed },
      sources: { active: sources, withErrors: sourcesWithErrors },
      queues: { crawl: await queue(this.crawlQueue), extract: await queue(this.extractQueue), verify: await queue(this.verifyQueue) },
      claudeSpend: { todayUsd: dollars(usageToday), totalUsd: dollars(usageTotal) },
    };
  }
}
