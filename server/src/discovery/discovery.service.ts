import { Injectable, Logger } from '@nestjs/common';
import { ConfigService } from '@nestjs/config';
import { Cron } from '@nestjs/schedule';

import type { Env } from '../config/env.js';
import { SourcesService } from '../sources/sources.service.js';

const SUBFIELDS = [
  'materials science',
  'materials engineering',
  'metallurgy',
  'polymer science',
  'ceramic materials',
  'composite materials',
  'nanomaterials',
  'biomaterials',
];
const PHRASES = ['funded PhD studentship', 'MSc scholarship', 'graduate assistantship'];
const EXCLUDED_DOMAINS = [
  'linkedin.com',
  'facebook.com',
  'x.com',
  'twitter.com',
  'instagram.com',
  'findaphd.com',
  'euraxess.ec.europa.eu',
  'msn.com',
  'microsoft.com',
  'microsoftcasualgames.com',
  'reddit.com',
  'youtube.com',
  'quora.com',
  'pinterest.com',
];

type TavilyResponse = { results: { url: string; title: string }[] };

@Injectable()
export class DiscoveryService {
  private readonly logger = new Logger(DiscoveryService.name);
  private readonly apiKey: string | undefined;

  constructor(
    private readonly sources: SourcesService,
    config: ConfigService<Env, true>,
  ) {
    this.apiKey = config.get('TAVILY_API_KEY', { infer: true }) || undefined;
  }

  get queries(): string[] {
    return SUBFIELDS.flatMap((subfield) => PHRASES.map((phrase) => `"${subfield}" ${phrase}`));
  }

  @Cron('0 6 * * *')
  async discover(): Promise<number> {
    if (!this.apiKey) {
      this.logger.warn('TAVILY_API_KEY is not set, skipping discovery');
      return 0;
    }

    let added = 0;
    for (const query of this.queries) {
      try {
        const results = await this.search(query);
        added += await this.sources.addDiscovered(
          results.map(({ url, title }) => ({ url, name: title.slice(0, 200) || url })),
          'SEARCH',
        );
      } catch (error) {
        this.logger.warn(`Search "${query}" failed: ${error instanceof Error ? error.message : String(error)}`);
      }
    }

    this.logger.log(`Discovery ran ${this.queries.length} searches and added ${added} new sources`);
    return added;
  }

  private async search(query: string): Promise<TavilyResponse['results']> {
    const response = await fetch('https://api.tavily.com/search', {
      method: 'POST',
      headers: { Authorization: `Bearer ${this.apiKey}`, 'Content-Type': 'application/json' },
      body: JSON.stringify({
        query,
        search_depth: 'basic',
        max_results: 10,
        time_range: 'week',
        exclude_domains: EXCLUDED_DOMAINS,
      }),
      signal: AbortSignal.timeout(20_000),
    });

    if (!response.ok) throw new Error(`Tavily responded with HTTP ${response.status}`);
    const data = (await response.json()) as TavilyResponse;
    return data.results;
  }
}
