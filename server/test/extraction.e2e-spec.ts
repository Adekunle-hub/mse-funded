import Anthropic from '@anthropic-ai/sdk';
import { getQueueToken } from '@nestjs/bullmq';
import type { INestApplicationContext } from '@nestjs/common';
import { Test } from '@nestjs/testing';
import type { Job, Queue } from 'bullmq';

import { AppModule } from './../src/app.module.js';
import { ExtractProcessor } from './../src/extraction/extract.processor.js';
import type { Opportunity } from './../src/extraction/extraction.schema.js';
import { ExtractionService } from './../src/extraction/extraction.service.js';
import { pageText } from './../src/extraction/page-text.js';
import { PrismaService } from './../src/prisma/prisma.service.js';
import { EXTRACT_QUEUE, type ExtractJob } from './../src/queues.js';

const PREFIX = `https://extraction-test.example/${Date.now()}`;

const opportunity: Opportunity = {
  title: 'Funded PhD in corrosion of high entropy alloys',
  funder: 'EPSRC',
  institution: 'University of Manchester',
  department: 'Department of Materials',
  country: 'United Kingdom',
  city: 'Manchester',
  materialsFocus: 'core',
  level: 'PHD',
  fundingType: 'FULLY_FUNDED',
  fundingSummary: 'Tuition and a stipend for 3.5 years',
  fields: ['Corrosion', 'Metallurgy'],
  deadline: '2026-12-01',
  deadlineTimeZone: 'Europe/London',
  startDate: 'September 2027',
  openToNigerians: true,
  eligibility: ['A first-class degree in materials or a related subject'],
  howToApply: ['Apply online with a CV and cover letter'],
  summary: 'Study how high entropy alloys corrode in sea water.',
  officialUrl: null,
};

const reply = <T>(model: string, parsed_output: T | null, stop_reason = 'end_turn') => ({
  model,
  stop_reason,
  parsed_output,
  usage: { input_tokens: 1200, output_tokens: 150 },
});

describe('Extraction (e2e)', () => {
  let app: INestApplicationContext;
  let prisma: PrismaService;
  let extraction: ExtractionService;
  const screen = vi.fn();
  const extract = vi.fn();

  beforeAll(async () => {
    const moduleRef = await Test.createTestingModule({ imports: [AppModule] })
      .overrideProvider(Anthropic)
      .useValue({ messages: { parse: screen }, beta: { messages: { parse: extract } } })
      .compile();
    app = await moduleRef.init();
    prisma = app.get(PrismaService);
    extraction = app.get(ExtractionService);
  });

  afterAll(async () => {
    const pages = await prisma.rawPage.findMany({ where: { url: { startsWith: PREFIX } }, select: { id: true } });
    await prisma.llmUsage.deleteMany({ where: { rawPageId: { in: pages.map((page) => page.id) } } });
    await prisma.rawPage.deleteMany({ where: { url: { startsWith: PREFIX } } });
    await app.close();
  });

  beforeEach(() => {
    screen.mockReset();
    extract.mockReset();
  });

  const addPage = (path: string) =>
    prisma.rawPage.create({
      data: {
        url: `${PREFIX}${path}`,
        httpStatus: 200,
        contentHash: path,
        body: '<html><head><title>PhD studentships</title></head><body><nav>Menu</nav><main><h1>Funded PhD</h1><p>Corrosion project</p></main><script>track()</script></body></html>',
      },
    });

  it('keeps the main content and drops menus and scripts', () => {
    const text = pageText(
      '<title>Opportunities</title><body><nav>Home About</nav><main><h1>PhD</h1><p>Funded</p></main><footer>Contact</footer><script>x()</script></body>',
    );
    expect(text).toBe('Opportunities\n\nPhD\nFunded');
  });

  it('stops after screening when the page is not relevant', async () => {
    const page = await addPage('/news');
    screen.mockResolvedValue(reply('claude-haiku-5-5', { relevant: false, reason: 'A news article' }));

    await expect(extraction.extract(page.id)).resolves.toEqual({ status: 'NOT_A_SCHOLARSHIP', opportunities: 0 });
    expect(extract).not.toHaveBeenCalled();

    const usage = await prisma.llmUsage.findMany({ where: { rawPageId: page.id } });
    expect(usage.map((row) => row.stage)).toEqual(['screen']);
  });

  it('extracts and saves every opportunity on a relevant page', async () => {
    const page = await addPage('/phds');
    screen.mockResolvedValue(reply('claude-haiku-5-5', { relevant: true, reason: 'Funded PhD advert' }));
    extract.mockResolvedValue(
      reply('claude-opus-5-5', { opportunities: [opportunity, { ...opportunity, title: 'MSc scholarship', level: 'MSC' }] }),
    );

    await expect(extraction.extract(page.id)).resolves.toEqual({ status: 'EXTRACTED', opportunities: 2 });
    expect(extract.mock.calls[0][0]).toMatchObject({ model: 'claude-opus-5-5', fallbacks: 'default' });

    const saved = await prisma.extractedOpportunity.findMany({ where: { rawPageId: page.id }, orderBy: { title: 'asc' } });
    expect(saved.map((row) => row.title)).toEqual(['Funded PhD in corrosion of high entropy alloys', 'MSc scholarship']);
    expect(saved[0].deadline?.toISOString()).toBe('2026-12-01T23:59:59.000Z');
    expect((saved[0].data as Opportunity).officialUrl).toBe(`${PREFIX}/phds`);

    const usage = await prisma.llmUsage.findMany({ where: { rawPageId: page.id }, orderBy: { createdAt: 'asc' } });
    expect(usage.map((row) => row.stage)).toEqual(['screen', 'extract']);
  });

  it('marks the page failed when extraction is refused', async () => {
    const page = await addPage('/refused');
    screen.mockResolvedValue(reply('claude-haiku-5-5', { relevant: true, reason: 'Looks relevant' }));
    extract.mockResolvedValue(reply('claude-opus-5-5', null, 'refusal'));

    await expect(extraction.extract(page.id)).resolves.toEqual({ status: 'FAILED', opportunities: 0 });
  });

  it('does not call Claude again for a page that was already processed', async () => {
    const page = await addPage('/again');
    screen.mockResolvedValue(reply('claude-haiku-5-5', { relevant: false, reason: 'Course page' }));
    await extraction.extract(page.id);
    screen.mockClear();

    await expect(extraction.extract(page.id)).resolves.toEqual({ status: 'NOT_A_SCHOLARSHIP', opportunities: 0 });
    expect(screen).not.toHaveBeenCalled();
  });

  it('keeps the page unread and pauses extraction when credit runs out', async () => {
    const page = await addPage('/no-credit');
    screen.mockRejectedValue(
      new Anthropic.BadRequestError(400, undefined, 'Your credit balance is too low to access the Anthropic API.', new Headers()),
    );
    const queue = app.get<Queue>(getQueueToken(EXTRACT_QUEUE));

    const job = { data: { rawPageId: page.id } } as Job<ExtractJob>;
    await expect(app.get(ExtractProcessor).process(job)).rejects.toThrow('credit balance');

    const unchanged = await prisma.rawPage.findUniqueOrThrow({ where: { id: page.id } });
    expect(unchanged.extractionStatus).toBe('PENDING');
    expect(await queue.isPaused()).toBe(true);
    await queue.resume();
  });
});
