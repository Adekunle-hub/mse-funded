import { ApiError, GoogleGenAI } from '@google/genai';
import type { INestApplicationContext } from '@nestjs/common';
import { Test } from '@nestjs/testing';
import type { Job } from 'bullmq';

import { AppModule } from './../src/app.module.js';
import { ExtractProcessor } from './../src/extraction/extract.processor.js';
import type { Opportunity } from './../src/extraction/extraction.schema.js';
import { ExtractionService } from './../src/extraction/extraction.service.js';
import { pageText } from './../src/extraction/page-text.js';
import { PrismaService } from './../src/prisma/prisma.service.js';
import type { ExtractJob } from './../src/queues.js';

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

const reply = <T>(data: T | null) => ({
  text: data === null ? '' : JSON.stringify(data),
  usageMetadata: { promptTokenCount: 1200, candidatesTokenCount: 150, thoughtsTokenCount: 50 },
});

describe('Extraction (e2e)', () => {
  let app: INestApplicationContext;
  let prisma: PrismaService;
  let extraction: ExtractionService;
  const screen = vi.fn();
  const extract = vi.fn();

  beforeAll(async () => {
    const moduleRef = await Test.createTestingModule({ imports: [AppModule] })
      .overrideProvider(GoogleGenAI)
      .useValue({
        models: {
          generateContent: (request: { model: string }) =>
            request.model.includes('lite') ? screen(request) : extract(request),
        },
      })
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

  const STUDENTSHIP_PAGE =
    '<html><head><title>PhD studentships</title></head><body><nav>Menu</nav><main><h1>Funded PhD</h1><p>Corrosion project</p></main><script>track()</script></body></html>';

  const addPage = (path: string, body = STUDENTSHIP_PAGE) =>
    prisma.rawPage.create({ data: { url: `${PREFIX}${path}`, httpStatus: 200, contentHash: path, body } });

  it('keeps the main content and drops menus and scripts', () => {
    const text = pageText(
      '<title>Opportunities</title><body><nav>Home About</nav><main><h1>PhD</h1><p>Funded</p></main><footer>Contact</footer><script>x()</script></body>',
    );
    expect(text).toBe('Opportunities\n\nPhD\nFunded');
  });

  it('skips the AI for pages that never mention funded MSc or PhD study', async () => {
    const page = await addPage('/about', '<main><h1>About our department</h1><p>We teach undergraduate courses.</p></main>');

    await expect(extraction.extract(page.id)).resolves.toEqual({ status: 'NOT_A_SCHOLARSHIP', opportunities: 0 });
    expect(screen).not.toHaveBeenCalled();
    expect(extract).not.toHaveBeenCalled();
  });

  it('stops after screening when the page is not relevant', async () => {
    const page = await addPage('/news');
    screen.mockResolvedValue(reply({ relevant: false, reason: 'A news article' }));

    await expect(extraction.extract(page.id)).resolves.toEqual({ status: 'NOT_A_SCHOLARSHIP', opportunities: 0 });
    expect(extract).not.toHaveBeenCalled();

    const usage = await prisma.llmUsage.findMany({ where: { rawPageId: page.id } });
    expect(usage.map((row) => row.stage)).toEqual(['screen']);
  });

  it('extracts and saves every opportunity on a relevant page', async () => {
    const page = await addPage('/phds');
    screen.mockResolvedValue(reply({ relevant: true, reason: 'Funded PhD advert' }));
    extract.mockResolvedValue(
      reply({ opportunities: [opportunity, { ...opportunity, title: 'MSc scholarship', level: 'MSC' }] }),
    );

    await expect(extraction.extract(page.id)).resolves.toEqual({ status: 'EXTRACTED', opportunities: 2 });
    expect(extract.mock.calls[0][0]).toMatchObject({ model: 'gemini-3.5-flash' });

    const saved = await prisma.extractedOpportunity.findMany({ where: { rawPageId: page.id }, orderBy: { title: 'asc' } });
    expect(saved.map((row) => row.title)).toEqual(['Funded PhD in corrosion of high entropy alloys', 'MSc scholarship']);
    expect(saved[0].deadline?.toISOString()).toBe('2026-12-01T23:59:59.000Z');
    expect((saved[0].data as Opportunity).officialUrl).toBe(`${PREFIX}/phds`);

    const usage = await prisma.llmUsage.findMany({ where: { rawPageId: page.id }, orderBy: { createdAt: 'asc' } });
    expect(usage.map((row) => row.stage)).toEqual(['screen', 'extract']);
  });

  it('marks the page failed when Gemini gives no usable answer', async () => {
    const page = await addPage('/refused');
    screen.mockResolvedValue(reply({ relevant: true, reason: 'Looks relevant' }));
    extract.mockResolvedValue(reply(null));

    await expect(extraction.extract(page.id)).resolves.toEqual({ status: 'FAILED', opportunities: 0 });
  });

  it('does not call Claude again for a page that was already processed', async () => {
    const page = await addPage('/again');
    screen.mockResolvedValue(reply({ relevant: false, reason: 'Course page' }));
    await extraction.extract(page.id);
    screen.mockClear();

    await expect(extraction.extract(page.id)).resolves.toEqual({ status: 'NOT_A_SCHOLARSHIP', opportunities: 0 });
    expect(screen).not.toHaveBeenCalled();
  });

  it('retries rate limits and only fails a page for a page-specific error', async () => {
    const processor = app.get(ExtractProcessor);
    const busy = await addPage('/rate-limited');
    screen.mockRejectedValueOnce(new ApiError({ message: 'Resource has been exhausted', status: 429 }));
    await expect(processor.process({ data: { rawPageId: busy.id } } as Job<ExtractJob>)).rejects.toThrow('exhausted');
    expect((await prisma.rawPage.findUniqueOrThrow({ where: { id: busy.id } })).extractionStatus).toBe('PENDING');

    const broken = await addPage('/bad-request');
    screen.mockRejectedValueOnce(new ApiError({ message: 'Request contains an invalid argument', status: 400 }));
    await expect(processor.process({ data: { rawPageId: broken.id } } as Job<ExtractJob>)).resolves.toEqual({
      status: 'FAILED',
      opportunities: 0,
    });
  });
});
