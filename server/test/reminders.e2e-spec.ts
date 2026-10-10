import { getQueueToken } from '@nestjs/bullmq';
import type { INestApplication } from '@nestjs/common';
import { Test } from '@nestjs/testing';
import type { Queue } from 'bullmq';
import request from 'supertest';
import type { App } from 'supertest/types.js';

import { AppModule } from './../src/app.module.js';
import { configureApp } from './../src/app.setup.js';
import { NotificationsService } from './../src/notifications/notifications.service.js';
import { closesIn, reminderMark } from './../src/notifications/reminders.js';
import { RemindersService } from './../src/notifications/reminders.service.js';
import { PrismaService } from './../src/prisma/prisma.service.js';
import { NOTIFY_QUEUE } from './../src/queues.js';

const RUN = Date.now();
const DAY_MS = 24 * 60 * 60 * 1000;
const LONG_AGO = new Date(Date.now() - 60 * DAY_MS);

function lagosNoonIn(days: number): Date {
  const date = new Date(Date.now() + days * DAY_MS).toLocaleDateString('en-CA', { timeZone: 'Africa/Lagos' });
  return new Date(`${date}T12:00:00+01:00`);
}

describe('Deadline reminders (e2e)', () => {
  let app: INestApplication<App>;
  let prisma: PrismaService;
  let reminders: RemindersService;
  let userId: string;
  const saved: Record<string, string> = {};

  beforeAll(async () => {
    const moduleRef = await Test.createTestingModule({ imports: [AppModule] }).compile();
    app = configureApp(moduleRef.createNestApplication());
    await app.init();
    prisma = app.get(PrismaService);
    reminders = app.get(RemindersService);
    await app.get<Queue>(getQueueToken(NOTIFY_QUEUE)).pause();

    const user = await prisma.user.create({ data: { email: `reminders-${RUN}@example.com`, name: 'Reminder Tester' } });
    userId = user.id;

    const cases: { key: string; deadline: Date | null; savedAt?: Date; status?: 'SUBMITTED'; remindersOn?: boolean; listing?: 'DRAFT' }[] = [
      { key: 'seven', deadline: lagosNoonIn(7) },
      { key: 'three', deadline: lagosNoonIn(3) },
      { key: 'one', deadline: lagosNoonIn(1) },
      { key: 'missedSeven', deadline: lagosNoonIn(5) },
      { key: 'savedLate', deadline: lagosNoonIn(5), savedAt: new Date() },
      { key: 'notYet', deadline: lagosNoonIn(10) },
      { key: 'submitted', deadline: lagosNoonIn(3), status: 'SUBMITTED' },
      { key: 'switchedOff', deadline: lagosNoonIn(3), remindersOn: false },
      { key: 'openEnded', deadline: null },
      { key: 'hidden', deadline: lagosNoonIn(3), listing: 'DRAFT' },
    ];

    for (const item of cases) {
      const scholarship = await prisma.scholarship.create({
        data: {
          slug: `reminder-${item.key}-${RUN}`,
          name: `Funded PhD ${item.key}`,
          funder: 'Test Funder',
          institution: 'Test University',
          country: 'United Kingdom',
          level: 'PHD',
          fundingType: 'FULLY_FUNDED',
          fields: [],
          fundingSummary: 'Tuition and stipend',
          intakeYear: 2099,
          deadline: item.deadline,
          deadlineTimeZone: 'Europe/London',
          deadlineZoneLabel: 'UK time',
          eligibility: [],
          about: [],
          howToApply: [],
          officialUrl: 'https://example.com/official',
          status: item.listing ?? 'PUBLISHED',
        },
      });
      const entry = await prisma.savedScholarship.create({
        data: {
          userId,
          scholarshipId: scholarship.id,
          createdAt: item.savedAt ?? LONG_AGO,
          status: item.status ?? 'INTERESTED',
          remindersOn: item.remindersOn ?? true,
        },
      });
      saved[item.key] = entry.id;
    }
  });

  afterAll(async () => {
    await prisma.user.deleteMany({ where: { id: userId } });
    await prisma.scholarship.deleteMany({ where: { slug: { endsWith: `-${RUN}`, startsWith: 'reminder-' } } });
    await app.get<Queue>(getQueueToken(NOTIFY_QUEUE)).obliterate({ force: true });
    await app.close();
  });

  const marksFor = async (key: string) =>
    (await prisma.reminder.findMany({ where: { savedScholarshipId: saved[key] } })).map((reminder) => reminder.daysBefore);

  it('picks the 7, 3 or 1 day mark, and skips marks that passed before the listing was saved', () => {
    expect(reminderMark(7, 60)).toBe(7);
    expect(reminderMark(5, 60)).toBe(7);
    expect(reminderMark(3, 60)).toBe(3);
    expect(reminderMark(2, 60)).toBe(3);
    expect(reminderMark(1, 60)).toBe(1);
    expect(reminderMark(0, 60)).toBe(1);
    expect(reminderMark(8, 60)).toBeNull();
    expect(reminderMark(5, 5)).toBeNull();
    expect(closesIn(0)).toBe('Closes today');
    expect(closesIn(1)).toBe('Closes tomorrow');
    expect(closesIn(3)).toBe('Closes in 3 days');
  });

  it('queues each due reminder once and skips the rest', async () => {
    await reminders.queueDueReminders();

    expect(await marksFor('seven')).toEqual([7]);
    expect(await marksFor('three')).toEqual([3]);
    expect(await marksFor('one')).toEqual([1]);
    expect(await marksFor('missedSeven')).toEqual([7]);
    for (const key of ['savedLate', 'notYet', 'submitted', 'switchedOff', 'openEnded', 'hidden']) {
      expect(await marksFor(key)).toEqual([]);
    }

    await reminders.queueDueReminders();
    expect(await marksFor('three')).toEqual([3]);
  });

  it('sends the email once with the days left and a stop link', async () => {
    const email = vi.spyOn(app.get(NotificationsService), 'sendDeadlineReminder').mockResolvedValue();
    const [reminder] = await prisma.reminder.findMany({ where: { savedScholarshipId: saved.three } });

    await expect(reminders.send(reminder.id)).resolves.toBe('SENT');
    await expect(reminders.send(reminder.id)).resolves.toBe('SKIPPED');
    expect(email).toHaveBeenCalledTimes(1);
    expect(email.mock.calls[0][0]).toMatchObject({
      to: `reminders-${RUN}@example.com`,
      title: 'Funded PhD three',
      daysLeft: 3,
      stopUrl: expect.stringContaining('/reminders/stop?id='),
    });
    email.mockRestore();
  });

  it('cancels a reminder when the student switched reminders off before it was sent', async () => {
    const [reminder] = await prisma.reminder.findMany({ where: { savedScholarshipId: saved.one } });
    await prisma.savedScholarship.update({ where: { id: saved.one }, data: { remindersOn: false } });
    await expect(reminders.send(reminder.id)).resolves.toBe('CANCELLED');
  });

  it('turns reminders off from the email link and refuses a forged link', async () => {
    const server = app.getHttpServer();
    const link = new URL(reminders.stopUrl(saved.seven));

    const forged = await request(server).get(`/reminders/stop?id=${saved.seven}&sig=forged`).expect(302);
    expect(forged.headers.location).toContain('/reminders-stopped?invalid=1');

    const stopped = await request(server).get(`${link.pathname}${link.search}`).expect(302);
    expect(stopped.headers.location).toMatch(/\/reminders-stopped$/);

    const entry = await prisma.savedScholarship.findUniqueOrThrow({ where: { id: saved.seven } });
    expect(entry.remindersOn).toBe(false);
  });
});
