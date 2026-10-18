import { getQueueToken } from '@nestjs/bullmq';
import { NestFactory } from '@nestjs/core';
import type { Queue } from 'bullmq';

import { AppModule } from './app.module.js';
import { CrawlerService } from './crawler/crawler.service.js';
import { CRAWL_QUEUE } from './queues.js';
import { waitForQueue } from './wait-for-queue.js';

const app = await NestFactory.createApplicationContext(AppModule);
const queue = app.get<Queue>(getQueueToken(CRAWL_QUEUE));

console.log(`Queued ${await app.get(CrawlerService).enqueueDueSources()} sources`);
console.log(`Queue ${await waitForQueue(queue, 35)}`);
console.log(await queue.getJobCounts('completed', 'failed', 'delayed'));
await app.close();
