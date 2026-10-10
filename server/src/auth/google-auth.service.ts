import { Injectable } from '@nestjs/common';
import { ConfigService } from '@nestjs/config';
import { OAuth2Client } from 'google-auth-library';

import type { Env } from '../config/env.js';
import { apiUrl } from '../config/urls.js';

export type GoogleProfile = { googleId: string; email: string; name: string; emailVerified: boolean };

@Injectable()
export class GoogleAuthService {
  private readonly client: OAuth2Client | null;
  private readonly clientId: string;

  constructor(config: ConfigService<Env, true>) {
    this.clientId = config.get('GOOGLE_CLIENT_ID', { infer: true }) ?? '';
    const secret = config.get('GOOGLE_CLIENT_SECRET', { infer: true });
    this.client = this.clientId && secret ? new OAuth2Client(this.clientId, secret, `${apiUrl(config)}/auth/google/callback`) : null;
  }

  get enabled(): boolean {
    return this.client !== null;
  }

  authUrl(state: string): string {
    if (!this.client) throw new Error('Google sign-in is not configured');
    return this.client.generateAuthUrl({ scope: ['openid', 'email', 'profile'], state, prompt: 'select_account' });
  }

  async profile(code: string): Promise<GoogleProfile> {
    if (!this.client) throw new Error('Google sign-in is not configured');

    const { tokens } = await this.client.getToken(code);
    if (!tokens.id_token) throw new Error('Google did not return an ID token');

    const ticket = await this.client.verifyIdToken({ idToken: tokens.id_token, audience: this.clientId });
    const payload = ticket.getPayload();
    if (!payload?.sub || !payload.email) throw new Error('Google did not share an email address');

    return {
      googleId: payload.sub,
      email: payload.email.toLowerCase(),
      name: payload.name ?? payload.email.split('@')[0],
      emailVerified: payload.email_verified === true,
    };
  }
}
