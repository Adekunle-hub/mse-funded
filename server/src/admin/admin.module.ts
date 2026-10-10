import { BullModule } from '@nestjs/bullmq';
import { Module } from '@nestjs/common';

import { CRAWL_QUEUE, EXTRACT_QUEUE, VERIFY_QUEUE } from '../queues.js';
import { UsersModule } from '../users/users.module.js';
import { AdminController } from './admin.controller.js';
import { AdminGuard } from './admin.guard.js';
import { AdminService } from './admin.service.js';

@Module({
  imports: [UsersModule, BullModule.registerQueue({ name: CRAWL_QUEUE }, { name: EXTRACT_QUEUE }, { name: VERIFY_QUEUE })],
  controllers: [AdminController],
  providers: [AdminService, AdminGuard],
  exports: [AdminGuard],
})
export class AdminModule {}
