import { setTimeout as sleep } from 'node:timers/promises';

import { getQueueToken } from '@nestjs/bullmq';
import { NestFactory } from '@nestjs/core';
import type { Queue } from 'bullmq';

import { AppModule } from './app.module.js';
import { ExtractionService } from './extraction/extraction.service.js';
import { EXTRACT_QUEUE } from './queues.js';

const app = await NestFactory.createApplicationContext(AppModule);
const queue = app.get<Queue>(getQueueToken(EXTRACT_QUEUE));


console.log(`Queued ${await app.get(ExtractionService).enqueuePending()} pages`);
while ((await queue.getWaitingCount()) + (await queue.getActiveCount()) > 0) {
  await sleep(2_000);
}
console.log(await queue.getJobCounts('completed', 'failed', 'delayed'));
await app.close();
