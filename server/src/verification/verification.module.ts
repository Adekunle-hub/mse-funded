import { BullModule } from '@nestjs/bullmq';
import { Module } from '@nestjs/common';

import { runWorkers } from '../config/jobs.js';
import { VERIFY_QUEUE } from '../queues.js';
import { WebsiteModule } from '../website/website.module.js';
import { VerificationService } from './verification.service.js';
import { VerifyProcessor } from './verify.processor.js';

@Module({
  imports: [BullModule.registerQueue({ name: VERIFY_QUEUE }), WebsiteModule],
  providers: [VerificationService, ...(runWorkers ? [VerifyProcessor] : [])],
  exports: [VerificationService],
})
export class VerificationModule {}
