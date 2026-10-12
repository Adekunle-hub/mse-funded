import { createHash } from 'node:crypto';

import { InjectQueue } from '@nestjs/bullmq';
import { Injectable, Logger } from '@nestjs/common';
import { ConfigService } from '@nestjs/config';
import { Cron } from '@nestjs/schedule';
import type { Queue } from 'bullmq';

import type { Env } from '../config/env.js';
import { mentionsFundedStudy, NO_FUNDED_STUDY, pageText } from '../extraction/page-text.js';
import type { Source } from '../generated/prisma/client.js';
import { PrismaService } from '../prisma/prisma.service.js';
import { CRAWL_QUEUE, EXTRACT_QUEUE, type CrawlJob, type ExtractJob } from '../queues.js';
import { SourcesService, type CrawlResult } from '../sources/sources.service.js';
import { findPostLinks } from './links.js';
import { needsReader, READER_CONTENT_TYPE, readWithJina } from './reader.js';
import { checkRobots } from './robots.js';
import { botUserAgent } from './user-agent.js';

const TIMEOUT_MS = 15_000;
const MAX_BODY_CHARS = 2_000_000;
const ALLOWED_CONTENT_TYPES = ['text/html', 'application/xhtml+xml', 'application/xml', 'text/xml', 'application/rss+xml'];

export type SourceCrawl = { result: CrawlResult; saved: boolean; discovered: number };

@Injectable()
export class CrawlerService {
  private readonly logger = new Logger(CrawlerService.name);
  private readonly userAgent: string;
  private readonly jinaKey: string | undefined;

  constructor(
    private readonly prisma: PrismaService,
    private readonly sources: SourcesService,
    @InjectQueue(CRAWL_QUEUE) private readonly crawlQueue: Queue<CrawlJob>,
    @InjectQueue(EXTRACT_QUEUE) private readonly extractQueue: Queue<ExtractJob>,
    config: ConfigService<Env, true>,
  ) {
    const site = config.get('CLIENT_ORIGIN', { infer: true })[0];
    this.userAgent = botUserAgent(site);
    this.jinaKey = config.get('JINA_API_KEY', { infer: true }) || undefined;
  }

  @Cron('*/15 * * * *')
  async enqueueDueSources(): Promise<number> {
    const due = await this.sources.findDue();

    for (const source of due) {
      await this.crawlQueue.add(
        'crawl',
        { sourceId: source.id },
        {
          deduplication: { id: source.id },
          attempts: 4,
          backoff: { type: 'exponential', delay: 60_000 },
        },
      );
    }

    if (due.length > 0) this.logger.log(`Queued ${due.length} sources for crawling`);
    return due.length;
  }

  async crawlSource(source: Source): Promise<SourceCrawl> {
    const robots = await checkRobots(source.url, this.userAgent, TIMEOUT_MS);
    if (robots === 'blocked') return this.failure(null, 'Blocked by robots.txt', false);
    if (robots === 'unreachable') return this.failure(null, 'robots.txt could not be loaded', null);

    try {
      const response = await fetch(source.url, {
        headers: { 'User-Agent': this.userAgent, Accept: 'text/html,application/xhtml+xml,application/xml' },
        signal: AbortSignal.timeout(TIMEOUT_MS),
      });

      const contentType = response.headers.get('content-type') ?? '';
      if (!response.ok) return this.failure(response.status, `HTTP ${response.status}`, true);
      if (!ALLOWED_CONTENT_TYPES.some((type) => contentType.includes(type))) {
        return this.failure(response.status, `Unsupported content type ${contentType}`, true);
      }

      const html = await response.text();
      if (html.length > MAX_BODY_CHARS) return this.failure(response.status, 'Page is larger than 2 MB', true);

      const readerText = needsReader(html) ? await readWithJina(response.url, this.jinaKey) : null;
      const body = readerText ?? html;
      const worthReading = mentionsFundedStudy(readerText ?? pageText(html));

      const [page] = await this.prisma.rawPage.createManyAndReturn({
        data: {
          sourceId: source.id,
          url: source.url,
          finalUrl: response.url,
          httpStatus: response.status,
          contentType: readerText ? READER_CONTENT_TYPE : contentType,
          contentHash: createHash('sha256').update(body).digest('hex'),
          body,
          ...(worthReading
            ? {}
            : { extractionStatus: 'NOT_A_SCHOLARSHIP', extractionError: NO_FUNDED_STUDY, extractedAt: new Date() }),
        },
        skipDuplicates: true,
        select: { id: true },
      });

      if (page && worthReading) {
        await this.extractQueue.add(
          'extract',
          { rawPageId: page.id },
          { deduplication: { id: page.id }, attempts: 3, backoff: { type: 'exponential', delay: 60_000 } },
        );
      }

      const discovered =
        source.kind === 'LISTING' ? await this.sources.addDiscovered(findPostLinks(html, response.url), 'LISTING') : 0;

      return { result: { status: response.status, error: null, robotsAllowed: true }, saved: Boolean(page), discovered };
    } catch (error) {
      const message = error instanceof Error ? error.message : String(error);
      return this.failure(null, message, true);
    }
  }

  private failure(status: number | null, error: string, robotsAllowed: boolean | null): SourceCrawl {
    return { result: { status, error, robotsAllowed }, saved: false, discovered: 0 };
  }
}
