import { BullModule } from '@nestjs/bullmq';
import { Module } from '@nestjs/common';

import { CRAWL_QUEUE } from '../queues.js';
import { HealthController } from './health.controller.js';

@Module({
  imports: [BullModule.registerQueue({ name: CRAWL_QUEUE })],
  controllers: [HealthController],
})
export class HealthModule {}
