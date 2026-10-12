import { BullModule } from '@nestjs/bullmq';
import { Module } from '@nestjs/common';

import { CRAWL_QUEUE, EXTRACT_QUEUE, VERIFY_QUEUE } from '../queues.js';
import { ScholarshipsModule } from '../scholarships/scholarships.module.js';
import { UsersModule } from '../users/users.module.js';
import { VerificationModule } from '../verification/verification.module.js';
import { WebsiteModule } from '../website/website.module.js';
import { AdminListingsService } from './admin-listings.service.js';
import { AdminSourcesService } from './admin-sources.service.js';
import { AdminController } from './admin.controller.js';
import { AdminGuard } from './admin.guard.js';
import { AdminService } from './admin.service.js';

@Module({
  imports: [
    UsersModule,
    ScholarshipsModule,
    VerificationModule,
    WebsiteModule,
    BullModule.registerQueue({ name: CRAWL_QUEUE }, { name: EXTRACT_QUEUE }, { name: VERIFY_QUEUE }),
  ],
  controllers: [AdminController],
  providers: [AdminService, AdminListingsService, AdminSourcesService, AdminGuard],
  exports: [AdminGuard],
})
export class AdminModule {}
