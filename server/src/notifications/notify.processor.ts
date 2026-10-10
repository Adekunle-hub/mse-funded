import { Processor, WorkerHost } from '@nestjs/bullmq';
import type { Job } from 'bullmq';

import { NOTIFY_QUEUE, type NotifyJob } from '../queues.js';
import { RemindersService } from './reminders.service.js';

@Processor(NOTIFY_QUEUE, { concurrency: 2 })
export class NotifyProcessor extends WorkerHost {
  constructor(private readonly reminders: RemindersService) {
    super();
  }

  async process(job: Job<NotifyJob>) {
    try {
      return await this.reminders.send(job.data.reminderId);
    } catch (error) {
      const final = job.attemptsMade + 1 >= (job.opts.attempts ?? 1);
      await this.reminders.recordFailure(job.data.reminderId, error instanceof Error ? error.message : String(error), final);
      if (final) return 'FAILED';
      throw error;
    }
  }
}
