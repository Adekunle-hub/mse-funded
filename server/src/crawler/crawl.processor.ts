import { Processor, WorkerHost } from '@nestjs/bullmq';
import { Logger } from '@nestjs/common';
import type { Job } from 'bullmq';

import { CRAWL_QUEUE, type CrawlJob } from '../queues.js';
import { SourcesService, type CrawlResult } from '../sources/sources.service.js';
import { CrawlerService } from './crawler.service.js';

export type CrawlOutcome = { saved: boolean; discovered: number; error: string | null };

export function isTemporaryFailure({ status, robotsAllowed }: CrawlResult): boolean {
  if (robotsAllowed === false) return false;
  return status === null || status === 429 || status >= 500;
}

@Processor(CRAWL_QUEUE, { concurrency: 1, limiter: { max: 1, duration: 2_000 } })
export class CrawlProcessor extends WorkerHost {
  private readonly logger = new Logger(CrawlProcessor.name);

  constructor(
    private readonly crawler: CrawlerService,
    private readonly sources: SourcesService,
  ) {
    super();
  }

  async process(job: Job<CrawlJob>): Promise<CrawlOutcome> {
    const source = await this.sources.findById(job.data.sourceId);
    if (!source?.isActive) return { saved: false, discovered: 0, error: 'Source is missing or inactive' };

    const { result, saved, discovered } = await this.crawler.crawlSource(source);
    await this.sources.recordCrawl(source.id, result);

    if (result.error) {
      const retry = isTemporaryFailure(result);
      this.logger.warn(`${source.name}: ${result.error}${retry ? `, attempt ${job.attemptsMade + 1}` : ''}`);
      if (retry) throw new Error(result.error);
    }

    return { saved, discovered, error: result.error };
  }
}
