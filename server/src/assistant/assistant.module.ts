import { GoogleGenAI } from '@google/genai';
import { Module } from '@nestjs/common';
import { ConfigService } from '@nestjs/config';

import type { Env } from '../config/env.js';
import { AssistantController } from './assistant.controller.js';
import { AssistantService } from './assistant.service.js';

@Module({
  controllers: [AssistantController],
  providers: [
    AssistantService,
    {
      provide: GoogleGenAI,
      inject: [ConfigService],
      useFactory: (config: ConfigService<Env, true>) =>
        new GoogleGenAI({ apiKey: config.get('GEMINI_API_KEY', { infer: true }) || undefined }),
    },
  ],
})
export class AssistantModule {}
