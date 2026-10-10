import { setTimeout as sleep } from 'node:timers/promises';

import { getQueueToken } from '@nestjs/bullmq';
import { NestFactory } from '@nestjs/core';
import type { Queue } from 'bullmq';

import { AppModule } from './app.module.js';
import { CrawlerService } from './crawler/crawler.service.js';
import { CRAWL_QUEUE } from './queues.js';

const app = await NestFactory.createApplicationContext(AppModule);
const queue = app.get<Queue>(getQueueToken(CRAWL_QUEUE));

console.log(`Queued ${await app.get(CrawlerService).enqueueDueSources()} sources`);
while ((await queue.getWaitingCount()) + (await queue.getActiveCount()) > 0) {
  await sleep(2_000);
}
console.log(await queue.getJobCounts('completed', 'failed', 'delayed'));
await app.close();
