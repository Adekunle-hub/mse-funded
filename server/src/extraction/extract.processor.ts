import Anthropic from '@anthropic-ai/sdk';
import { InjectQueue, Processor, WorkerHost } from '@nestjs/bullmq';
import { Logger } from '@nestjs/common';
import type { Job, Queue } from 'bullmq';

import { EXTRACT_QUEUE, type ExtractJob } from '../queues.js';
import { ExtractionService, type ExtractionResult } from './extraction.service.js';

export function isOutOfCredit(error: unknown): boolean {
  return error instanceof Anthropic.BadRequestError && /credit balance/i.test(error.message);
}

@Processor(EXTRACT_QUEUE, { concurrency: 2, limiter: { max: 30, duration: 60_000 } })
export class ExtractProcessor extends WorkerHost {
  private readonly logger = new Logger(ExtractProcessor.name);

  constructor(
    private readonly extraction: ExtractionService,
    @InjectQueue(EXTRACT_QUEUE) private readonly extractQueue: Queue<ExtractJob>,
  ) {
    super();
  }

  async process(job: Job<ExtractJob>): Promise<ExtractionResult> {
    try {
      return await this.extraction.extract(job.data.rawPageId);
    } catch (error) {
      if (isOutOfCredit(error)) {
        await this.extractQueue.pause();
        this.logger.error('Anthropic credit has run out. Extraction is paused. Top up, then run npm run extract to resume.');
        throw error;
      }
      if (error instanceof Anthropic.BadRequestError) {
        await this.extraction.markFailed(job.data.rawPageId, error.message);
        return { status: 'FAILED', opportunities: 0 };
      }
      throw error;
    }
  }
}
