import { createHmac, timingSafeEqual } from 'node:crypto';

import { InjectQueue } from '@nestjs/bullmq';
import { Injectable, Logger } from '@nestjs/common';
import { ConfigService } from '@nestjs/config';
import { Cron } from '@nestjs/schedule';
import type { Queue } from 'bullmq';

import type { Env } from '../config/env.js';
import { apiUrl, siteUrl } from '../config/urls.js';
import { Prisma, type ListingStatus } from '../generated/prisma/client.js';
import { PrismaService } from '../prisma/prisma.service.js';
import { NOTIFY_QUEUE, type NotifyJob } from '../queues.js';
import { calendarDaysBetween, formatDeadlineMoment } from '../shared/format/date.js';
import { NotificationsService } from './notifications.service.js';
import { reminderMark } from './reminders.js';

const LIVE: ListingStatus[] = ['PUBLISHED', 'UNDER_REVIEW'];
const DAY_MS = 24 * 60 * 60 * 1000;

export type SendResult = 'SENT' | 'CANCELLED' | 'SKIPPED';

@Injectable()
export class RemindersService {
  private readonly logger = new Logger(RemindersService.name);
  private readonly siteUrl: string;
  private readonly apiUrl: string;
  private readonly secret: string;

  constructor(
    private readonly prisma: PrismaService,
    private readonly notifications: NotificationsService,
    @InjectQueue(NOTIFY_QUEUE) private readonly notifyQueue: Queue<NotifyJob>,
    config: ConfigService<Env, true>,
  ) {
    this.siteUrl = siteUrl(config);
    this.apiUrl = apiUrl(config);
    this.secret = config.get('JWT_SECRET', { infer: true });
  }

  @Cron('0 8 * * *', { timeZone: 'Africa/Lagos' })
  async queueDueReminders(now = new Date()): Promise<number> {
    const saved = await this.prisma.savedScholarship.findMany({
      where: {
        remindersOn: true,
        status: { not: 'SUBMITTED' },
        scholarship: { status: { in: LIVE }, deadline: { gte: now, lte: new Date(now.getTime() + 8 * DAY_MS) } },
      },
      include: { scholarship: { select: { deadline: true } }, reminders: { select: { daysBefore: true } } },
    });

    let queued = 0;
    for (const entry of saved) {
      const deadline = entry.scholarship.deadline!;
      const mark = reminderMark(calendarDaysBetween(now, deadline), calendarDaysBetween(entry.createdAt, deadline));
      if (mark === null || entry.reminders.some((reminder) => reminder.daysBefore === mark)) continue;

      const reminder = await this.createReminder(entry.id, mark, now);
      if (!reminder) continue;

      await this.notifyQueue.add(
        'reminder',
        { reminderId: reminder.id },
        { deduplication: { id: reminder.id }, attempts: 4, backoff: { type: 'exponential', delay: 5 * 60_000 } },
      );
      queued += 1;
    }

    if (queued > 0) this.logger.log(`Queued ${queued} deadline reminders`);
    return queued;
  }

  async send(reminderId: string): Promise<SendResult> {
    const reminder = await this.prisma.reminder.findUnique({
      where: { id: reminderId },
      include: { savedScholarship: { include: { user: true, scholarship: true } } },
    });
    if (!reminder || reminder.status !== 'PENDING') return 'SKIPPED';

    const { savedScholarship: saved } = reminder;
    const { scholarship, user } = saved;
    const now = new Date();
    const stillWanted =
      saved.remindersOn &&
      saved.status !== 'SUBMITTED' &&
      LIVE.includes(scholarship.status) &&
      scholarship.deadline !== null &&
      scholarship.deadline >= now;

    if (!stillWanted || !scholarship.deadline) {
      await this.prisma.reminder.update({ where: { id: reminder.id }, data: { status: 'CANCELLED' } });
      return 'CANCELLED';
    }

    await this.notifications.sendDeadlineReminder({
      to: user.email,
      name: user.name,
      title: scholarship.name,
      institution: scholarship.institution,
      daysLeft: calendarDaysBetween(now, scholarship.deadline),
      deadline: formatDeadlineMoment(scholarship.deadline.toISOString(), {
        id: scholarship.deadlineTimeZone,
        label: scholarship.deadlineZoneLabel,
      }),
      officialUrl: scholarship.officialUrl,
      savedUrl: `${this.siteUrl}/tracker`,
      stopUrl: this.stopUrl(saved.id),
    });

    await this.prisma.reminder.update({
      where: { id: reminder.id },
      data: { status: 'SENT', sentAt: now, attempts: { increment: 1 }, lastError: null },
    });
    return 'SENT';
  }

  async recordFailure(reminderId: string, error: string, final: boolean): Promise<void> {
    await this.prisma.reminder.update({
      where: { id: reminderId },
      data: { attempts: { increment: 1 }, lastError: error.slice(0, 500), status: final ? 'FAILED' : 'PENDING' },
    });
  }

  stopUrl(savedScholarshipId: string): string {
    return `${this.apiUrl}/reminders/stop?id=${savedScholarshipId}&sig=${this.sign(savedScholarshipId)}`;
  }

  async stop(savedScholarshipId: unknown, signature: unknown): Promise<boolean> {
    if (typeof savedScholarshipId !== 'string' || typeof signature !== 'string') return false;

    const expected = Buffer.from(this.sign(savedScholarshipId));
    const received = Buffer.from(signature);
    if (expected.length !== received.length || !timingSafeEqual(expected, received)) return false;

    await this.prisma.savedScholarship.updateMany({ where: { id: savedScholarshipId }, data: { remindersOn: false } });
    return true;
  }

  private sign(savedScholarshipId: string): string {
    return createHmac('sha256', this.secret).update(`stop-reminders:${savedScholarshipId}`).digest('base64url');
  }

  private async createReminder(savedScholarshipId: string, daysBefore: number, now: Date) {
    try {
      return await this.prisma.reminder.create({
        data: { savedScholarshipId, channel: 'EMAIL', daysBefore, scheduledFor: now },
      });
    } catch (error) {
      if (error instanceof Prisma.PrismaClientKnownRequestError && error.code === 'P2002') return null;
      throw error;
    }
  }
}
