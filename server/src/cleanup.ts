import { NestFactory } from '@nestjs/core';

import { AppModule } from './app.module.js';
import { PrismaService } from './prisma/prisma.service.js';

const KEEP_DAYS = 14;

const app = await NestFactory.createApplicationContext(AppModule, { logger: ['error'] });
const { count } = await app.get(PrismaService).rawPage.updateMany({
  where: {
    extractionStatus: { not: 'PENDING' },
    fetchedAt: { lt: new Date(Date.now() - KEEP_DAYS * 24 * 60 * 60 * 1000) },
    body: { not: '' },
  },
  data: { body: '' },
});
console.log(`Cleared the stored copy of ${count} processed pages older than ${KEEP_DAYS} days`);
await app.close();
