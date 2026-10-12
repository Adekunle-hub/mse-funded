import { GoogleGenAI } from '@google/genai';
import { INestApplication } from '@nestjs/common';
import { Test } from '@nestjs/testing';
import request from 'supertest';
import { App } from 'supertest/types.js';

import { AppModule } from './../src/app.module.js';
import { configureApp } from './../src/app.setup.js';
import { PrismaService } from './../src/prisma/prisma.service.js';

const RUN = Date.now();
const PNG = Buffer.from([0x89, 0x50, 0x4e, 0x47, 0x0d, 0x0a, 0x1a, 0x0a, 0, 0, 0, 13]);

describe('Profile pictures and the assistant (e2e)', () => {
  let app: INestApplication<App>;
  let prisma: PrismaService;
  let amaka: string;
  let tunde: string;
  const emails = [`amaka-${RUN}@example.com`, `tunde-${RUN}@example.com`];
  const generateContentStream = vi.fn();

  const signUp = async (email: string) => {
    const response = await request(app.getHttpServer())
      .post('/auth/signup')
      .send({ name: 'Test Student', email, password: 'correct horse battery' })
      .expect(201);
    const cookies = response.headers['set-cookie'] as unknown as string[];
    return cookies.find((cookie) => cookie.startsWith('access_token='))!.split(';')[0];
  };

  beforeAll(async () => {
    const moduleRef = await Test.createTestingModule({ imports: [AppModule] })
      .overrideProvider(GoogleGenAI)
      .useValue({ models: { generateContent: vi.fn(), generateContentStream } })
      .compile();
    app = configureApp(moduleRef.createNestApplication());
    await app.init();
    prisma = app.get(PrismaService);
    amaka = await signUp(emails[0]);
    tunde = await signUp(emails[1]);
  });

  afterAll(async () => {
    await prisma.llmUsage.deleteMany({ where: { stage: 'chat', rawPageId: null, inputTokens: 11 } });
    await prisma.user.deleteMany({ where: { email: { in: emails } } });
    await app.close();
  });

  describe('profile pictures', () => {
    it('uploads, serves and removes a picture', async () => {
      const server = app.getHttpServer();
      await request(server).put('/me/avatar').attach('file', PNG, 'me.png').expect(401);
      await request(server).put('/me/avatar').set('Cookie', amaka).attach('file', Buffer.from('hello'), 'me.png').expect(400);

      const uploaded = await request(server).put('/me/avatar').set('Cookie', amaka).attach('file', PNG, 'me.png').expect(200);
      const url: string = uploaded.body.user.avatarUrl;
      expect(url).toMatch(/^\/users\/[\w-]+\/avatar\?v=\d+$/);

      const picture = await request(server).get(url).expect(200);
      expect(picture.headers['content-type']).toBe('image/png');
      expect(picture.headers['cross-origin-resource-policy']).toBe('cross-origin');

      const me = await request(server).get('/auth/me').set('Cookie', amaka).expect(200);
      expect(me.body.user.avatarUrl).toBe(url);

      const removed = await request(server).delete('/me/avatar').set('Cookie', amaka).expect(200);
      expect(removed.body.user.avatarUrl).toBeNull();
      await request(server).get(url).expect(404);
    });
  });

  describe('assistant', () => {
    const reply = (...parts: string[]) =>
      (async function* () {
        for (const [index, text] of parts.entries()) {
          yield { text, usageMetadata: index === parts.length - 1 ? { promptTokenCount: 11, candidatesTokenCount: 4 } : undefined };
        }
      })();

    it('only works for signed-in users', async () => {
      await request(app.getHttpServer()).get('/assistant/conversations').expect(401);
    });

    it('streams an answer, saves the chat and keeps it private', async () => {
      const server = app.getHttpServer();
      generateContentStream.mockResolvedValueOnce(reply('Martensite forms ', 'without diffusion.'));

      const chat = await request(server).post('/assistant/conversations').set('Cookie', amaka).send({ message: 'What is martensite?' }).expect(201);
      expect(chat.body.title).toBe('What is martensite?');

      const answer = await request(server)
        .post(`/assistant/conversations/${chat.body.id}/messages`)
        .set('Cookie', amaka)
        .field('message', 'What is martensite?')
        .expect(200);
      expect(answer.text).toBe('Martensite forms without diffusion.');

      const sent = generateContentStream.mock.calls[0][0];
      expect(sent.config.systemInstruction).toContain('founded by Mujeeb Ishola');
      expect(sent.contents).toEqual([{ role: 'user', parts: [{ text: 'What is martensite?' }] }]);

      const saved = await request(server).get(`/assistant/conversations/${chat.body.id}`).set('Cookie', amaka).expect(200);
      expect(saved.body.messages.map((message: { role: string }) => message.role)).toEqual(['user', 'model']);

      const list = await request(server).get('/assistant/conversations').set('Cookie', amaka).expect(200);
      expect(list.body.conversations[0].id).toBe(chat.body.id);
      expect(list.body.messagesLeft).toBe(list.body.dailyLimit - 1);

      await request(server).get(`/assistant/conversations/${chat.body.id}`).set('Cookie', tunde).expect(404);
      await request(server).delete(`/assistant/conversations/${chat.body.id}`).set('Cookie', tunde).expect(404);
      await request(server).delete(`/assistant/conversations/${chat.body.id}`).set('Cookie', amaka).expect(204);
    });

    it('reads an attached document and sends it with the question', async () => {
      const server = app.getHttpServer();
      generateContentStream.mockResolvedValueOnce(reply('Your SOP needs a clearer opening.'));
      const chat = await request(server).post('/assistant/conversations').set('Cookie', tunde).send({ message: 'Review my SOP' }).expect(201);

      await request(server)
        .post(`/assistant/conversations/${chat.body.id}/messages`)
        .set('Cookie', tunde)
        .field('message', 'Review my SOP')
        .attach('file', Buffer.from('word'), 'sop.docx')
        .expect(400);

      await request(server)
        .post(`/assistant/conversations/${chat.body.id}/messages`)
        .set('Cookie', tunde)
        .field('message', 'Review my SOP')
        .attach('file', Buffer.from('I have loved corrosion since my final-year project.'), 'sop.txt')
        .expect(200);

      const sent = generateContentStream.mock.calls.at(-1)![0];
      expect(sent.contents.at(-1).parts[0].text).toContain('I have loved corrosion since my final-year project.');

      const saved = await request(server).get(`/assistant/conversations/${chat.body.id}`).set('Cookie', tunde).expect(200);
      expect(saved.body.messages[0].attachmentName).toBe('sop.txt');
      expect(saved.body.messages[0]).not.toHaveProperty('attachmentText');
    });

    it('rejects empty messages', async () => {
      await request(app.getHttpServer()).post('/assistant/conversations').set('Cookie', amaka).send({ message: '' }).expect(400);
    });
  });
});
