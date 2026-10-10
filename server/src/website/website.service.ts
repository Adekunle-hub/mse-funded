import { Injectable, Logger } from '@nestjs/common';
import { ConfigService } from '@nestjs/config';

import type { Env } from '../config/env.js';

@Injectable()
export class WebsiteService {
  private readonly logger = new Logger(WebsiteService.name);
  private readonly revalidateUrl: string;
  private readonly secret: string | undefined;

  constructor(config: ConfigService<Env, true>) {
    this.revalidateUrl = `${config.get('CLIENT_ORIGIN', { infer: true })[0]}/api/revalidate`;
    this.secret = config.get('REVALIDATE_SECRET', { infer: true }) || undefined;
  }

  async refreshListings(): Promise<void> {
    if (!this.secret) return;

    try {
      const response = await fetch(this.revalidateUrl, {
        method: 'POST',
        headers: { 'x-revalidate-secret': this.secret },
        signal: AbortSignal.timeout(10_000),
      });
      if (!response.ok) this.logger.warn(`Website refresh returned HTTP ${response.status}`);
    } catch (error) {
      this.logger.warn(`Website refresh failed: ${error instanceof Error ? error.message : String(error)}`);
    }
  }
}
