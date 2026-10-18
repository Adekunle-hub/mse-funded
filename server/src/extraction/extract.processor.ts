import { ApiError } from '@google/genai';
import { InjectQueue, Processor, WorkerHost } from '@nestjs/bullmq';
import { Logger } from '@nestjs/common';
import type { Job, Queue } from 'bullmq';

import { EXTRACT_QUEUE, type ExtractJob } from '../queues.js';
import { ExtractionService, type ExtractionResult } from './extraction.service.js';

export function isPageProblem(error: unknown): boolean {
  return error instanceof ApiError && error.status === 400 && !/api key/i.test(error.message);
}

export function isDailyLimit(error: unknown): boolean {
  return error instanceof ApiError && error.status === 429 && /PerDay/i.test(error.message);
}

@Processor(EXTRACT_QUEUE, { concurrency: 1, limiter: { max: 8, duration: 60_000 } })
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
      if (isPageProblem(error)) {
        await this.extraction.markFailed(job.data.rawPageId, error instanceof Error ? error.message : String(error));
        return { status: 'FAILED', opportunities: 0 };
      }
      if (isDailyLimit(error)) {
        this.logger.warn('Gemini daily limit reached, pausing reading until the next run');
        await this.extractQueue.pause();
      }
      throw error;
    }
  }
}
