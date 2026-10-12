import { InjectQueue } from '@nestjs/bullmq';
import { Injectable, Logger } from '@nestjs/common';
import { ConfigService } from '@nestjs/config';
import { Cron } from '@nestjs/schedule';
import type { Queue } from 'bullmq';

import type { Env } from '../config/env.js';
import { botUserAgent } from '../crawler/user-agent.js';
import type { Opportunity } from '../extraction/extraction.schema.js';
import type { ExtractedOpportunity, ReviewStatus } from '../generated/prisma/client.js';
import { PrismaService } from '../prisma/prisma.service.js';
import { VERIFY_QUEUE, type RecheckJob, type VerifyJob } from '../queues.js';
import { WebsiteService } from '../website/website.service.js';
import { toScholarship } from './listing.js';

const TIMEOUT_MS = 15_000;

type LinkCheck = 'ok' | 'broken' | 'unconfirmed' | 'temporary';

export type RecheckResult = 'CHECKED' | 'REMOVED' | 'UNCHANGED' | 'MISSING';

export class TemporaryLinkError extends Error {}

export type ReviewChanges = { officialUrl?: string; deadline?: Date | null };

@Injectable()
export class VerificationService {
  private readonly logger = new Logger(VerificationService.name);
  private readonly userAgent: string;

  constructor(
    private readonly prisma: PrismaService,
    @InjectQueue(VERIFY_QUEUE) private readonly verifyQueue: Queue<VerifyJob | RecheckJob>,
    private readonly website: WebsiteService,
    config: ConfigService<Env, true>,
  ) {
    this.userAgent = botUserAgent(config.get('CLIENT_ORIGIN', { infer: true })[0]);
  }

  @Cron('*/15 * * * *')
  async enqueuePending(): Promise<number> {
    const pending = await this.prisma.extractedOpportunity.findMany({ where: { status: 'PENDING' }, select: { id: true } });

    for (const { id } of pending) {
      await this.verifyQueue.add(
        'verify',
        { opportunityId: id },
        { deduplication: { id }, attempts: 3, backoff: { type: 'exponential', delay: 60_000 } },
      );
    }

    if (pending.length > 0) this.logger.log(`Queued ${pending.length} opportunities for verification`);
    return pending.length;
  }

  async verify(opportunityId: string): Promise<ReviewStatus | 'MISSING'> {
    const row = await this.prisma.extractedOpportunity.findUnique({ where: { id: opportunityId } });
    if (!row) return 'MISSING';
    if (row.status !== 'PENDING') return row.status;

    const opportunity = row.data as unknown as Opportunity;

    if (row.deadline && row.deadline < new Date()) return this.finish(row.id, 'REJECTED', 'The deadline has passed');
    if (opportunity.materialsFocus === 'unrelated') return this.finish(row.id, 'REJECTED', 'Not a materials science opportunity');
    if (opportunity.openToNigerians === false) return this.finish(row.id, 'REJECTED', 'Not open to Nigerian applicants');

    let officialUrl = opportunity.officialUrl ?? '';
    let link = await this.checkLink(officialUrl);

    if (link === 'unconfirmed' || link === 'broken') {
      const page = await this.prisma.rawPage.findUniqueOrThrow({ where: { id: row.rawPageId } });
      const pageUrl = page.finalUrl ?? page.url;
      if (pageUrl !== officialUrl && (await this.checkLink(pageUrl)) === 'ok') {
        officialUrl = pageUrl;
        link = 'ok';
      }
    }

    if (link === 'temporary') throw new TemporaryLinkError(`Could not reach ${officialUrl}`);
    if (link === 'broken') return this.finish(row.id, 'REJECTED', 'The official link is broken');
    if (link === 'unconfirmed') return this.finish(row.id, 'NEEDS_REVIEW', 'The official link could not be opened');

    return this.publish(row, { ...opportunity, officialUrl }, row.deadline);
  }

  async approve(opportunityId: string, changes: ReviewChanges): Promise<ReviewStatus | 'MISSING'> {
    const row = await this.prisma.extractedOpportunity.findUnique({ where: { id: opportunityId } });
    if (!row || row.status !== 'NEEDS_REVIEW') return 'MISSING';

    const opportunity = row.data as unknown as Opportunity;
    const officialUrl = changes.officialUrl ?? opportunity.officialUrl ?? '';
    const deadline = changes.deadline === undefined ? row.deadline : changes.deadline;
    return this.publish(row, { ...opportunity, officialUrl }, deadline);
  }

  async reject(opportunityId: string): Promise<ReviewStatus | 'MISSING'> {
    const row = await this.prisma.extractedOpportunity.findUnique({ where: { id: opportunityId }, select: { status: true } });
    if (!row || row.status !== 'NEEDS_REVIEW') return 'MISSING';
    return this.finish(opportunityId, 'REJECTED', 'Rejected by an admin');
  }

  private async publish(row: ExtractedOpportunity, opportunity: Opportunity, deadline: Date | null): Promise<ReviewStatus> {
    const listing = toScholarship(row, opportunity, deadline);
    const existing = await this.prisma.scholarship.findFirst({
      where: {
        OR: [{ slug: listing.slug }, { funder: listing.funder, name: listing.name, intakeYear: listing.intakeYear }],
      },
      select: { id: true },
    });

    if (existing) {
      await this.prisma.$transaction([
        this.prisma.scholarship.update({ where: { id: existing.id }, data: { verifiedAt: new Date() } }),
        this.prisma.extractedOpportunity.update({
          where: { id: row.id },
          data: { status: 'MERGED', scholarshipId: existing.id, note: 'Same listing is already on the site' },
        }),
      ]);
      await this.website.refreshListings();
      return 'MERGED';
    }

    const created = await this.prisma.scholarship.create({ data: listing, select: { id: true } });
    await this.prisma.extractedOpportunity.update({
      where: { id: row.id },
      data: { status: 'PUBLISHED', scholarshipId: created.id, note: listing.reviewNote },
    });
    this.logger.log(`Published ${listing.name} (${listing.institution})`);
    await this.website.refreshListings();
    return 'PUBLISHED';
  }

  @Cron('0 5 * * *')
  async enqueueRecheck(): Promise<number> {
    const live = await this.prisma.scholarship.findMany({
      where: {
        status: { in: ['PUBLISHED', 'UNDER_REVIEW'] },
        OR: [{ deadline: null }, { deadline: { gte: new Date() } }],
      },
      select: { id: true },
    });

    for (const { id } of live) {
      await this.verifyQueue.add(
        'recheck',
        { scholarshipId: id },
        { deduplication: { id: `recheck:${id}` }, attempts: 2, backoff: { type: 'exponential', delay: 60_000 } },
      );
    }

    if (live.length > 0) this.logger.log(`Queued ${live.length} live listings for their daily check`);
    return live.length;
  }

  async recheck(scholarshipId: string): Promise<RecheckResult> {
    const listing = await this.prisma.scholarship.findUnique({ where: { id: scholarshipId } });
    if (!listing || (listing.status !== 'PUBLISHED' && listing.status !== 'UNDER_REVIEW')) return 'MISSING';

    const link = await this.checkLink(listing.officialUrl);
    if (link === 'temporary') throw new TemporaryLinkError(`Could not reach ${listing.officialUrl}`);
    if (link === 'unconfirmed') return 'UNCHANGED';

    if (link === 'broken') {
      await this.prisma.scholarship.update({
        where: { id: listing.id },
        data: { status: 'REJECTED', reviewNote: 'The official link stopped working' },
      });
      await this.website.refreshListings();
      this.logger.warn(`Removed ${listing.name}: the official link stopped working`);
      return 'REMOVED';
    }

    await this.prisma.scholarship.update({ where: { id: listing.id }, data: { verifiedAt: new Date() } });
    return 'CHECKED';
  }

  async markNeedsReview(opportunityId: string, note: string): Promise<void> {
    await this.finish(opportunityId, 'NEEDS_REVIEW', note);
  }

  private async checkLink(url: string): Promise<LinkCheck> {
    try {
      const response = await fetch(url, {
        headers: { 'User-Agent': this.userAgent },
        signal: AbortSignal.timeout(TIMEOUT_MS),
      });
      await response.body?.cancel();

      if (response.ok) return 'ok';
      if (response.status === 404 || response.status === 410) return 'broken';
      if (response.status === 429 || response.status >= 500) return 'temporary';
      return 'unconfirmed';
    } catch {
      return 'temporary';
    }
  }

  private async finish(id: string, status: ReviewStatus, note: string): Promise<ReviewStatus> {
    await this.prisma.extractedOpportunity.update({ where: { id }, data: { status, note } });
    return status;
  }
}
