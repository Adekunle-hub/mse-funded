import { GoogleGenAI } from '@google/genai';
import { BullModule } from '@nestjs/bullmq';
import { Module } from '@nestjs/common';
import { ConfigService } from '@nestjs/config';

import type { Env } from '../config/env.js';
import { runWorkers } from '../config/jobs.js';
import { EXTRACT_QUEUE } from '../queues.js';
import { ExtractProcessor } from './extract.processor.js';
import { ExtractionService } from './extraction.service.js';

@Module({
  imports: [BullModule.registerQueue({ name: EXTRACT_QUEUE })],
  providers: [
    {
      provide: GoogleGenAI,
      inject: [ConfigService],
      useFactory: (config: ConfigService<Env, true>) =>
        new GoogleGenAI({ apiKey: config.get('GEMINI_API_KEY', { infer: true }) || undefined }),
    },
    ExtractionService,
    ...(runWorkers ? [ExtractProcessor] : []),
  ],
  exports: [ExtractionService],
})
export class ExtractionModule {}
