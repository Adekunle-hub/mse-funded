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
  'advanced manufacturing',
  'sustainable energy',
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

type SearchResult = { url: string; title: string | null };
type Engine = { name: string; search: (query: string) => Promise<SearchResult[]> };

@Injectable()
export class DiscoveryService {
  private readonly logger = new Logger(DiscoveryService.name);
  private readonly engines: Engine[] = [];

  constructor(
    private readonly sources: SourcesService,
    config: ConfigService<Env, true>,
  ) {
    const tavilyKey = config.get('TAVILY_API_KEY', { infer: true });
    const exaKey = config.get('EXA_API_KEY', { infer: true });
    if (tavilyKey) this.engines.push({ name: 'Tavily', search: (query) => this.searchTavily(query, tavilyKey) });
    if (exaKey) this.engines.push({ name: 'Exa', search: (query) => this.searchExa(query, exaKey) });
  }

  get queries(): string[] {
    return SUBFIELDS.flatMap((subfield) => PHRASES.map((phrase) => `"${subfield}" ${phrase}`));
  }

  @Cron('0 6 * * *')
  async discover(): Promise<number> {
    if (this.engines.length === 0) {
      this.logger.warn('Neither TAVILY_API_KEY nor EXA_API_KEY is set, skipping discovery');
      return 0;
    }

    let added = 0;
    for (const engine of this.engines) {
      for (const query of this.queries) {
        try {
          const results = await engine.search(query);
          added += await this.sources.addDiscovered(
            results.map(({ url, title }) => ({ url, name: title?.slice(0, 200) || url })),
            'SEARCH',
          );
        } catch (error) {
          this.logger.warn(`${engine.name} search "${query}" failed: ${error instanceof Error ? error.message : String(error)}`);
        }
      }
    }

    const engineNames = this.engines.map((engine) => engine.name).join(' and ');
    this.logger.log(`Discovery ran ${this.queries.length} searches on ${engineNames} and added ${added} new sources`);
    return added;
  }

  private async searchTavily(query: string, apiKey: string): Promise<SearchResult[]> {
    const response = await fetch('https://api.tavily.com/search', {
      method: 'POST',
      headers: { Authorization: `Bearer ${apiKey}`, 'Content-Type': 'application/json' },
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
    const data = (await response.json()) as { results: SearchResult[] };
    return data.results;
  }

  private async searchExa(query: string, apiKey: string): Promise<SearchResult[]> {
    const weekAgo = new Date(Date.now() - 7 * 24 * 60 * 60 * 1000);
    const response = await fetch('https://api.exa.ai/search', {
      method: 'POST',
      headers: { 'x-api-key': apiKey, 'Content-Type': 'application/json' },
      body: JSON.stringify({
        query,
        numResults: 10,
        startPublishedDate: weekAgo.toISOString(),
        excludeDomains: EXCLUDED_DOMAINS,
      }),
      signal: AbortSignal.timeout(20_000),
    });

    if (!response.ok) throw new Error(`Exa responded with HTTP ${response.status}`);
    const data = (await response.json()) as { results: SearchResult[] };
    return data.results;
  }
}
