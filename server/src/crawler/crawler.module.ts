import { BullModule } from '@nestjs/bullmq';
import { Module } from '@nestjs/common';

import { runWorkers } from '../config/jobs.js';
import { CRAWL_QUEUE, EXTRACT_QUEUE } from '../queues.js';
import { SourcesModule } from '../sources/sources.module.js';
import { CrawlProcessor } from './crawl.processor.js';
import { CrawlerService } from './crawler.service.js';

@Module({
  imports: [SourcesModule, BullModule.registerQueue({ name: CRAWL_QUEUE }, { name: EXTRACT_QUEUE })],
  providers: [CrawlerService, ...(runWorkers ? [CrawlProcessor] : [])],
  exports: [CrawlerService],
})
export class CrawlerModule {}
