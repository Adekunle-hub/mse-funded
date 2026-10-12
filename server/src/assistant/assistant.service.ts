import { type Content, type GenerateContentResponse, type GenerateContentResponseUsageMetadata, GoogleGenAI } from '@google/genai';
import { HttpException, HttpStatus, Injectable, NotFoundException } from '@nestjs/common';
import { ConfigService } from '@nestjs/config';
import { extractText, getDocumentProxy } from 'unpdf';

import type { Env } from '../config/env.js';
import { PrismaService } from '../prisma/prisma.service.js';
import { ASSISTANT_PROMPT } from './assistant.prompt.js';

export const DAILY_MESSAGE_LIMIT = 40;
const HISTORY_MESSAGES = 20;
const MAX_DOCUMENT_CHARS = 40_000;

export type Attachment = { name: string; buffer: Buffer };
type StoredMessage = { role: string; content: string; attachmentName: string | null; attachmentText: string | null };

export async function readDocument({ name, buffer }: Attachment): Promise<string> {
  const isPdf = buffer.subarray(0, 5).toString() === '%PDF-';
  const text = isPdf
    ? (await extractText(await getDocumentProxy(new Uint8Array(buffer)), { mergePages: true })).text
    : /\.(txt|md)$/i.test(name)
      ? buffer.toString('utf8')
      : null;

  if (text === null) throw new HttpException('Attach a PDF or a .txt file', HttpStatus.BAD_REQUEST);
  const trimmed = text.replace(/\s+\n/g, '\n').trim();
  if (!trimmed) throw new HttpException('We could not find any text in that file. Try pasting it instead.', HttpStatus.BAD_REQUEST);
  return trimmed.slice(0, MAX_DOCUMENT_CHARS);
}

function toContent({ role, content, attachmentName, attachmentText }: StoredMessage): Content {
  const text = attachmentText ? `${content}\n\nAttached document "${attachmentName}":\n"""\n${attachmentText}\n"""` : content;
  return { role: role === 'model' ? 'model' : 'user', parts: [{ text }] };
}

function titleFrom(message: string) {
  const line = message.replace(/\s+/g, ' ').trim();
  return line.length > 60 ? `${line.slice(0, 57)}…` : line || 'New chat';
}

@Injectable()
export class AssistantService {
  private readonly model: string;

  constructor(
    private readonly prisma: PrismaService,
    private readonly ai: GoogleGenAI,
    config: ConfigService<Env, true>,
  ) {
    this.model = config.get('ASSISTANT_MODEL', { infer: true });
  }

  conversations(userId: string) {
    return this.prisma.chatConversation.findMany({
      where: { userId },
      orderBy: { updatedAt: 'desc' },
      take: 50,
      select: { id: true, title: true, updatedAt: true },
    });
  }

  async conversation(userId: string, id: string) {
    const conversation = await this.prisma.chatConversation.findFirst({
      where: { id, userId },
      select: {
        id: true,
        title: true,
        messages: { orderBy: { createdAt: 'asc' }, select: { id: true, role: true, content: true, attachmentName: true, createdAt: true } },
      },
    });
    if (!conversation) throw new NotFoundException('Chat not found');
    return conversation;
  }

  create(userId: string, firstMessage: string) {
    return this.prisma.chatConversation.create({
      data: { userId, title: titleFrom(firstMessage) },
      select: { id: true, title: true, updatedAt: true },
    });
  }

  async remove(userId: string, id: string): Promise<void> {
    const { count } = await this.prisma.chatConversation.deleteMany({ where: { id, userId } });
    if (count === 0) throw new NotFoundException('Chat not found');
  }

  async messagesLeftToday(userId: string): Promise<number> {
    const now = new Date();
    const startOfDay = new Date(Date.UTC(now.getUTCFullYear(), now.getUTCMonth(), now.getUTCDate()));
    const used = await this.prisma.chatMessage.count({
      where: { role: 'user', createdAt: { gte: startOfDay }, conversation: { userId } },
    });
    return Math.max(0, DAILY_MESSAGE_LIMIT - used);
  }

  async send(userId: string, conversationId: string, message: string, attachment: Attachment | null): Promise<AsyncGenerator<string>> {
    const conversation = await this.prisma.chatConversation.findFirst({ where: { id: conversationId, userId }, select: { id: true } });
    if (!conversation) throw new NotFoundException('Chat not found');
    if ((await this.messagesLeftToday(userId)) === 0) {
      throw new HttpException(`You have used today's ${DAILY_MESSAGE_LIMIT} messages. Come back tomorrow.`, HttpStatus.TOO_MANY_REQUESTS);
    }

    const attachmentText = attachment ? await readDocument(attachment) : null;
    await this.prisma.chatMessage.create({
      data: { conversationId, role: 'user', content: message, attachmentName: attachment?.name ?? null, attachmentText },
    });

    const history = await this.prisma.chatMessage.findMany({
      where: { conversationId },
      orderBy: { createdAt: 'desc' },
      take: HISTORY_MESSAGES,
      select: { role: true, content: true, attachmentName: true, attachmentText: true },
    });

    const stream = await this.ai.models.generateContentStream({
      model: this.model,
      contents: history.reverse().map(toContent),
      config: { systemInstruction: ASSISTANT_PROMPT },
    });

    return this.relay(conversationId, stream);
  }

  private async *relay(conversationId: string, stream: AsyncGenerator<GenerateContentResponse>) {
    let reply = '';
    let usage: GenerateContentResponseUsageMetadata = {};
    try {
      for await (const chunk of stream) {
        if (chunk.usageMetadata) usage = chunk.usageMetadata;
        if (chunk.text) {
          reply += chunk.text;
          yield chunk.text;
        }
      }
    } finally {
      if (reply) {
        await this.prisma.$transaction([
          this.prisma.chatMessage.create({ data: { conversationId, role: 'model', content: reply } }),
          this.prisma.chatConversation.update({ where: { id: conversationId }, data: { updatedAt: new Date() } }),
          this.prisma.llmUsage.create({
            data: {
              stage: 'chat',
              model: this.model,
              inputTokens: usage.promptTokenCount ?? 0,
              outputTokens: (usage.candidatesTokenCount ?? 0) + (usage.thoughtsTokenCount ?? 0),
            },
          }),
        ]);
      }
    }
  }
}
