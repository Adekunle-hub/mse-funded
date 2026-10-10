import { createServer, type Server } from 'node:http';
import type { AddressInfo } from 'node:net';

import type { INestApplicationContext } from '@nestjs/common';
import { Test } from '@nestjs/testing';
import type { Job } from 'bullmq';

import { AppModule } from './../src/app.module.js';
import type { Opportunity } from './../src/extraction/extraction.schema.js';
import { PrismaService } from './../src/prisma/prisma.service.js';
import type { RecheckJob, VerifyJob } from './../src/queues.js';
import { ScholarshipsService } from './../src/scholarships/scholarships.service.js';
import { TemporaryLinkError, VerificationService } from './../src/verification/verification.service.js';
import { VerifyProcessor } from './../src/verification/verify.processor.js';

const RUN = Date.now();
const IN_A_MONTH = new Date(Date.now() + 30 * 24 * 60 * 60 * 1000);
const statuses: Record<string, number> = { '/ok': 200, '/gone': 404, '/blocked': 403, '/down': 503 };

describe('Verification (e2e)', () => {
  let app: INestApplicationContext;
  let prisma: PrismaService;
  let verification: VerificationService;
  let server: Server;
  let baseUrl: string;
  let rawPageId: string;

  beforeAll(async () => {
    server = createServer((request, response) => {
      const path = new URL(request.url ?? '/', 'http://localhost').pathname;
      response.writeHead(statuses[path] ?? 404).end();
    });
    await new Promise<void>((resolve) => server.listen(0, resolve));
    baseUrl = `http://localhost:${(server.address() as AddressInfo).port}`;

    const moduleRef = await Test.createTestingModule({ imports: [AppModule] }).compile();
    app = await moduleRef.init();
    prisma = app.get(PrismaService);
    verification = app.get(VerificationService);

    const page = await prisma.rawPage.create({
      data: { url: `${baseUrl}/listing-${RUN}`, httpStatus: 200, contentHash: `verify-${RUN}`, body: '<p>Test</p>' },
    });
    rawPageId = page.id;
  });

  afterAll(async () => {
    await prisma.scholarship.deleteMany({ where: { rawPageId } });
    await prisma.rawPage.deleteMany({ where: { id: rawPageId } });
    await app.close();
    server.close();
  });

  const addOpportunity = (overrides: Partial<Opportunity>, deadline: Date | null = IN_A_MONTH) => {
    const opportunity: Opportunity = {
      title: `Funded PhD in corrosion of high entropy alloys ${RUN}`,
      funder: 'EPSRC',
      institution: 'Test University',
      department: null,
      country: 'United Kingdom',
      city: null,
      materialsFocus: 'core',
      level: 'PHD',
      fundingType: 'FULLY_FUNDED',
      fundingSummary: 'Tuition and stipend',
      fields: ['Corrosion'],
      deadline: null,
      deadlineTimeZone: 'Europe/London',
      startDate: 'October 2027',
      openToNigerians: true,
      eligibility: ['A materials degree'],
      howToApply: ['Apply online'],
      summary: 'A test project.',
      officialUrl: `${baseUrl}/ok`,
      ...overrides,
    };
    return prisma.extractedOpportunity.create({
      data: { rawPageId, title: opportunity.title, institution: opportunity.institution, level: opportunity.level, deadline, data: opportunity },
    });
  };

  it('rejects closed posts, other topics, posts not open to Nigerians and broken links', async () => {
    const closed = await addOpportunity({ title: `Closed ${RUN}` }, new Date('2020-01-01'));
    const medical = await addOpportunity({ title: `Medical ${RUN}`, materialsFocus: 'unrelated' });
    const homeOnly = await addOpportunity({ title: `Home only ${RUN}`, openToNigerians: false });
    const broken = await addOpportunity({ title: `Broken ${RUN}`, officialUrl: `${baseUrl}/gone` });

    await expect(verification.verify(closed.id)).resolves.toBe('REJECTED');
    await expect(verification.verify(medical.id)).resolves.toBe('REJECTED');
    await expect(verification.verify(homeOnly.id)).resolves.toBe('REJECTED');
    await expect(verification.verify(broken.id)).resolves.toBe('REJECTED');
  });

  it('falls back to the crawled page when the named link cannot be opened', async () => {
    const page = await prisma.rawPage.create({
      data: { url: `${baseUrl}/ok?catalogue-${RUN}`, httpStatus: 200, contentHash: `catalogue-${RUN}`, body: '<p>Catalogue</p>' },
    });
    const opportunity = await addOpportunity({ title: `Fallback link ${RUN}`, officialUrl: `${baseUrl}/blocked` });
    await prisma.extractedOpportunity.update({ where: { id: opportunity.id }, data: { rawPageId: page.id } });

    await expect(verification.verify(opportunity.id)).resolves.toBe('PUBLISHED');
    const row = await prisma.extractedOpportunity.findUniqueOrThrow({ where: { id: opportunity.id } });
    const listing = await prisma.scholarship.findUniqueOrThrow({ where: { id: row.scholarshipId! } });
    expect(listing.officialUrl).toBe(page.url);

    await prisma.scholarship.delete({ where: { id: listing.id } });
    await prisma.rawPage.delete({ where: { id: page.id } });
  });

  it('holds posts with an unconfirmed link for review', async () => {
    const blocked = await addOpportunity({ title: `Blocked ${RUN}`, officialUrl: `${baseUrl}/blocked` });
    await expect(verification.verify(blocked.id)).resolves.toBe('NEEDS_REVIEW');
  });

  it('publishes programmes that run in several countries', async () => {
    const programme = await addOpportunity({ title: `Erasmus Mundus materials ${RUN}`, country: null, materialsFocus: 'general' });
    await expect(verification.verify(programme.id)).resolves.toBe('PUBLISHED');

    const row = await prisma.extractedOpportunity.findUniqueOrThrow({ where: { id: programme.id } });
    const listing = await prisma.scholarship.findUniqueOrThrow({ where: { id: row.scholarshipId! } });
    expect(listing.country).toBe('Multiple countries');
  });

  it('publishes an open-ended post with no deadline', async () => {
    const openEnded = await addOpportunity({ title: `Open until filled ${RUN}` }, null);
    await expect(verification.verify(openEnded.id)).resolves.toBe('PUBLISHED');

    const row = await prisma.extractedOpportunity.findUniqueOrThrow({ where: { id: openEnded.id } });
    const detail = await app.get(ScholarshipsService).findOne(
      (await prisma.scholarship.findUniqueOrThrow({ where: { id: row.scholarshipId! } })).slug,
    );
    expect(detail.deadline).toBeNull();
  });

  it('retries a site that is down, then holds it for review after the last attempt', async () => {
    const down = await addOpportunity({ title: `Down ${RUN}`, officialUrl: `${baseUrl}/down` });
    await expect(verification.verify(down.id)).rejects.toBeInstanceOf(TemporaryLinkError);

    const job = { data: { opportunityId: down.id }, attemptsMade: 2, opts: { attempts: 3 } } as Job<VerifyJob>;
    await expect(app.get(VerifyProcessor).process(job)).resolves.toBe('NEEDS_REVIEW');
  });

  it('publishes a good post and merges a duplicate into it', async () => {
    const first = await addOpportunity({});
    const duplicate = await addOpportunity({});

    await expect(verification.verify(first.id)).resolves.toBe('PUBLISHED');
    await expect(verification.verify(duplicate.id)).resolves.toBe('MERGED');

    const [a, b] = await prisma.extractedOpportunity.findMany({ where: { id: { in: [first.id, duplicate.id] } } });
    expect(a.scholarshipId).toBe(b.scholarshipId);

    const listing = await prisma.scholarship.findUniqueOrThrow({ where: { id: a.scholarshipId! } });
    expect(listing.status).toBe('PUBLISHED');
    expect(listing.fields.sort()).toEqual(['Corrosion', 'Metals']);

    const detail = await app.get(ScholarshipsService).findOne(listing.slug);
    expect(detail).toMatchObject({ title: listing.name, durationLabel: 'PhD', deadlineZone: { label: 'UK time' } });
  });

  it('publishes as under review when eligibility for Nigerians is unclear', async () => {
    const unclear = await addOpportunity({ title: `Unclear eligibility ${RUN}`, openToNigerians: null });
    await expect(verification.verify(unclear.id)).resolves.toBe('PUBLISHED');

    const row = await prisma.extractedOpportunity.findUniqueOrThrow({ where: { id: unclear.id } });
    const listing = await prisma.scholarship.findUniqueOrThrow({ where: { id: row.scholarshipId! } });
    expect(listing.status).toBe('UNDER_REVIEW');
  });

  describe('daily re-check of live listings', () => {
    const lastWeek = new Date(Date.now() - 7 * 24 * 60 * 60 * 1000);

    const addListing = (path: string) =>
      prisma.scholarship.create({
        data: {
          slug: `recheck-${path.slice(1)}-${RUN}`,
          name: `Recheck ${path} ${RUN}`,
          funder: 'Test Funder',
          institution: 'Test University',
          country: 'United Kingdom',
          level: 'PHD',
          fundingType: 'FULLY_FUNDED',
          fields: [],
          fundingSummary: 'Tuition and stipend',
          intakeYear: 2099,
          deadline: IN_A_MONTH,
          deadlineTimeZone: 'UTC',
          deadlineZoneLabel: 'UTC',
          eligibility: [],
          about: [],
          howToApply: [],
          officialUrl: `${baseUrl}${path}`,
          status: 'PUBLISHED',
          verifiedAt: lastWeek,
          rawPageId,
        },
      });

    it('refreshes the checked date when the official link still works', async () => {
      const listing = await addListing('/ok');
      await expect(verification.recheck(listing.id)).resolves.toBe('CHECKED');

      const after = await prisma.scholarship.findUniqueOrThrow({ where: { id: listing.id } });
      expect(after.verifiedAt!.getTime()).toBeGreaterThan(lastWeek.getTime());
    });

    it('removes a listing whose official link is gone', async () => {
      const listing = await addListing('/gone');
      await expect(verification.recheck(listing.id)).resolves.toBe('REMOVED');

      const after = await prisma.scholarship.findUniqueOrThrow({ where: { id: listing.id } });
      expect(after.status).toBe('REJECTED');
      await expect(app.get(ScholarshipsService).findOne(listing.slug)).rejects.toThrow('Scholarship not found');
    });

    it('leaves a listing alone when the site blocks us or is down', async () => {
      const blocked = await addListing('/blocked');
      await expect(verification.recheck(blocked.id)).resolves.toBe('UNCHANGED');

      const down = await addListing('/down');
      const job = { data: { scholarshipId: down.id }, attemptsMade: 1, opts: { attempts: 2 } } as Job<RecheckJob>;
      await expect(app.get(VerifyProcessor).process(job)).resolves.toBe('UNCHANGED');

      const after = await prisma.scholarship.findMany({ where: { id: { in: [blocked.id, down.id] } } });
      expect(after.every((row) => row.status === 'PUBLISHED')).toBe(true);
    });
  });
});
