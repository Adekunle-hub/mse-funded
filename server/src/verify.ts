import { getQueueToken } from '@nestjs/bullmq';
import { NestFactory } from '@nestjs/core';
import type { Queue } from 'bullmq';

import { AppModule } from './app.module.js';
import { VERIFY_QUEUE } from './queues.js';
import { waitForQueue } from './wait-for-queue.js';
import { VerificationService } from './verification/verification.service.js';

const app = await NestFactory.createApplicationContext(AppModule);
const queue = app.get<Queue>(getQueueToken(VERIFY_QUEUE));

console.log(`Queued ${await app.get(VerificationService).enqueuePending()} opportunities`);
console.log(`Queue ${await waitForQueue(queue, 20)}`);
console.log(await queue.getJobCounts('completed', 'failed', 'delayed'));
await app.close();
