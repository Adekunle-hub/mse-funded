import { createServer, type Server } from 'node:http';
import type { AddressInfo } from 'node:net';

import Anthropic from '@anthropic-ai/sdk';
import { getQueueToken } from '@nestjs/bullmq';
import type { INestApplicationContext } from '@nestjs/common';
import { Test } from '@nestjs/testing';
import type { Job, Queue } from 'bullmq';

import { AppModule } from './../src/app.module.js';
import { CrawlProcessor, isTemporaryFailure } from './../src/crawler/crawl.processor.js';
import { CrawlerService } from './../src/crawler/crawler.service.js';
import { DiscoveryService } from './../src/discovery/discovery.service.js';
import { PrismaService } from './../src/prisma/prisma.service.js';
import { CRAWL_QUEUE, EXTRACT_QUEUE, type CrawlJob } from './../src/queues.js';
import { SourcesService } from './../src/sources/sources.service.js';

const pages: Record<string, { type: string; body: string }> = {
  '/robots.txt': { type: 'text/plain', body: 'User-agent: *\nDisallow: /private' },
  '/scholarships': { type: 'text/html', body: '<h1>Funded PhD in corrosion</h1>' },
  '/private': { type: 'text/html', body: '<h1>Hidden</h1>' },
  '/brochure.pdf': { type: 'application/pdf', body: '%PDF-1.4' },
  '/opportunities': {
    type: 'text/html',
    body: [
      '<a href="/projects/funded-phd-in-alloys">Funded PhD in alloys</a>',
      '<a href="/projects/msc-scholarship#apply">MSc scholarship</a>',
      '<a href="/about">About us</a>',
      '<a href="https://elsewhere.example/phd">PhD elsewhere</a>',
    ].join(''),
  },
};

describe('Crawler (e2e)', () => {
  let app: INestApplicationContext;
  let prisma: PrismaService;
  let crawler: CrawlerService;
  let server: Server;
  let baseUrl: string;

  beforeAll(async () => {
    server = createServer((request, response) => {
      const path = new URL(request.url ?? '/', 'http://localhost').pathname;
      const page = pages[path];
      if (path === '/flaky') return response.writeHead(503).end();
      if (!page) return response.writeHead(404).end();
      response.writeHead(200, { 'Content-Type': page.type }).end(page.body);
    });
    await new Promise<void>((resolve) => server.listen(0, resolve));
    baseUrl = `http://localhost:${(server.address() as AddressInfo).port}`;

    const notRelevant = { model: 'fake', stop_reason: 'end_turn', parsed_output: { relevant: false, reason: 'Test' }, usage: { input_tokens: 0, output_tokens: 0 } };
    const moduleRef = await Test.createTestingModule({ imports: [AppModule] })
      .overrideProvider(Anthropic)
      .useValue({ messages: { parse: async () => notRelevant } })
      .compile();
    app = await moduleRef.init();
    prisma = app.get(PrismaService);
    crawler = app.get(CrawlerService);
  });

  afterAll(async () => {
    for (const name of [CRAWL_QUEUE, EXTRACT_QUEUE]) {
      await app.get<Queue>(getQueueToken(name)).obliterate({ force: true });
    }
    const pages = await prisma.rawPage.findMany({ where: { url: { startsWith: baseUrl } }, select: { id: true } });
    await prisma.llmUsage.deleteMany({ where: { rawPageId: { in: pages.map((page) => page.id) } } });
    await prisma.rawPage.deleteMany({ where: { url: { startsWith: baseUrl } } });
    await prisma.source.deleteMany({ where: { url: { startsWith: baseUrl } } });
    await app.close();
    server.close();
  });

  const addSource = (path: string, lastCrawledAt: Date | null = null, kind: 'HTML' | 'LISTING' = 'HTML') =>
    prisma.source.create({ data: { name: `Test ${path}`, url: `${baseUrl}${path}`, lastCrawledAt, kind } });

  it('saves an allowed page once, even when crawled twice', async () => {
    const source = await addSource('/scholarships');

    const first = await crawler.crawlSource(source);
    expect(first).toEqual({ result: { status: 200, error: null, robotsAllowed: true }, saved: true, discovered: 0 });

    const second = await crawler.crawlSource(source);
    expect(second.saved).toBe(false);

    const saved = await prisma.rawPage.findMany({ where: { sourceId: source.id } });
    expect(saved).toHaveLength(1);
    expect(saved[0].body).toContain('corrosion');
  });

  it('respects robots.txt', async () => {
    const source = await addSource('/private');
    const { result, saved } = await crawler.crawlSource(source);

    expect(result).toEqual({ status: null, error: 'Blocked by robots.txt', robotsAllowed: false });
    expect(saved).toBe(false);
  });

  it('records failures for missing pages and unsupported files', async () => {
    const missing = await crawler.crawlSource(await addSource('/gone'));
    expect(missing.result.error).toBe('HTTP 404');

    const pdf = await crawler.crawlSource(await addSource('/brochure.pdf'));
    expect(pdf.result.error).toBe('Unsupported content type application/pdf');
  });

  it('only returns sources that are due', async () => {
    const fresh = await addSource('/scholarships?fresh', new Date());
    const stale = await addSource('/scholarships?stale', new Date(Date.now() - 2 * 24 * 60 * 60 * 1000));

    const dueIds = (await app.get(SourcesService).findDue()).map((source) => source.id);
    expect(dueIds).toContain(stale.id);
    expect(dueIds).not.toContain(fresh.id);
  });

  it('adds same-site post links from listing pages as new sources', async () => {
    const listing = await addSource('/opportunities', null, 'LISTING');
    const { discovered } = await crawler.crawlSource(listing);
    expect(discovered).toBe(2);

    const found = await prisma.source.findMany({ where: { origin: 'LISTING', url: { startsWith: baseUrl } } });
    expect(found.map((source) => source.url).sort()).toEqual([
      `${baseUrl}/projects/funded-phd-in-alloys`,
      `${baseUrl}/projects/msc-scholarship`,
    ]);

    const again = await crawler.crawlSource(listing);
    expect(again.discovered).toBe(0);
  });

  it('builds 24 discovery searches and skips them without an API key', async () => {
    const discovery = app.get(DiscoveryService);
    expect(discovery.queries).toHaveLength(24);
    expect(discovery.queries).toContain('"metallurgy" funded PhD studentship');
    if (!process.env.TAVILY_API_KEY) expect(await discovery.discover()).toBe(0);
  });

  describe('crawl worker', () => {
    const run = (sourceId: string) => app.get(CrawlProcessor).process({ data: { sourceId }, attemptsMade: 0 } as Job<CrawlJob>);

    it('retries temporary failures only', () => {
      expect(isTemporaryFailure({ status: null, error: 'timeout', robotsAllowed: true })).toBe(true);
      expect(isTemporaryFailure({ status: 503, error: 'HTTP 503', robotsAllowed: true })).toBe(true);
      expect(isTemporaryFailure({ status: 429, error: 'HTTP 429', robotsAllowed: true })).toBe(true);
      expect(isTemporaryFailure({ status: 404, error: 'HTTP 404', robotsAllowed: true })).toBe(false);
      expect(isTemporaryFailure({ status: null, error: 'Blocked by robots.txt', robotsAllowed: false })).toBe(false);
    });

    it('throws on a 503 so BullMQ retries, and records the failure', async () => {
      const source = await addSource('/flaky');
      await expect(run(source.id)).rejects.toThrow('HTTP 503');

      const recorded = await prisma.source.findUniqueOrThrow({ where: { id: source.id } });
      expect(recorded.lastStatus).toBe(503);
      expect(recorded.lastCrawledAt).not.toBeNull();
    });

    it('finishes without retrying on a 404', async () => {
      const source = await addSource('/gone-for-good');
      await expect(run(source.id)).resolves.toEqual({ saved: false, discovered: 0, error: 'HTTP 404' });
    });

    it('queues an extract job for each new page', async () => {
      const source = await addSource('/scholarships?worker');
      await expect(run(source.id)).resolves.toMatchObject({ saved: true, error: null });

      const page = await prisma.rawPage.findFirstOrThrow({ where: { sourceId: source.id } });
      const jobs = await app.get<Queue>(getQueueToken(EXTRACT_QUEUE)).getJobs(['waiting', 'active', 'completed', 'failed', 'delayed']);
      expect(jobs.map((job) => job.data.rawPageId)).toContain(page.id);
    });
  });
});
