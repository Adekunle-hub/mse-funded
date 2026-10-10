import { BullModule } from '@nestjs/bullmq';
import { Module } from '@nestjs/common';
import { ConfigService } from '@nestjs/config';
import { APP_GUARD } from '@nestjs/core';
import { ScheduleModule } from '@nestjs/schedule';
import { ThrottlerGuard, ThrottlerModule } from '@nestjs/throttler';

import { AdminModule } from './admin/admin.module.js';
import { AuthModule } from './auth/auth.module.js';
import { AppConfigModule } from './config/app-config.module.js';
import type { Env } from './config/env.js';
import { runSchedules } from './config/jobs.js';
import { CrawlerModule } from './crawler/crawler.module.js';
import { DiscoveryModule } from './discovery/discovery.module.js';
import { ExtractionModule } from './extraction/extraction.module.js';
import { HealthModule } from './health/health.module.js';
import { NotificationsModule } from './notifications/notifications.module.js';
import { PrismaModule } from './prisma/prisma.module.js';
import { SavedModule } from './saved/saved.module.js';
import { ScholarshipsModule } from './scholarships/scholarships.module.js';
import { SourcesModule } from './sources/sources.module.js';
import { UsersModule } from './users/users.module.js';
import { VerificationModule } from './verification/verification.module.js';

@Module({
  imports: [
    AppConfigModule,
    ThrottlerModule.forRoot([{ ttl: 60_000, limit: 120 }]),
    ...(runSchedules ? [ScheduleModule.forRoot()] : []),
    BullModule.forRootAsync({
      inject: [ConfigService],
      useFactory: (config: ConfigService<Env, true>) => ({
        connection: { url: config.get('REDIS_URL', { infer: true }) },
        prefix: config.get('QUEUE_PREFIX', { infer: true }),
        defaultJobOptions: { removeOnComplete: { count: 1000 }, removeOnFail: { count: 5000 } },
      }),
    }),
    PrismaModule,
    HealthModule,
    UsersModule,
    AuthModule,
    AdminModule,
    ScholarshipsModule,
    SavedModule,
    SourcesModule,
    CrawlerModule,
    DiscoveryModule,
    ExtractionModule,
    VerificationModule,
    NotificationsModule,
  ],
  providers: [{ provide: APP_GUARD, useClass: ThrottlerGuard }],
})
export class AppModule {}
