import Anthropic from '@anthropic-ai/sdk';
import { BullModule } from '@nestjs/bullmq';
import { Module } from '@nestjs/common';
import { ConfigService } from '@nestjs/config';

import type { Env } from '../config/env.js';
import { EXTRACT_QUEUE } from '../queues.js';
import { ExtractProcessor } from './extract.processor.js';
import { ExtractionService } from './extraction.service.js';

@Module({
  imports: [BullModule.registerQueue({ name: EXTRACT_QUEUE })],
  providers: [
    {
      provide: Anthropic,
      inject: [ConfigService],
      useFactory: (config: ConfigService<Env, true>) =>
        new Anthropic({ apiKey: config.get('ANTHROPIC_API_KEY', { infer: true }) || null }),
    },
    ExtractionService,
    ExtractProcessor,
  ],
  exports: [ExtractionService],
})
export class ExtractionModule {}
