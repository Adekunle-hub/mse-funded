import Anthropic from '@anthropic-ai/sdk';
import { betaZodOutputFormat } from '@anthropic-ai/sdk/helpers/beta/zod';
import { zodOutputFormat } from '@anthropic-ai/sdk/helpers/zod';
import { InjectQueue } from '@nestjs/bullmq';
import { Injectable, Logger } from '@nestjs/common';
import { Cron } from '@nestjs/schedule';
import type { Queue } from 'bullmq';

import type { ExtractionStatus, Prisma } from '../generated/prisma/client.js';
import { PrismaService } from '../prisma/prisma.service.js';
import { EXTRACT_QUEUE, type ExtractJob } from '../queues.js';
import { ExtractionSchema, ScreeningSchema, type Opportunity } from './extraction.schema.js';
import { pageText } from './page-text.js';

const SCREEN_MODEL = 'claude-haiku-5-5';
const EXTRACT_MODEL = 'claude-opus-5-5';
const MAX_TEXT_CHARS = 100_000;

const SCREEN_PROMPT = `You screen web pages for MseFunded, a site that lists funded MSc and PhD places in materials science and engineering: metallurgy, polymers, ceramics, composites, corrosion, nanomaterials, biomaterials, electronic, energy and battery materials, and closely related materials topics.

Answer relevant = true when the page offers at least one of these:
- a specific funded MSc or PhD place, studentship, scholarship or graduate assistantship in materials science or a closely related materials topic
- a funded MSc or PhD scholarship programme open to many fields that include engineering or the physical sciences, such as Chevening, Commonwealth, Erasmus Mundus, Mastercard Foundation, DAAD or Fulbright

Answer relevant = false for course pages with no funding, staff or postdoc jobs, news, and funding limited to unrelated fields such as medicine or law. When you are unsure, answer relevant = true so a more careful review can check it. Keep the reason to one sentence.`;

const EXTRACT_PROMPT = `You extract funded MSc and PhD opportunities in materials science and engineering from web pages for MseFunded, a site used by Nigerian materials science students.

List every funded MSc or PhD opportunity that the page describes in materials science or a closely related materials topic, and every funded MSc or PhD scholarship programme open to many fields that include engineering or the physical sciences. Return an empty list if there are none.

Rules:
- Use only what the page states. Use null when something is not stated. Never guess.
- Write dates as YYYY-MM-DD. deadlineTimeZone is an IANA time zone such as Europe/London, only when the page gives one.
- materialsFocus is core when the project is mainly materials science or engineering, related when materials are a large part of it, general when it is a scholarship programme open to many fields that include engineering or the physical sciences, and unrelated otherwise (for example a medical, biology or pure software project).
- country is the host country. Use Multiple countries when the programme runs in several countries, and null only when the page does not say.
- level is MSC, PHD, or MSC_PHD when both are offered.
- fundingType is FULLY_FUNDED when tuition and a living stipend are both covered, TUITION_ONLY, STIPEND_ONLY, or PARTIAL.
- openToNigerians is true when international or Nigerian applicants can apply, false when the funding is limited to others (for example UK home fee status only), and null when the page does not say.
- fields are short materials topics such as Polymers or Corrosion.
- summary is two or three plain sentences about the project or programme.
- officialUrl is the link to the advert or application page when the page gives one.`;

export type ExtractionResult = { status: ExtractionStatus | 'MISSING'; opportunities: number };

type UsageSource = { model: string; usage: { input_tokens: number; output_tokens: number } };

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
    private readonly anthropic: Anthropic,
    @InjectQueue(EXTRACT_QUEUE) private readonly extractQueue: Queue<ExtractJob>,
  ) {}

  @Cron('*/15 * * * *')
  async enqueuePending(): Promise<number> {
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

    const text = pageText(page.body);
    if (text.length > MAX_TEXT_CHARS) {
      return this.finish(page.id, 'FAILED', `Page text is too long (${text.length} characters)`);
    }

    const url = page.finalUrl ?? page.url;
    const content = `Page URL: ${url}\n\n${text}`;

    const screening = await this.anthropic.messages.parse({
      model: SCREEN_MODEL,
      max_tokens: 4096,
      system: SCREEN_PROMPT,
      output_config: { effort: 'low', format: zodOutputFormat(ScreeningSchema) },
      messages: [{ role: 'user', content }],
    });
    await this.recordUsage(page.id, 'screen', screening);

    if (screening.stop_reason === 'refusal' || !screening.parsed_output) {
      return this.finish(page.id, 'FAILED', `Screening gave no answer (${screening.stop_reason})`);
    }
    if (!screening.parsed_output.relevant) {
      return this.finish(page.id, 'NOT_A_SCHOLARSHIP', screening.parsed_output.reason);
    }

    const extraction = await this.anthropic.beta.messages.parse({
      model: EXTRACT_MODEL,
      max_tokens: 16000,
      betas: ['server-side-fallback-2026-07-01'],
      fallbacks: 'default',
      system: EXTRACT_PROMPT,
      output_config: { effort: 'medium', format: betaZodOutputFormat(ExtractionSchema) },
      messages: [{ role: 'user', content }],
    });
    await this.recordUsage(page.id, 'extract', extraction);

    if (extraction.stop_reason === 'refusal' || !extraction.parsed_output) {
      return this.finish(page.id, 'FAILED', `Extraction gave no answer (${extraction.stop_reason})`);
    }

    const { opportunities } = extraction.parsed_output;
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

  private async recordUsage(rawPageId: string, stage: string, response: UsageSource): Promise<void> {
    await this.prisma.llmUsage.create({
      data: {
        rawPageId,
        stage,
        model: response.model,
        inputTokens: response.usage.input_tokens,
        outputTokens: response.usage.output_tokens,
      },
    });
  }

  private async finish(rawPageId: string, status: ExtractionStatus, note: string | null): Promise<ExtractionResult> {
    await this.prisma.rawPage.update({
      where: { id: rawPageId },
      data: { extractionStatus: status, extractedAt: new Date(), extractionError: note },
    });
    return { status, opportunities: 0 };
  }
}
