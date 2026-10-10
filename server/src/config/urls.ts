import type { ConfigService } from '@nestjs/config';

import type { Env } from './env.js';

export function siteUrl(config: ConfigService<Env, true>): string {
  return config.get('CLIENT_ORIGIN', { infer: true })[0];
}

export function apiUrl(config: ConfigService<Env, true>): string {
  return config.get('API_URL', { infer: true }) ?? `http://localhost:${config.get('PORT', { infer: true })}`;
}
