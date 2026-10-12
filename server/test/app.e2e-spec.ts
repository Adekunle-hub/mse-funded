import { Test, TestingModule } from '@nestjs/testing';
import { INestApplication } from '@nestjs/common';
import request from 'supertest';
import { App } from 'supertest/types.js';

import { AppModule } from './../src/app.module.js';
import { configureApp } from './../src/app.setup.js';
import { NotificationsService } from './../src/notifications/notifications.service.js';
import { PrismaService } from './../src/prisma/prisma.service.js';

const SCHOLARSHIP = `e2e-ceramics-phd-${Date.now()}`;

function cookie(response: request.Response, name: string): string {
  const cookies = response.headers['set-cookie'] as unknown as string[];
  const found = cookies.find((value) => value.startsWith(`${name}=`));
  if (!found) throw new Error(`${name} cookie was not set`);
  return found.split(';')[0];
}

describe('MseFunded API (e2e)', () => {
  let app: INestApplication<App>;
  let prisma: PrismaService;
  const email = `e2e-${Date.now()}@example.com`;
  const password = 'correct horse battery';

  beforeAll(async () => {
    const moduleFixture: TestingModule = await Test.createTestingModule({
      imports: [AppModule],
    }).compile();

    app = configureApp(moduleFixture.createNestApplication());
    await app.init();
    prisma = app.get(PrismaService);
    await prisma.scholarship.create({
      data: {
        slug: SCHOLARSHIP,
        name: 'E2E funded PhD in ceramics',
        funder: 'E2E Funder',
        institution: 'E2E University',
        country: 'United Kingdom',
        level: 'PHD',
        fundingType: 'FULLY_FUNDED',
        fields: ['Ceramics'],
        fundingSummary: 'Tuition and stipend',
        intakeYear: 2099,
        deadline: new Date(Date.now() + 30 * 24 * 60 * 60 * 1000),
        deadlineTimeZone: 'Europe/London',
        deadlineZoneLabel: 'UK time',
        eligibility: ['A materials degree'],
        about: ['A test listing.'],
        howToApply: ['Apply online'],
        officialUrl: 'https://example.com/e2e',
        status: 'PUBLISHED',
        verifiedAt: new Date(),
      },
    });
  });

  afterAll(async () => {
    await prisma.user.deleteMany({ where: { email } });
    await prisma.scholarship.deleteMany({ where: { slug: SCHOLARSHIP } });
    await app.close();
  });

  it('GET /health reports the database and redis', () => {
    return request(app.getHttpServer()).get('/health').expect(200).expect({ status: 'ok', database: 'up', redis: 'up' });
  });

  it('GET /scholarships filters by field and returns facets', async () => {
    const response = await request(app.getHttpServer()).get('/scholarships?field=Ceramics').expect(200);

    expect(response.body.total).toBeGreaterThan(0);
    expect(response.body.items.every((item: { fields: string[] }) => item.fields.includes('Ceramics'))).toBe(true);
    expect(response.body.facets.level).toBeInstanceOf(Array);
  });

  it('GET /scholarships returns 10 per page and clamps pages past the end', async () => {
    const server = app.getHttpServer();
    const first = await request(server).get('/scholarships').expect(200);
    expect(first.body.pageSize).toBe(10);
    expect(first.body.items.length).toBeLessThanOrEqual(10);
    expect(first.body.pageCount).toBe(Math.max(1, Math.ceil(first.body.total / 10)));

    const beyond = await request(server).get('/scholarships?page=999').expect(200);
    expect(beyond.body.page).toBe(first.body.pageCount);
    expect(beyond.body.items.length).toBeGreaterThan(0);
  });

  it('GET /scholarships/:id returns details or 404', async () => {
    const server = app.getHttpServer();
    const found = await request(server).get(`/scholarships/${SCHOLARSHIP}`).expect(200);
    expect(found.body.eligibility.length).toBeGreaterThan(0);

    await request(server).get('/scholarships/does-not-exist').expect(404);
    await request(server).get('/scholarships/manchester-polymer-composites-phd').expect(404);
  });

  it('POST /scholarships/:id/reports validates the reason', async () => {
    const server = app.getHttpServer();
    await request(server).post(`/scholarships/${SCHOLARSHIP}/reports`).send({ reason: 'nope' }).expect(400);
    await request(server)
      .post(`/scholarships/${SCHOLARSHIP}/reports`)
      .send({ reason: 'wrong-deadline', details: 'The page says 21 Jan.' })
      .expect(201);
  });

  it('never rate-limits public reads but limits reports to 5 a minute', async () => {
    const server = app.getHttpServer();
    for (let i = 0; i < 150; i += 1) {
      await request(server).get('/scholarships/count').expect(200);
    }

    const statuses: number[] = [];
    for (let i = 0; i < 6; i += 1) {
      const response = await request(server).post(`/scholarships/${SCHOLARSHIP}/reports`).send({ reason: 'other' });
      statuses.push(response.status);
    }
    expect(statuses.at(-1)).toBe(429);
  });

  it('requires a login to use the saved list', async () => {
    const server = app.getHttpServer();
    await request(server).get('/me/saved').expect(401);
    await request(server).put(`/me/saved/${SCHOLARSHIP}`).expect(401);
    await request(server).get('/auth/me').expect(401);
  });

  it('rejects invalid sign-up details', async () => {
    const response = await request(app.getHttpServer())
      .post('/auth/signup')
      .send({ name: '', email: 'not-an-email', password: 'short' })
      .expect(400);

    expect(response.body.message).toEqual(
      expect.arrayContaining(['Enter your full name', 'Enter an email like name@example.com', 'Use at least 8 characters']),
    );
  });

  it('signs up, saves, logs out and logs back in', async () => {
    const agent = request.agent(app.getHttpServer());

    const signup = await agent.post('/auth/signup').send({ name: 'Tolu Adeyemi', email, password }).expect(201);
    expect(signup.body.user).toMatchObject({
      name: 'Tolu Adeyemi',
      email,
      memberSince: expect.any(String),
      signInMethods: { password: true, google: false },
    });
    expect(signup.body.user).not.toHaveProperty('passwordHash');
    expect(signup.headers['set-cookie']).toEqual(
      expect.arrayContaining([
        expect.stringMatching(/^access_token=.+Path=\/;.+HttpOnly/),
        expect.stringMatching(/^refresh_token=.+Path=\/auth;.+HttpOnly/),
      ]),
    );

    await request(app.getHttpServer()).post('/auth/signup').send({ name: 'Copy', email, password }).expect(409);

    await agent.get('/auth/me').expect(200);
    const saved = await agent.put(`/me/saved/${SCHOLARSHIP}`).expect(200);
    expect(saved.body.status).toBe('interested');

    const updated = await agent.patch(`/me/saved/${SCHOLARSHIP}`).send({ status: 'submitted' }).expect(200);
    expect(updated.body.submittedAt).toBeDefined();
    await agent.patch(`/me/saved/${SCHOLARSHIP}`).send({ status: 'won' }).expect(400);

    await agent.post('/auth/logout').expect(204);
    await agent.get('/me/saved').expect(401);

    await agent.post('/auth/login').send({ email, password: 'wrong password' }).expect(401);
    await agent.post('/auth/login').send({ email: email.toUpperCase(), password }).expect(200);

    const list = await agent.get('/me/saved').expect(200);
    expect(list.body).toHaveLength(1);

    await agent.delete(`/me/saved/${SCHOLARSHIP}`).expect(204);
    await agent.get('/me/saved').expect(200).expect([]);
  });

  it('rotates refresh tokens and revokes them on logout', async () => {
    const server = app.getHttpServer();
    await request(server).post('/auth/refresh').expect(401);

    const login = await request(server).post('/auth/login').send({ email, password }).expect(200);
    const firstRefresh = cookie(login, 'refresh_token');

    const refreshed = await request(server).post('/auth/refresh').set('Cookie', firstRefresh).expect(204);
    const secondRefresh = cookie(refreshed, 'refresh_token');
    const newAccess = cookie(refreshed, 'access_token');
    expect(secondRefresh).not.toBe(firstRefresh);

    await request(server).get('/auth/me').set('Cookie', newAccess).expect(200);
    await request(server).post('/auth/refresh').set('Cookie', firstRefresh).expect(401);

    await request(server).post('/auth/logout').set('Cookie', secondRefresh).expect(204);
    await request(server).post('/auth/refresh').set('Cookie', secondRefresh).expect(401);
  });

  it('lets only admins see the admin summary', async () => {
    const server = app.getHttpServer();
    await request(server).get('/admin/summary').expect(401);

    const login = await request(server).post('/auth/login').send({ email, password }).expect(200);
    expect(login.body.user.isAdmin).toBe(false);
    const access = cookie(login, 'access_token');
    await request(server).get('/admin/summary').set('Cookie', access).expect(403);

    await prisma.user.update({ where: { email }, data: { role: 'ADMIN' } });
    const me = await request(server).get('/auth/me').set('Cookie', access).expect(200);
    expect(me.body.user.isAdmin).toBe(true);

    const summary = await request(server).get('/admin/summary').set('Cookie', access).expect(200);
    expect(summary.body).toMatchObject({
      listings: { live: expect.any(Number) },
      pages: { waiting: expect.any(Number) },
      ai: { callsTotal: expect.any(Number) },
    });
    await prisma.user.update({ where: { email }, data: { role: 'STUDENT' } });
  });

  it('resets a forgotten password with a single-use emailed link', async () => {
    const server = app.getHttpServer();
    const sent = vi.spyOn(app.get(NotificationsService), 'sendPasswordReset');

    await request(server).post('/auth/forgot-password').send({ email: 'nobody-here@example.com' }).expect(204);
    expect(sent).not.toHaveBeenCalled();

    const before = await request(server).post('/auth/login').send({ email, password }).expect(200);
    const oldRefresh = cookie(before, 'refresh_token');

    await request(server).post('/auth/forgot-password').send({ email: email.toUpperCase() }).expect(204);
    expect(sent).toHaveBeenCalledTimes(1);
    const token = new URL(sent.mock.calls[0][2]).searchParams.get('token')!;

    const newPassword = 'a brand new password';
    await request(server).post('/auth/reset-password').send({ token, password: newPassword }).expect(204);
    await request(server).post('/auth/reset-password').send({ token, password: 'another password!' }).expect(400);

    await request(server).post('/auth/login').send({ email, password }).expect(401);
    await request(server).post('/auth/login').send({ email, password: newPassword }).expect(200);
    await request(server).post('/auth/refresh').set('Cookie', oldRefresh).expect(401);
    sent.mockRestore();
  });

  it('gives the same answer when the reset email cannot be sent', async () => {
    const sent = vi.spyOn(app.get(NotificationsService), 'sendPasswordReset').mockRejectedValue(new Error('Resend refused'));
    await request(app.getHttpServer()).post('/auth/forgot-password').send({ email }).expect(204);
    expect(sent).toHaveBeenCalledTimes(1);
    sent.mockRestore();
  });
});
