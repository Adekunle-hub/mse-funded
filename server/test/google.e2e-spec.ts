import type { INestApplication } from '@nestjs/common';
import { Test } from '@nestjs/testing';
import bcrypt from 'bcrypt';
import request from 'supertest';
import type { App } from 'supertest/types.js';

import { AppModule } from './../src/app.module.js';
import { configureApp } from './../src/app.setup.js';
import { GoogleAuthService, type GoogleProfile } from './../src/auth/google-auth.service.js';
import { PrismaService } from './../src/prisma/prisma.service.js';

const RUN = Date.now();

function setCookies(response: request.Response): string[] {
  return (response.headers['set-cookie'] as unknown as string[] | undefined) ?? [];
}

function cookie(response: request.Response, name: string): string {
  const found = setCookies(response).find((value) => value.startsWith(`${name}=`));
  if (!found) throw new Error(`${name} cookie was not set`);
  return found.split(';')[0];
}

describe('Google sign-in (e2e)', () => {
  let app: INestApplication<App>;
  let prisma: PrismaService;
  const emails = [`google-new-${RUN}@example.com`, `google-link-${RUN}@example.com`, `google-unverified-${RUN}@example.com`];

  beforeAll(async () => {
    const moduleRef = await Test.createTestingModule({ imports: [AppModule] }).compile();
    app = configureApp(moduleRef.createNestApplication());
    await app.init();
    prisma = app.get(PrismaService);
  });

  afterAll(async () => {
    await prisma.user.deleteMany({ where: { email: { in: emails } } });
    await app.close();
  });

  async function start(query: string) {
    const response = await request(app.getHttpServer()).get(`/auth/google${query}`).expect(302);
    const location = new URL(response.headers.location);
    return { location, signInCookie: cookie(response, 'google_sign_in'), state: location.searchParams.get('state')! };
  }

  async function finish(profile: GoogleProfile, query = '?next=%2Fscholarships&save=some-listing') {
    vi.spyOn(app.get(GoogleAuthService), 'profile').mockResolvedValueOnce(profile);
    const { signInCookie, state } = await start(query);
    return request(app.getHttpServer())
      .get(`/auth/google/callback?code=test-code&state=${state}`)
      .set('Cookie', signInCookie)
      .expect(302);
  }

  it('sends people to Google with a state value and drops unsafe return paths', async () => {
    const { location, signInCookie, state } = await start('?next=%2F%2Fevil.example&save=abc');
    expect(location.hostname).toBe('accounts.google.com');
    expect(location.searchParams.get('redirect_uri')).toBe('http://localhost:4000/auth/google/callback');
    expect(state.length).toBeGreaterThan(10);
    expect(decodeURIComponent(signInCookie)).not.toContain('evil.example');
  });

  it('refuses a callback whose state does not match', async () => {
    const { signInCookie } = await start('');
    const response = await request(app.getHttpServer())
      .get('/auth/google/callback?code=test-code&state=wrong')
      .set('Cookie', signInCookie)
      .expect(302);
    expect(response.headers.location).toBe('http://localhost:3000/login?error=google');
  });

  it('creates an account, signs it in and returns to the page with the listing to save', async () => {
    const response = await finish({ googleId: `g-new-${RUN}`, email: emails[0], name: 'Ada Google', emailVerified: true });
    expect(response.headers.location).toBe('http://localhost:3000/signed-in?next=%2Fscholarships&save=some-listing');

    const me = await request(app.getHttpServer()).get('/auth/me').set('Cookie', cookie(response, 'access_token')).expect(200);
    expect(me.body.user).toMatchObject({ email: emails[0], name: 'Ada Google', isAdmin: false });
  });

  it('links Google to an existing password account when Google has verified the email', async () => {
    await prisma.user.create({ data: { email: emails[1], name: 'Existing', passwordHash: await bcrypt.hash('password123', 4) } });
    const response = await finish({ googleId: `g-link-${RUN}`, email: emails[1], name: 'Existing', emailVerified: true });
    expect(response.headers.location).toContain('/signed-in');

    const user = await prisma.user.findUniqueOrThrow({ where: { email: emails[1] } });
    expect(user.googleId).toBe(`g-link-${RUN}`);
  });

  it('does not link to an existing account when Google has not verified the email', async () => {
    await prisma.user.create({ data: { email: emails[2], name: 'Careful', passwordHash: await bcrypt.hash('password123', 4) } });
    const response = await finish({ googleId: `g-unverified-${RUN}`, email: emails[2], name: 'Careful', emailVerified: false });
    expect(response.headers.location).toBe('http://localhost:3000/login?error=google');

    const user = await prisma.user.findUniqueOrThrow({ where: { email: emails[2] } });
    expect(user.googleId).toBeNull();
  });
});
