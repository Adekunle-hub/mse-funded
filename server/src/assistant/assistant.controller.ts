import { ApiError } from '@google/genai';
import {
  Body,
  Controller,
  Delete,
  Get,
  HttpCode,
  HttpException,
  HttpStatus,
  Param,
  ParseUUIDPipe,
  Post,
  Req,
  Res,
  UploadedFile,
  UseGuards,
  UseInterceptors,
} from '@nestjs/common';
import { FileInterceptor } from '@nestjs/platform-express';
import { Throttle } from '@nestjs/throttler';
import type { Request, Response } from 'express';

import { AuthGuard } from '../auth/auth.guard.js';
import { CurrentUserId } from '../auth/current-user-id.decorator.js';
import { AssistantService, DAILY_MESSAGE_LIMIT } from './assistant.service.js';
import { MessageDto } from './dto/message.dto.js';

const MAX_FILE_BYTES = 5_000_000;

function aiProblem(error: unknown): HttpException {
  if (error instanceof ApiError && (error.status === 429 || error.status === 503)) {
    return new HttpException('The assistant is busy right now. Please try again in a few minutes.', HttpStatus.SERVICE_UNAVAILABLE);
  }
  return new HttpException('The assistant could not answer. Please try again.', HttpStatus.BAD_GATEWAY);
}

@UseGuards(AuthGuard)
@Controller('assistant')
export class AssistantController {
  constructor(private readonly assistant: AssistantService) {}

  @Get('conversations')
  async list(@CurrentUserId() userId: string) {
    const [conversations, messagesLeft] = await Promise.all([
      this.assistant.conversations(userId),
      this.assistant.messagesLeftToday(userId),
    ]);
    return { conversations, messagesLeft, dailyLimit: DAILY_MESSAGE_LIMIT };
  }

  @Post('conversations')
  create(@CurrentUserId() userId: string, @Body() dto: MessageDto) {
    return this.assistant.create(userId, dto.message);
  }

  @Get('conversations/:id')
  show(@CurrentUserId() userId: string, @Param('id', ParseUUIDPipe) id: string) {
    return this.assistant.conversation(userId, id);
  }

  @Delete('conversations/:id')
  @HttpCode(204)
  remove(@CurrentUserId() userId: string, @Param('id', ParseUUIDPipe) id: string) {
    return this.assistant.remove(userId, id);
  }

  @Throttle({ default: { limit: 10, ttl: 60_000 } })
  @Post('conversations/:id/messages')
  @HttpCode(200)
  @UseInterceptors(FileInterceptor('file', { limits: { fileSize: MAX_FILE_BYTES } }))
  async send(
    @CurrentUserId() userId: string,
    @Param('id', ParseUUIDPipe) id: string,
    @Body() dto: MessageDto,
    @UploadedFile() file: { originalname: string; buffer: Buffer } | undefined,
    @Req() request: Request,
    @Res() response: Response,
  ) {
    const attachment = file ? { name: file.originalname, buffer: file.buffer } : null;
    let reply: AsyncGenerator<string>;
    try {
      reply = await this.assistant.send(userId, id, dto.message.trim(), attachment);
    } catch (error) {
      throw error instanceof HttpException ? error : aiProblem(error);
    }

    let closed = false;
    request.on('close', () => (closed = true));
    response.set({ 'Content-Type': 'text/plain; charset=utf-8', 'Cache-Control': 'no-cache', 'X-Accel-Buffering': 'no' });
    response.flushHeaders();

    try {
      for await (const text of reply) {
        if (closed) break;
        response.write(text);
      }
    } catch {
      response.write('\n\n_Sorry, the answer was cut off. Please ask again._');
    }
    response.end();
  }
}
