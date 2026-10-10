import { Test, TestingModule } from '@nestjs/testing';
import { INestApplication } from '@nestjs/common';
import request from 'supertest';
import { App } from 'supertest/types.js';

import { AppModule } from './../src/app.module.js';
import { configureApp } from './../src/app.setup.js';

describe('MseFunded API (e2e)', () => {
  let app: INestApplication<App>;

  beforeEach(async () => {
    const moduleFixture: TestingModule = await Test.createTestingModule({
      imports: [AppModule],
    }).compile();

    app = configureApp(moduleFixture.createNestApplication());
    await app.init();
  });

  afterEach(async () => {
    await app.close();
  });

  it('GET /health', () => {
    return request(app.getHttpServer()).get('/health').expect(200).expect({ status: 'ok' });
  });

  it('GET /scholarships filters by field and returns facets', async () => {
    const response = await request(app.getHttpServer()).get('/scholarships?field=Ceramics').expect(200);

    expect(response.body.total).toBeGreaterThan(0);
    expect(response.body.items.every((item: { fields: string[] }) => item.fields.includes('Ceramics'))).toBe(true);
    expect(response.body.facets.level).toBeInstanceOf(Array);
  });

  it('GET /scholarships/count matches the search total', async () => {
    const server = app.getHttpServer();
    const search = await request(server).get('/scholarships?level=phd').expect(200);
    const count = await request(server).get('/scholarships/count?level=phd').expect(200);

    expect(count.body.total).toBe(search.body.total);
  });

  it('GET /scholarships/:id returns details or 404', async () => {
    const server = app.getHttpServer();
    const found = await request(server).get('/scholarships/manchester-polymer-composites-phd').expect(200);
    expect(found.body.eligibility.length).toBeGreaterThan(0);

    await request(server).get('/scholarships/does-not-exist').expect(404);
  });

  it('GET /stats/landing summarises open listings', async () => {
    const response = await request(app.getHttpServer()).get('/stats/landing').expect(200);

    expect(response.body.openCount).toBeGreaterThan(0);
    expect(response.body.deadlinesByMonth).toHaveLength(6);
  });

  it('POST /scholarships/:id/reports validates the reason', async () => {
    const server = app.getHttpServer();
    await request(server).post('/scholarships/manchester-polymer-composites-phd/reports').send({ reason: 'nope' }).expect(400);
    await request(server)
      .post('/scholarships/manchester-polymer-composites-phd/reports')
      .send({ reason: 'wrong-deadline', details: 'The page says 21 Jan.' })
      .expect(201);
  });

  it('saves, updates and removes a scholarship for one session', async () => {
    const agent = request.agent(app.getHttpServer());

    await agent.get('/me/saved').expect(200).expect([]);
    const saved = await agent.put('/me/saved/manchester-polymer-composites-phd').expect(200);
    expect(saved.body.status).toBe('interested');

    const updated = await agent.patch('/me/saved/manchester-polymer-composites-phd').send({ status: 'submitted' }).expect(200);
    expect(updated.body.submittedAt).toBeDefined();

    await agent.patch('/me/saved/manchester-polymer-composites-phd').send({ status: 'won' }).expect(400);
    await agent.delete('/me/saved/manchester-polymer-composites-phd').expect(204);
    await agent.get('/me/saved').expect(200).expect([]);
  });

  it('signs up, keeps guest saves, and rejects a wrong password', async () => {
    const agent = request.agent(app.getHttpServer());

    await agent.put('/me/saved/leeds-polymer-membranes-phd').expect(200);
    await agent.post('/auth/signup').send({ name: 'Tolu Adeyemi', email: 'tolu@example.com', password: 'short' }).expect(400);
    await agent
      .post('/auth/signup')
      .send({ name: 'Tolu Adeyemi', email: 'tolu@example.com', password: 'correct horse' })
      .expect(201);

    const saved = await agent.get('/me/saved').expect(200);
    expect(saved.body).toHaveLength(1);

    await agent.post('/auth/logout').expect(204);
    await agent.post('/auth/login').send({ email: 'tolu@example.com', password: 'wrong password' }).expect(401);
    await agent.post('/auth/login').send({ email: 'tolu@example.com', password: 'correct horse' }).expect(200);
    await agent.get('/auth/me').expect(200);
  });
});
