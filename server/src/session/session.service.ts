import { Injectable } from '@nestjs/common';
import { ConfigService } from '@nestjs/config';
import { randomUUID } from 'node:crypto';
import type { Request, Response } from 'express';

import type { Env } from '../config/env.js';

export const SESSION_COOKIE = 'msefunded_session';
const THIRTY_DAYS_MS = 30 * 24 * 60 * 60 * 1000;

type Session = { userId?: string };

@Injectable()
export class SessionService {
  private readonly sessions = new Map<string, Session>();
  private readonly secureCookies: boolean;

  constructor(config: ConfigService<Env, true>) {
    this.secureCookies = config.get('NODE_ENV', { infer: true }) === 'production';
  }

  ensure(request: Request, response: Response): string {
    const existing = request.cookies?.[SESSION_COOKIE] as string | undefined;
    if (existing && this.sessions.has(existing)) return existing;

    const sessionId = randomUUID();
    this.sessions.set(sessionId, {});
    response.cookie(SESSION_COOKIE, sessionId, {
      httpOnly: true,
      sameSite: 'lax',
      secure: this.secureCookies,
      maxAge: THIRTY_DAYS_MS,
      path: '/',
    });
    return sessionId;
  }

  userId(sessionId: string): string | undefined {
    return this.sessions.get(sessionId)?.userId;
  }

  signIn(sessionId: string, userId: string) {
    this.sessions.set(sessionId, { userId });
  }

  signOut(sessionId: string) {
    this.sessions.set(sessionId, {});
  }

  ownerKey(sessionId: string): string {
    const userId = this.userId(sessionId);
    return userId ? `user:${userId}` : `guest:${sessionId}`;
  }
}
