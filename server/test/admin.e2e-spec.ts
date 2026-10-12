import { INestApplication } from '@nestjs/common';
import { Test } from '@nestjs/testing';
import request from 'supertest';
import { App } from 'supertest/types.js';

import { AppModule } from './../src/app.module.js';
import { configureApp } from './../src/app.setup.js';
import type { Opportunity } from './../src/extraction/extraction.schema.js';
import { PrismaService } from './../src/prisma/prisma.service.js';

const RUN = Date.now();

describe('Admin tools (e2e)', () => {
  let app: INestApplication<App>;
  let prisma: PrismaService;
  let admin: string;
  let student: string;
  let rawPageId: string;
  const emails = [`admin-${RUN}@example.com`, `student-${RUN}@example.com`];

  const signIn = async (email: string) => {
    const response = await request(app.getHttpServer())
      .post('/auth/signup')
      .send({ name: 'Test Person', email, password: 'correct horse battery' })
      .expect(201);
    const cookies = response.headers['set-cookie'] as unknown as string[];
    return cookies.find((cookie) => cookie.startsWith('access_token='))!.split(';')[0];
  };

  const held = (title: string) => {
    const opportunity: Opportunity = {
      title,
      funder: 'Admin Test Funder',
      institution: 'Admin Test University',
      department: null,
      country: 'Japan',
      city: null,
      materialsFocus: 'general',
      level: 'MSC',
      fundingType: 'FULLY_FUNDED',
      fundingSummary: 'Tuition and stipend',
      fields: [],
      deadline: null,
      deadlineTimeZone: null,
      startDate: null,
      openToNigerians: true,
      eligibility: ['A degree'],
      howToApply: ['Apply online'],
      summary: 'A test programme.',
      officialUrl: 'https://example.com/blocked',
    };
    return prisma.extractedOpportunity.create({
      data: { rawPageId, title, institution: opportunity.institution, level: 'MSC', status: 'NEEDS_REVIEW', data: opportunity },
    });
  };

  beforeAll(async () => {
    const moduleRef = await Test.createTestingModule({ imports: [AppModule] }).compile();
    app = configureApp(moduleRef.createNestApplication());
    await app.init();
    prisma = app.get(PrismaService);

    admin = await signIn(emails[0]);
    student = await signIn(emails[1]);
    await prisma.user.update({ where: { email: emails[0] }, data: { role: 'ADMIN' } });

    const page = await prisma.rawPage.create({
      data: { url: `https://example.com/admin-${RUN}`, httpStatus: 200, contentHash: `admin-${RUN}`, body: '', extractionStatus: 'FAILED' },
    });
    rawPageId = page.id;
  });

  afterAll(async () => {
    await prisma.scholarship.deleteMany({ where: { funder: 'Admin Test Funder' } });
    await prisma.rawPage.deleteMany({ where: { id: rawPageId } });
    await prisma.source.deleteMany({ where: { url: { startsWith: `https://example.com/source-${RUN}` } } });
    await prisma.user.deleteMany({ where: { email: { in: emails } } });
    await app.close();
  });

  it('keeps the admin tools for admins only', async () => {
    const server = app.getHttpServer();
    await request(server).get('/admin/review').expect(401);
    await request(server).get('/admin/review').set('Cookie', student).expect(403);
    await request(server).get('/admin/listings').set('Cookie', student).expect(403);
  });

  it('publishes a held listing with a corrected deadline, and rejects another', async () => {
    const server = app.getHttpServer();
    const keep = await held(`Admin test scholarship ${RUN}`);
    const drop = await held(`Admin test duplicate ${RUN}`);

    const queue = await request(server).get('/admin/review').set('Cookie', admin).expect(200);
    expect(queue.body.map((item: { id: string }) => item.id)).toEqual(expect.arrayContaining([keep.id, drop.id]));

    await request(server).post(`/admin/review/${keep.id}/publish`).set('Cookie', admin).send({ deadline: '31-12-2099' }).expect(400);
    const published = await request(server)
      .post(`/admin/review/${keep.id}/publish`)
      .set('Cookie', admin)
      .send({ deadline: '2099-12-31', officialUrl: 'https://example.com/fixed' })
      .expect(201);
    expect(published.body.status).toBe('PUBLISHED');

    const listing = await prisma.scholarship.findFirstOrThrow({ where: { name: keep.title } });
    expect(listing).toMatchObject({ status: 'PUBLISHED', officialUrl: 'https://example.com/fixed' });
    expect(listing.deadline?.toISOString()).toBe('2099-12-31T23:59:59.000Z');

    await request(server).post(`/admin/review/${drop.id}/reject`).set('Cookie', admin).expect(201);
    await request(server).post(`/admin/review/${drop.id}/reject`).set('Cookie', admin).expect(404);
    expect((await prisma.extractedOpportunity.findUniqueOrThrow({ where: { id: drop.id } })).status).toBe('REJECTED');
  });

  it('saves reports and lets an admin resolve them', async () => {
    const server = app.getHttpServer();
    const listing = await prisma.scholarship.findFirstOrThrow({ where: { name: `Admin test scholarship ${RUN}` } });

    await request(server)
      .post(`/scholarships/${listing.slug}/reports`)
      .send({ reason: 'wrong-deadline', details: 'It says June.' })
      .expect(201);
    await request(server).post('/scholarships/does-not-exist/reports').send({ reason: 'other' }).expect(404);

    const open = await request(server).get('/admin/reports').set('Cookie', admin).expect(200);
    const report = open.body.find((item: { scholarship: { id: string } }) => item.scholarship.id === listing.id);
    expect(report).toMatchObject({ reason: 'wrong-deadline', details: 'It says June.' });

    const listed = await request(server)
      .get('/admin/listings')
      .query({ q: `scholarship ${RUN}` })
      .set('Cookie', admin)
      .expect(200);
    expect(listed.body.items[0]).toMatchObject({ id: listing.id, openReports: 1 });

    await request(server).post(`/admin/reports/${report.id}/resolve`).set('Cookie', admin).expect(204);
    const after = await request(server).get('/admin/reports').set('Cookie', admin).expect(200);
    expect(after.body.some((item: { id: string }) => item.id === report.id)).toBe(false);
  });

  it('edits and hides a listing', async () => {
    const server = app.getHttpServer();
    const listing = await prisma.scholarship.findFirstOrThrow({ where: { name: `Admin test scholarship ${RUN}` } });

    await request(server).patch(`/admin/listings/${listing.id}`).set('Cookie', admin).send({ status: 'DELETED' }).expect(400);
    await request(server)
      .patch(`/admin/listings/${listing.id}`)
      .set('Cookie', admin)
      .send({ name: `Admin test scholarship ${RUN} (renamed)`, deadline: null })
      .expect(200);
    await request(server).get(`/scholarships/${listing.slug}`).expect(200);

    await request(server).patch(`/admin/listings/${listing.id}`).set('Cookie', admin).send({ status: 'REJECTED' }).expect(200);
    await request(server).get(`/scholarships/${listing.slug}`).expect(404);

    const hidden = await prisma.scholarship.findUniqueOrThrow({ where: { id: listing.id } });
    expect(hidden).toMatchObject({ name: `Admin test scholarship ${RUN} (renamed)`, deadline: null, status: 'REJECTED' });
  });

  it('adds, pauses and finds sources, and retries failed pages', async () => {
    const server = app.getHttpServer();
    const url = `https://example.com/source-${RUN}/phd`;

    const added = await request(server).post('/admin/sources').set('Cookie', admin).send({ url, kind: 'LISTING' }).expect(201);
    expect(added.body).toMatchObject({ url, name: 'example.com', kind: 'LISTING', isActive: true });
    await request(server).post('/admin/sources').set('Cookie', admin).send({ url, kind: 'HTML' }).expect(409);
    await request(server).post('/admin/sources').set('Cookie', admin).send({ url: 'not a link', kind: 'HTML' }).expect(400);

    const paused = await request(server)
      .patch(`/admin/sources/${added.body.id}`)
      .set('Cookie', admin)
      .send({ isActive: false })
      .expect(200);
    expect(paused.body.isActive).toBe(false);

    const found = await request(server)
      .get('/admin/sources')
      .query({ q: `source-${RUN}` })
      .set('Cookie', admin)
      .expect(200);
    expect(found.body.items).toHaveLength(1);

    const otherFailed = await prisma.rawPage.findMany({
      where: { extractionStatus: 'FAILED', id: { not: rawPageId } },
      select: { id: true, extractionError: true },
    });
    const retried = await request(server).post('/admin/pages/retry-failed').set('Cookie', admin).expect(201);
    for (const page of otherFailed) {
      await prisma.rawPage.update({ where: { id: page.id }, data: { extractionStatus: 'FAILED', extractionError: page.extractionError } });
    }

    expect(retried.body.count).toBe(otherFailed.length + 1);
    expect((await prisma.rawPage.findUniqueOrThrow({ where: { id: rawPageId } })).extractionStatus).toBe('PENDING');
  });
});
