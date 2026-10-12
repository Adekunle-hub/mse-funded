import { ApiError } from '@google/genai';
import { Processor, WorkerHost } from '@nestjs/bullmq';
import type { Job } from 'bullmq';

import { EXTRACT_QUEUE, type ExtractJob } from '../queues.js';
import { ExtractionService, type ExtractionResult } from './extraction.service.js';

export function isPageProblem(error: unknown): boolean {
  return error instanceof ApiError && error.status === 400 && !/api key/i.test(error.message);
}

@Processor(EXTRACT_QUEUE, { concurrency: 1, limiter: { max: 8, duration: 60_000 } })
export class ExtractProcessor extends WorkerHost {
  constructor(private readonly extraction: ExtractionService) {
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
      throw error;
    }
  }
}
