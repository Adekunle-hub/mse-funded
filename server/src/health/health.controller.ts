import { setTimeout as sleep } from 'node:timers/promises';

import { InjectQueue } from '@nestjs/bullmq';
import { Controller, Get, ServiceUnavailableException } from '@nestjs/common';
import { SkipThrottle } from '@nestjs/throttler';
import type { Queue } from 'bullmq';

import { PrismaService } from '../prisma/prisma.service.js';
import { CRAWL_QUEUE } from '../queues.js';

@SkipThrottle()
@Controller('health')
export class HealthController {
  constructor(
    private readonly prisma: PrismaService,
    @InjectQueue(CRAWL_QUEUE) private readonly crawlQueue: Queue,
  ) {}

  @Get()
  async check() {
    const [databaseUp, redisUp] = await Promise.all([this.prisma.isHealthy(), this.redisIsUp()]);
    const result = { database: databaseUp ? 'up' : 'down', redis: redisUp ? 'up' : 'down' };

    if (!databaseUp || !redisUp) throw new ServiceUnavailableException({ status: 'error', ...result });
    return { status: 'ok', ...result };
  }

  private redisIsUp(): Promise<boolean> {
    const check = this.crawlQueue
      .getWaitingCount()
      .then(() => true)
      .catch(() => false);
    return Promise.race([check, sleep(2_000, false)]);
  }
}
