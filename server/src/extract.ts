import { getQueueToken } from '@nestjs/bullmq';
import { NestFactory } from '@nestjs/core';
import type { Queue } from 'bullmq';

import { AppModule } from './app.module.js';
import { ExtractionService } from './extraction/extraction.service.js';
import { EXTRACT_QUEUE } from './queues.js';
import { waitForQueue } from './wait-for-queue.js';

const app = await NestFactory.createApplicationContext(AppModule);
const queue = app.get<Queue>(getQueueToken(EXTRACT_QUEUE));

console.log(`Queued ${await app.get(ExtractionService).enqueuePending()} pages`);
console.log(`Queue ${await waitForQueue(queue, 50)}`);
console.log(await queue.getJobCounts('completed', 'failed', 'delayed'));
await app.close();
