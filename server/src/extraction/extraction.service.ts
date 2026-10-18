import { GoogleGenAI } from '@google/genai';
import { InjectQueue } from '@nestjs/bullmq';
import { Injectable, Logger } from '@nestjs/common';
import { Cron } from '@nestjs/schedule';
import type { Queue } from 'bullmq';
import { z } from 'zod';

import type { ExtractionStatus, Prisma } from '../generated/prisma/client.js';
import { PrismaService } from '../prisma/prisma.service.js';
import { EXTRACT_QUEUE, type ExtractJob } from '../queues.js';
import { ExtractionSchema, ScreeningSchema, type Opportunity } from './extraction.schema.js';
import { READER_CONTENT_TYPE } from '../crawler/reader.js';
import { mentionsFundedStudy, NO_FUNDED_STUDY, pageText } from './page-text.js';

const SCREEN_MODEL = 'gemini-3.5-flash-lite';
const EXTRACT_MODEL = 'gemini-3.5-flash';
const MAX_TEXT_CHARS = 100_000;

const SCREEN_PROMPT = `You screen web pages for MseFunded, a site that lists funded MSc and PhD places in materials science and engineering: metallurgy, polymers, ceramics, composites, corrosion, nanomaterials, biomaterials, electronic, energy and battery materials, manufacturing (such as additive manufacturing, welding and materials processing), sustainable energy (such as solar, hydrogen, batteries, fuel cells and carbon capture), and closely related topics.

Answer relevant = true when the page offers at least one of these:
- a specific funded MSc or PhD place, studentship, scholarship or graduate assistantship in materials science, manufacturing, sustainable energy or a closely related topic
- a funded MSc or PhD scholarship programme open to many fields that include engineering or the physical sciences, such as Chevening, Commonwealth, Erasmus Mundus, Mastercard Foundation, DAAD or Fulbright

Answer relevant = false for course pages with no funding, staff or postdoc jobs, news, and funding limited to unrelated fields such as medicine or law. When you are unsure, answer relevant = true so a more careful review can check it. Keep the reason to one sentence.`;

const EXTRACT_PROMPT = `You extract funded MSc and PhD opportunities in materials science and engineering from web pages for MseFunded, a site used by Nigerian materials science students.

List every funded MSc or PhD opportunity that the page describes in materials science, manufacturing, sustainable energy or a closely related topic, and every funded MSc or PhD scholarship programme open to many fields that include engineering or the physical sciences. Return an empty list if there are none.

Rules:
- Use only what the page states. Use null when something is not stated. Never guess.
- Write dates as YYYY-MM-DD. deadlineTimeZone is an IANA time zone such as Europe/London, only when the page gives one.
- materialsFocus is core when the project is mainly materials science or engineering, manufacturing, or sustainable energy, related when materials are a large part of it, general when it is a scholarship programme open to many fields that include engineering or the physical sciences, and unrelated otherwise (for example a medical, biology or pure software project).
- country is the host country. Use Multiple countries when the programme runs in several countries, and null only when the page does not say.
- level is MSC, PHD, or MSC_PHD when both are offered.
- fundingType is FULLY_FUNDED when tuition and a living stipend are both covered, TUITION_ONLY, STIPEND_ONLY, or PARTIAL.
- openToNigerians is true when international or Nigerian applicants can apply, false when the funding is limited to others (for example UK home fee status only), and null when the page does not say.
- fields are short topics such as Polymers, Corrosion, Manufacturing or Sustainable energy.
- summary is two or three plain sentences about the project or programme.
- officialUrl is the link to the advert or application page when the page gives one.`;

export type ExtractionResult = { status: ExtractionStatus | 'MISSING'; opportunities: number };

function toDeadline(value: string | null): Date | null {
  if (!value) return null;
  const date = new Date(`${value}T23:59:59Z`);
  return Number.isNaN(date.getTime()) ? null : date;
}

@Injectable()
export class ExtractionService {
  private readonly logger = new Logger(ExtractionService.name);

  constructor(
    private readonly prisma: PrismaService,
    private readonly ai: GoogleGenAI,
    @InjectQueue(EXTRACT_QUEUE) private readonly extractQueue: Queue<ExtractJob>,
  ) {}

  @Cron('*/15 * * * *')
  async enqueuePending(): Promise<number> {
    await this.extractQueue.resume();
    const pending = await this.prisma.rawPage.findMany({ where: { extractionStatus: 'PENDING' }, select: { id: true } });

    for (const { id } of pending) {
      await this.extractQueue.add(
        'extract',
        { rawPageId: id },
        { deduplication: { id }, attempts: 3, backoff: { type: 'exponential', delay: 60_000 } },
      );
    }

    if (pending.length > 0) this.logger.log(`Queued ${pending.length} pages for extraction`);
    return pending.length;
  }

  async extract(rawPageId: string): Promise<ExtractionResult> {
    const page = await this.prisma.rawPage.findUnique({ where: { id: rawPageId } });
    if (!page) return { status: 'MISSING', opportunities: 0 };
    if (page.extractionStatus !== 'PENDING') return { status: page.extractionStatus, opportunities: 0 };

    const text = page.contentType === READER_CONTENT_TYPE ? page.body : pageText(page.body);
    if (text.length > MAX_TEXT_CHARS) {
      return this.finish(page.id, 'FAILED', `Page text is too long (${text.length} characters)`);
    }

    if (!mentionsFundedStudy(text)) {
      return this.finish(page.id, 'NOT_A_SCHOLARSHIP', NO_FUNDED_STUDY);
    }

    const url = page.finalUrl ?? page.url;
    const content = `Page URL: ${url}\n\n${text}`;

    const screening = await this.ask(page.id, 'screen', SCREEN_MODEL, SCREEN_PROMPT, ScreeningSchema, content);
    if (!screening) return this.finish(page.id, 'FAILED', 'Screening gave no usable answer');
    if (!screening.relevant) return this.finish(page.id, 'NOT_A_SCHOLARSHIP', screening.reason);

    const extraction = await this.ask(page.id, 'extract', EXTRACT_MODEL, EXTRACT_PROMPT, ExtractionSchema, content);
    if (!extraction) return this.finish(page.id, 'FAILED', 'Extraction gave no usable answer');

    const { opportunities } = extraction;
    if (opportunities.length === 0) {
      return this.finish(page.id, 'NOT_A_SCHOLARSHIP', 'No funded MSc or PhD opportunity found');
    }

    await this.prisma.$transaction([
      this.prisma.extractedOpportunity.createMany({
        data: opportunities.map((opportunity) => this.toRow(page.id, url, opportunity)),
      }),
      this.prisma.rawPage.update({
        where: { id: page.id },
        data: { extractionStatus: 'EXTRACTED', extractedAt: new Date(), extractionError: null },
      }),
    ]);

    this.logger.log(`Extracted ${opportunities.length} opportunities from ${url}`);
    return { status: 'EXTRACTED', opportunities: opportunities.length };
  }

  async markFailed(rawPageId: string, error: string): Promise<void> {
    await this.finish(rawPageId, 'FAILED', error);
  }

  private toRow(rawPageId: string, pageUrl: string, opportunity: Opportunity) {
    const data: Prisma.InputJsonObject = { ...opportunity, officialUrl: opportunity.officialUrl ?? pageUrl };
    return {
      rawPageId,
      title: opportunity.title,
      institution: opportunity.institution,
      level: opportunity.level,
      deadline: toDeadline(opportunity.deadline),
      data,
    };
  }

  private async ask<T>(
    rawPageId: string,
    stage: string,
    model: string,
    systemInstruction: string,
    schema: z.ZodType<T>,
    content: string,
  ): Promise<T | null> {
    const response = await this.ai.models.generateContent({
      model,
      contents: content,
      config: { systemInstruction, responseMimeType: 'application/json', responseJsonSchema: z.toJSONSchema(schema) },
    });

    const usage = response.usageMetadata;
    await this.prisma.llmUsage.create({
      data: {
        rawPageId,
        stage,
        model,
        inputTokens: usage?.promptTokenCount ?? 0,
        outputTokens: (usage?.candidatesTokenCount ?? 0) + (usage?.thoughtsTokenCount ?? 0),
      },
    });

    try {
      const parsed = schema.safeParse(JSON.parse(response.text ?? ''));
      return parsed.success ? parsed.data : null;
    } catch {
      return null;
    }
  }

  private async finish(rawPageId: string, status: ExtractionStatus, note: string | null): Promise<ExtractionResult> {
    await this.prisma.rawPage.update({
      where: { id: rawPageId },
      data: { extractionStatus: status, extractedAt: new Date(), extractionError: note },
    });
    return { status, opportunities: 0 };
  }
}
