import { Processor, WorkerHost } from '@nestjs/bullmq';
import type { Job } from 'bullmq';

import { VERIFY_QUEUE, type RecheckJob, type VerifyJob } from '../queues.js';
import { TemporaryLinkError, VerificationService } from './verification.service.js';

@Processor(VERIFY_QUEUE, { concurrency: 1, limiter: { max: 1, duration: 2_000 } })
export class VerifyProcessor extends WorkerHost {
  constructor(private readonly verification: VerificationService) {
    super();
  }

  async process(job: Job<VerifyJob | RecheckJob>) {
    const lastAttempt = job.attemptsMade + 1 >= (job.opts.attempts ?? 1);

    if ('scholarshipId' in job.data) {
      try {
        return await this.verification.recheck(job.data.scholarshipId);
      } catch (error) {
        if (error instanceof TemporaryLinkError && lastAttempt) return 'UNCHANGED';
        throw error;
      }
    }

    try {
      return await this.verification.verify(job.data.opportunityId);
    } catch (error) {
      if (error instanceof TemporaryLinkError && lastAttempt) {
        await this.verification.markNeedsReview(job.data.opportunityId, error.message);
        return 'NEEDS_REVIEW';
      }
      throw error;
    }
  }
}
