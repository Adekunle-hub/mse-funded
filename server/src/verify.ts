import { setTimeout as sleep } from 'node:timers/promises';

import { getQueueToken } from '@nestjs/bullmq';
import { NestFactory } from '@nestjs/core';
import type { Queue } from 'bullmq';

import { AppModule } from './app.module.js';
import { VERIFY_QUEUE } from './queues.js';
import { VerificationService } from './verification/verification.service.js';

const app = await NestFactory.createApplicationContext(AppModule);
const queue = app.get<Queue>(getQueueToken(VERIFY_QUEUE));

console.log(`Queued ${await app.get(VerificationService).enqueuePending()} opportunities`);
while ((await queue.getWaitingCount()) + (await queue.getActiveCount()) > 0) {
  await sleep(2_000);
}
console.log(await queue.getJobCounts('completed', 'failed', 'delayed'));
await app.close();
