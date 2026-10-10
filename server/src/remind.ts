import { setTimeout as sleep } from 'node:timers/promises';

import { getQueueToken } from '@nestjs/bullmq';
import { NestFactory } from '@nestjs/core';
import type { Queue } from 'bullmq';

import { AppModule } from './app.module.js';
import { RemindersService } from './notifications/reminders.service.js';
import { NOTIFY_QUEUE } from './queues.js';

const app = await NestFactory.createApplicationContext(AppModule);
const queue = app.get<Queue>(getQueueToken(NOTIFY_QUEUE));

console.log(`Queued ${await app.get(RemindersService).queueDueReminders()} reminders`);
while ((await queue.getWaitingCount()) + (await queue.getActiveCount()) > 0) {
  await sleep(2_000);
}
console.log(await queue.getJobCounts('completed', 'failed', 'delayed'));
await app.close();
