import { NestFactory } from '@nestjs/core';

import { AppModule } from './app.module.js';
import { READER_CONTENT_TYPE } from './crawler/reader.js';
import { isOnTopicPost } from './crawler/topics.js';
import { mentionsFundedStudy, NO_FUNDED_STUDY, pageText } from './extraction/page-text.js';
import { PrismaService } from './prisma/prisma.service.js';

const app = await NestFactory.createApplicationContext(AppModule, { logger: ['error'] });
const prisma = app.get(PrismaService);

const found = await prisma.source.findMany({ where: { origin: 'LISTING', isActive: true }, select: { id: true, name: true } });
const offTopic = found.filter((source) => !isOnTopicPost(source.name)).map((source) => source.id);

const paused = await prisma.source.updateMany({ where: { id: { in: offTopic } }, data: { isActive: false } });
const skipped = await prisma.rawPage.updateMany({
  where: { sourceId: { in: offTopic }, extractionStatus: 'PENDING' },
  data: { extractionStatus: 'NOT_A_SCHOLARSHIP', extractionError: 'The post is not about a materials topic' },
});

const waiting = await prisma.rawPage.findMany({
  where: { extractionStatus: 'PENDING' },
  select: { id: true, body: true, contentType: true },
});
const unrelated = waiting
  .filter((page) => !mentionsFundedStudy(page.contentType === READER_CONTENT_TYPE ? page.body : pageText(page.body)))
  .map((page) => page.id);
await prisma.rawPage.updateMany({
  where: { id: { in: unrelated } },
  data: { extractionStatus: 'NOT_A_SCHOLARSHIP', extractionError: NO_FUNDED_STUDY, extractedAt: new Date() },
});

console.log(`Paused ${paused.count} off-topic post links and skipped ${skipped.count} of their waiting pages`);
console.log(`Skipped ${unrelated.length} more waiting pages that never mention funded MSc or PhD study`);
await app.close();
